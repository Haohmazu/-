# GitHub Pages｜審查與部署操作

唯一專案：https://github.com/haohmazu/- 中的 `class-dashboard-v2/`。
正式入口：https://haohmazu.github.io/-/class-dashboard-v2/index.html （資料夾網址亦可）。

本次為 `develop/class-dashboard-v2-stage4d` / `2.0-stage4D.0` / schema 6。基底 main `ea93dd2` 已合併 4C 的 PR #6。本批次沒有改其他網站、Pages 設定或正式分支；開發分支存在不代表正式站已更新。

## 教師確認後的發布流程

1. 先下載目前正式站完整 JSON 備份。
2. 開啟 4D PR，閱讀變更與 [驗收紀錄](stage4d-acceptance.md)。若自動建立 PR 因環境權限失敗，可從分支的 Compare & pull request 建立，base 必須是 main。
3. 教師確認後才合併 main。Codex 本次不代為合併或觸發正式發布。
4. 到 repository 的 Actions 查看既有 Pages 部署，等待成功。保留原有發布來源，不更改根目錄其他網站、不以子目錄內容取代整個 repository。
5. 開啟上述正式網址，Ctrl＋F5；頁尾／資料管理應顯示 `2.0-stage4D.0`、資料版本 6。關閉其他舊分頁，確認原學生與教室資料存在。

原設定曾由使用者畫面顯示 main / root branch deploy；本環境目前無法讀取 Pages API，因此不能把歷史資訊當成已核實的即時設定。如網站沒有更新，先在 Settings → Pages 確認當前來源，再看部署所用提交；不要直接亂改來源或清除網站資料。

## 版本與路徑檢查

HTML 使用 `./styles/...` 和 `./src/app.js`，ES Modules 用相對 import；沒有依賴網站根路徑。`tools/release.mjs` 將程式版本參數統一，`version.json` 記錄 48 個 HTML/CSS/JS 的 SHA-256。

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

本次本機 48 個資源一致。公開 Pages CONNECT 403、GitHub Pages/PR API Forbidden，故正式站目前即時版本、發布來源及未合併 PR 列表未能獨立確認。Git remote 可核實 main 原始碼版本；它不是 Pages 已部署的證據。

## 更新與復原

4D 不增加資料模型，維持 schema 6，兼容 4C。schema 3/4/5 仍經既有遷移到 6，讀取不自動寫回。學生 ID、歷史與所有教室資料保留。schema 5 的舊版程式不能編輯 schema 6 資料，勿把回退程式版本誤當資料還原。若需要回退，先保留完整 JSON 與原始副本，由教師確認相容性，不透過刪除 localStorage 修復。
