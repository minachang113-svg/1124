const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.resolve(process.env.DATA_FILE || './data/store.json');
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readStore() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { orders: [], bookings: [] }; }
}
function writeStore(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function clean(value, max = 180) { return String(value ?? '').trim().slice(0, max); }
function required(body, fields) { return fields.every((key) => clean(body[key])); }
function admin(req, res, next) {
  const key = req.get('x-admin-key') || req.query.key;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: '請輸入有效的管理金鑰。' });
  next();
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/bookings', (req, res) => {
  const b = req.body || {};
  if (!required(b, ['farm', 'experience', 'date', 'name', 'phone']) || Number(b.people) < 1) return res.status(400).json({ error: '請完整填寫體驗、日期、人數與聯絡資料。' });
  const store = readStore();
  const booking = { id: `B${Date.now().toString(36).toUpperCase()}`, farm: clean(b.farm), experience: clean(b.experience), date: clean(b.date), people: Math.min(30, Math.max(1, Number(b.people))), name: clean(b.name), phone: clean(b.phone), note: clean(b.note, 500), status: '待確認', createdAt: new Date().toISOString() };
  store.bookings.unshift(booking); writeStore(store); res.status(201).json({ message: '已收到預約需求，農場將與您聯繫確認。', booking });
});
app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  if (!required(b, ['product', 'name', 'phone', 'address', 'payment']) || Number(b.quantity) < 1) return res.status(400).json({ error: '請完整填寫商品、數量與收件資料。' });
  const store = readStore();
  const order = { id: `P${Date.now().toString(36).toUpperCase()}`, product: clean(b.product), quantity: Math.min(20, Math.max(1, Number(b.quantity))), name: clean(b.name), phone: clean(b.phone), address: clean(b.address, 300), payment: clean(b.payment), note: clean(b.note, 500), status: '新訂單', createdAt: new Date().toISOString() };
  store.orders.unshift(order); writeStore(store); res.status(201).json({ message: '預購需求已送出，農友將與您確認出貨梯次與付款資訊。', order });
});
app.get('/api/admin/records', admin, (_req, res) => res.json(readStore()));
app.patch('/api/admin/records/:type/:id', admin, (req, res) => {
  const type = req.params.type === 'orders' ? 'orders' : req.params.type === 'bookings' ? 'bookings' : null;
  const allowed = type === 'orders' ? ['新訂單', '待付款', '備貨中', '已出貨', '已完成', '已取消'] : ['待確認', '已確認', '已完成', '已取消'];
  const status = clean(req.body?.status, 30);
  if (!type || !allowed.includes(status)) return res.status(400).json({ error: '無效的項目或狀態。' });
  const store = readStore(), record = store[type].find((item) => item.id === req.params.id);
  if (!record) return res.status(404).json({ error: '找不到這筆資料。' });
  record.status = status; record.updatedAt = new Date().toISOString(); writeStore(store); res.json(record);
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`柿梨創生網站已啟動：http://localhost:${PORT}`));
