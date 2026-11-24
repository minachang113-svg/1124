const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const monthPicker = $('#month-picker');
for (let month = 1; month <= 12; month++) monthPicker.add(new Option(`${month} 月`, month));
monthPicker.value = new Date().getMonth() + 1;
function updateSeason(month) {
  const pear = month >= 5 && month <= 8;
  const persimmon = month >= 9 && month <= 12;
  $('#season-message').textContent = pear ? '水梨正當季｜高接梨・新世紀' : persimmon ? '甜柿正當季｜早秋、次郎、花御所與富有' : '果樹休養時節｜預約農遊，認識山城日常';
  $$('[data-months]').forEach((row) => row.classList.toggle('is-current', row.dataset.months.split(',').includes(String(month))));
}
monthPicker.addEventListener('change', () => updateSeason(Number(monthPicker.value)));
updateSeason(Number(monthPicker.value));
$('#year').textContent = new Date().getFullYear();

const menuButton = $('.menu-toggle');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  $('.nav').classList.toggle('is-open', !open);
});
$$('.nav a').forEach((link) => link.addEventListener('click', () => {
  $('.nav').classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false');
}));

function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
async function postForm(form, endpoint) {
  const message = $('.form-message', form);
  const button = $('button[type="submit"]', form);
  message.textContent = '資料送出中…'; button.disabled = true;
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData(form)) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '送出失敗，請稍後再試。');
    message.textContent = `${data.message}（查詢編號 ${data.booking?.id || data.order?.id}）`;
    form.reset();
    if (form.id === 'booking-form') $('input[name="people"]', form).value = 2;
    if (form.id === 'order-form') $('input[name="quantity"]', form).value = 1;
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
}
$('#booking-form').addEventListener('submit', (event) => { event.preventDefault(); postForm(event.currentTarget, '/api/bookings'); });
$('#order-form').addEventListener('submit', (event) => { event.preventDefault(); postForm(event.currentTarget, '/api/orders'); });

const adminForm = $('#admin-login');
const adminMessage = $('#admin-message');
const recordRoot = $('#admin-records');
const statusOptions = { orders: ['新訂單', '待付款', '備貨中', '已出貨', '已完成', '已取消'], bookings: ['待確認', '已確認', '已完成', '已取消'] };
function escapeHtml(text) { return String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function recordCard(item, type) {
  const details = type === 'orders'
    ? `${item.product}・${item.quantity} 箱｜${item.name}｜${item.phone}｜${item.address}｜${item.payment}`
    : `${item.farm}・${item.experience}｜${item.date}｜${item.people} 人｜${item.name}｜${item.phone}`;
  const statusSelect = statusOptions[type].map((status) => `<option ${item.status === status ? 'selected' : ''}>${status}</option>`).join('');
  return `<article class="record-card"><div><b>${escapeHtml(item.id)}</b><time>${new Date(item.createdAt).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })}</time><p>${escapeHtml(details)}</p>${item.note ? `<small>備註：${escapeHtml(item.note)}</small>` : ''}</div><label>狀態<select data-type="${type}" data-id="${escapeHtml(item.id)}">${statusSelect}</select></label></article>`;
}
function renderRecords(data) {
  const orders = data.orders || [], bookings = data.bookings || [];
  recordRoot.innerHTML = `<div class="record-section"><h3>預購單 <span>${orders.length}</span></h3>${orders.length ? orders.map((item) => recordCard(item, 'orders')).join('') : '<div class="empty-state">目前沒有預購單。</div>'}</div><div class="record-section"><h3>體驗預約 <span>${bookings.length}</span></h3>${bookings.length ? bookings.map((item) => recordCard(item, 'bookings')).join('') : '<div class="empty-state">目前沒有體驗預約。</div>'}</div>`;
  $$('select[data-id]', recordRoot).forEach((select) => select.addEventListener('change', async () => {
    try {
      const response = await fetch(`/api/admin/records/${select.dataset.type}/${encodeURIComponent(select.dataset.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': sessionStorage.getItem('adminKey') }, body: JSON.stringify({ status: select.value }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || '更新失敗');
      adminMessage.textContent = `${result.id} 狀態已更新為「${result.status}」。`;
    } catch (error) { adminMessage.textContent = error.message; }
  }));
}
adminForm.addEventListener('submit', async (event) => {
  event.preventDefault(); const key = $('#admin-key').value;
  adminMessage.textContent = '讀取資料中…';
  try {
    const response = await fetch('/api/admin/records', { headers: { 'x-admin-key': key } }); const data = await response.json();
    if (!response.ok) throw new Error(data.error || '無法讀取資料');
    sessionStorage.setItem('adminKey', key); renderRecords(data); adminMessage.textContent = '已載入最新需求。';
  } catch (error) { adminMessage.textContent = error.message; recordRoot.innerHTML = '<div class="empty-state">請檢查管理金鑰後再試。</div>'; }
});
