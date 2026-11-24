# 台中東勢「柿梨創生」地方體驗與產地直達平台

以單頁響應式網站呈現東勢高接梨、甜柿職人故事、產季指南、農遊預約與產地預購。使用 Node.js + Express 提供靜態網站與輕量 JSON API，無前端建置步驟。

## 專案結構

```text
.
├── server.js                 # Express 靜態網站與 API
├── package.json
├── .env.example              # 環境變數範例
├── data/
│   └── store.json            # API 首次寫入時建立（本機）
└── public/
    ├── index.html            # 五大模組與表單
    ├── styles.css            # RWD、色彩與版面
    ├── app.js                # 產季互動、表單、農友後台
    └── images/               # 東勢實地攝影素材放置處
```

## 本機啟動

需求：Node.js 18 或更新版本。

```bash
npm install
```

`.env.example` 是環境變數範例；此專案不會自動載入 `.env`，請在終端機或部署平台設定環境變數，再啟動：

```bash
# macOS / Linux
ADMIN_KEY=your-private-key npm start

# PowerShell
$env:ADMIN_KEY="your-private-key"; npm start
```

開啟 `http://localhost:3000`。也可設定 `PORT` 與 `DATA_FILE`。不使用 `.env` 載入套件，避免增加部署依賴。

## API

- `GET /api/health`：服務健康狀態。
- `POST /api/bookings`：建立體驗預約，必要欄位 `farm`, `experience`, `date`, `people`, `name`, `phone`。
- `POST /api/orders`：建立預購需求，必要欄位 `product`, `quantity`, `name`, `phone`, `address`, `payment`。
- `GET /api/admin/records`：讀取預購與預約清單，需 `x-admin-key` 標頭。
- `PATCH /api/admin/records/:type/:id`：更新狀態，`:type` 為 `orders` 或 `bookings`，需 `x-admin-key` 標頭。

表單目前是需求登記，不會向消費者收款；LINE Pay、ATM 及貨到付款只提供流程選擇與聯繫說明，正式金流需另行串接服務商。請勿將管理金鑰放入前端程式碼。

## GitHub 推送

在專案目錄初始化 Git，提交程式碼並推送至自己的 GitHub repository：

```bash
git init
git add .
git commit -m "Build Dongshi local creation site"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repository>.git
git push -u origin main
```

請勿提交 `.env` 或真實訂單資料。此範例的 JSON 檔適合展示或單一執行個體原型；正式營運建議改用 Render Postgres 或外部持久化資料庫。Render 一般 Web Service 的本機檔案系統可能在重新部署或重啟後重置。

## Render 部署

1. 在 Render 建立 **Web Service**，連結 GitHub repository。
2. Runtime 選 Node，Build Command 設為 `npm install`，Start Command 設為 `npm start`。
3. 在 Environment 加入 `ADMIN_KEY`（自行設定長且不重複的密鑰）。Render 會自動提供 `PORT`，伺服器綁定 `0.0.0.0`。
4. 部署完成後以 `https://<service-name>.onrender.com` 開啟網站；可用 `/api/health` 確認服務。
5. 若要保留真實訂單與預約，請先配置持久化資料庫，再投入正式使用。

## 上線前素材與營運事項

- `public/images/` 預留東勢實地攝影素材。首頁插畫為風格示意，頁面已標示需更換為東勢果園、大甲溪、職人及農場的授權實拍；網站沒有宣稱示意插畫為實景。
- 確認農場名稱、體驗檔期、認證標章與農友故事細節，並取得使用照片與標章的授權。
- 正式收集聯絡資料前，補上隱私權告知、保存期限與資料刪除流程；正式交易前補上價格、箱規、運費、退換貨與付款政策。
