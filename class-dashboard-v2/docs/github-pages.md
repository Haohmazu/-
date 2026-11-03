# GitHub Pages｜審查與部署操作

唯一專案：https://github.com/haohmazu/- 中的 `class-dashboard-v2/`。
正式入口：https://haohmazu.github.io/-/class-dashboard-v2/index.html （資料夾網址亦可）。

本次為 `develop/class-dashboard-v2-three-columns` / `2.0-three-columns.0` / schema 7。main 為 737a5df；PR #10 頭部為 8e19b1c 且尚未在 main。本分支基於 PR #10，包含其雙欄成果再增量調整。本批次沒有改其他網站、Pages 設定或正式分支；開發分支存在不代表正式站已更新。

## 教師確認後的發布流程

1. 先下載目前正式站完整 JSON 備份。
2. 開啟本次首頁布局 PR，閱讀變更與 [驗收紀錄](three-columns-report.md)。若自動建立 PR 因環境權限失敗，可從分支的 Compare & pull request 建立，base 必須是 main。
3. 教師確認後才合併 main。Codex 本次不代為合併或觸發正式發布。
4. 到 repository 的 Actions 查看既有 Pages 部署，等待成功。保留原有發布來源，不更改根目錄其他網站、不以子目錄內容取代整個 repository。
5. 開啟上述正式網址，Ctrl＋F5；頁尾／資料管理應顯示 `2.0-three-columns.0`、資料版本 7。關閉其他舊分頁，確認原學生與教室資料存在。

原設定曾由使用者畫面顯示 main / root branch deploy；本環境目前無法讀取 Pages API，因此不能把歷史資訊當成已核實的即時設定。如網站沒有更新，先在 Settings → Pages 確認當前來源，再看部署所用提交；不要直接亂改來源或清除網站資料。

## 版本與路徑檢查

HTML 使用 `./styles/...` 和 `./src/app.js`，ES Modules 用相對 import；沒有依賴網站根路徑。`tools/release.mjs` 將程式版本參數統一，`version.json` 記錄 54 個 HTML/CSS/JS 的 SHA-256。

有開發工具的協助人員可在此目錄執行：

```sh
npm run version:prepare
npm test
npm run check:deployment
```

檢查器預設正式網址，回傳 0 表示全部內容與目前工作目錄版本一致，1 表示 HTTP 失敗或雜湊不符，2 表示連線／執行受限而無法確認。尚未合併時，正式站與開發版不同是預期結果，不能為了讓檢查通過擅自發布。

本機驗證可用：

```sh
node tools/check-deployment.mjs http://localhost:8000/class-dashboard-v2/
```

本次本機 54 個資源一致。公開 Pages CONNECT 403、GitHub Pages/PR API Forbidden，故正式站目前即時版本、發布來源及未合併 PR 列表未能獨立確認。Git remote 可核實 main 原始碼版本；它不是 Pages 已部署的證據。

## 更新與復原

I-B 由 schema 6 升至 7，僅增加外觀配對，舊 display 設定與所有正式資料保留。schema 3/4/5/6 經既有遷移到 7，讀取不自動寫回。學生 ID、歷史與所有教室資料保留。schema 6（及更舊）的程式不能編輯 schema 7 資料，勿把回退程式版本誤當資料還原。若需要回退，先保留完整 JSON 與原始副本，由教師確認相容性，不透過刪除 localStorage 修復。


## 視覺改善分支

版本 `2.0-visual.0`，資料版本 7；分支 `develop/class-dashboard-v2-visual-restoration`。所有資源使用專案內相對路徑；`version:prepare` 同步快取版本並產生含 SVG 雜湊的 69 項清單。

本次沒有修改 Pages 來源、main 或正式站。此環境 GitHub API／正式站 HTTP 存取受限，無法獨立核實目前正式部署提交；不可把本機成功當成已發布。Git 推送與建立 PR 的結果另列交付報告。

使用者確認 PR 後才自行決定合併；Pages 應維持 main / root，網址仍是 `https://haohmazu.github.io/-/class-dashboard-v2/index.html`。發布後先看新版本號，必要時 Ctrl+F5；勿清除網站資料解決快取問題。`docs/screenshots/visual` 是審查用 JPEG，不被首頁載入。


## 本次首頁布局交付

只有開發分支，未修改 Pages 來源或 main。Git 遠端 main 在開工時為 `737a5df`；公開正式站及 Pages API 仍受環境 403 限制，無法核實當前部署提交。原版參考站亦因 CONNECT 403 無法重新抓取，因此依使用者本次明確版面規格重整，不宣稱已重新逐項檢視原站。路徑與相對資源以本機 HTTP 的 `/class-dashboard-v2/` 驗證。

本次版本清單含 71 項 HTML／CSS／JS／SVG。所有截圖僅為審查文件，不會載入首頁。正式網址不變。


## 三欄交付與依賴

版本2.0-three-columns.0，schema7。PR以main為目標，包含PR #10尚未合併內容；程式基準是其最新8e19b1c，沒有平行重寫。使用者可先審查本次增量（8e19b1c之後提交），由使用者決定合併順序。Codex不合併、關閉既有PR或發布網站。

本機HTTP驗證73項資源路徑與雜湊。Pages API／公開正式站仍受403限制；遠端main提交可由Git確認，不代表已核實當前公開站部署。正式網址保持不變，部署前先備份，部署後確認版本；不要清空本機資料解決快取。
