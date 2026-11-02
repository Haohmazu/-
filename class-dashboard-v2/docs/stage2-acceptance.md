# 第二階段交付與驗收

## 開發範圍

本次僅任務核心完善、學生名單 CSV/XLSX 匯入及範本、部署版本辨識。全部檔案在 `class-dashboard-v2/`，未修改根目錄其他網站。分支 `develop/class-dashboard-v2-stage2-complete` 從 `origin/main` 建立，版本標示 `2.0-stage2.1`、schemaVersion 3。

## 測試結果

Node 32/32 通過，三組 Chromium headless 流程通過，HTML/CSS/JS 共 20 個本機 HTTP 資源 SHA-256 與版本清單一致。

| 要求 | 實際驗證 |
| --- | --- |
| 30 位 CSV | 核心與瀏覽器完整預覽、確認、匯入成功，未確認前學生仍為 0 |
| XLSX | 本機 writer 範本下載與回讀；openpyxl 製作的壓縮 inlineStr 工作簿及 sharedStrings 變體都完成 UI 更新匯入 |
| 重複座號 | CSV/UI 與核心命令拒絕，未改原資料 |
| 錯誤格式 | 標題、引號、座號範圍、超限、ID 重複／不存在、ZIP 校驗／大小均拒絕 |
| 保留 ID | 明確選取既有 ID 後更新姓名，ID 不變，未列入學生不刪除 |
| 保留歷史 | 匯入前建立任務及打卡，更新後 round/checkins 仍存在 |
| 跨日延續 | 注入隔日時間後驗證原輪次 ID、名單及打卡不變，並可繼續打卡 |
| 重複打卡 | UI 與核心拒絕，不重複增加完成數 |
| 補登、取消統計 | 衍生 completed/incomplete/rate/perStudent 隨有效打卡重算 |
| 復原 | 回復最近打卡修改；再次復原拒絕，不能跨名單修訂復原；已取消輪次不能更改 |
| 本輪名單 | 無效人數／門檻拒絕；移除已打卡者需確認，保留 before/after 與打卡快照；確認取消時資料不變 |
| 重整一致 | 名單、ID、門檻、打卡、修訂快照經重新載入一致 |
| Pages 相對路徑 | `/class-dashboard-v2/` 本機 HTTP 載入三組流程、全部版本化資源成功；不是正式 Pages 上線驗證 |

另驗證儲存失敗不更新權威狀態或發成功事件、缺少 Web Locks 顯示原因且不寫入、過期分頁拒絕、匯入後 revision 改變拒絕舊預覽、第一階段功能回歸、文字安全呈現、載入後斷網保存、五種尺寸無頁面水平溢出（1920×1080、1366×768、1280×720、1024×768、390×844）。1366×768 設定畫面另有目視檢查。測試日誌的 intentional renderer failure 是故意注入的核心案例，驗證已保存資料不因 UI listener 失敗回滾。

`tests/fixtures/students-openpyxl.xlsx` 由環境已安裝的 openpyxl 產生，含壓縮 inline string；`students-shared.xlsx` 為同一檔案修改成共用字串的解析測試素材。測試執行不依賴 Python 套件；未聲稱由 Microsoft Excel 實際另存或開啟驗證。

## GitHub 與部署實際證據

| 檢查 | 結果 |
| --- | --- |
| 遠端 main | `63a692f42f76e3407c3b3a50840e96f2680f4064`，merge message 為 PR #1 |
| 前次開發分支 | `develop/class-dashboard-v2-task-core` 指向 `fc31624dad34b1c9c1aa0be91e0ce265eb536103`；檔案樹與 main 完全相同，因此前次修改已合併 |
| 本次開發分支 | `develop/class-dashboard-v2-stage2-complete`，內容為 2.0-stage2.1；本次需另行 PR 確認，不能只合併已完成的 PR #1 |
| Pages 來源 | 最近使用者提供的設定截圖為 Deploy from a branch / main / root；本次即時讀取 API 回覆 Forbidden，無法確認設定是否後來變動 |
| 公開 HTML/CSS/JS | 對 `https://haohmazu.github.io/-/class-dashboard-v2/` 的 CONNECT 遭代理 403 阻擋，未取得 HTTP 頁面內容；無法判斷實際已部署版本或快取。HTTP 000 不是網站返回 404，也不是網站部署失敗的證據 |
| 公開部署狀態／PR API | `gh api` 的 Pages、Actions 及先前 GraphQL 操作遭 Forbidden，沒有以 API 證明部署或 PR 已建立 |
| 本機相對路徑／資源版本 | 20 個資源 SHA-256 全部與 version.json 一致；公開網站比對未能完成 |

不能據此斷言「只是快取」或「網站已修好」。新版本的頁尾、啟動狀態文字為 `2.0-stage2.1`；HTML/CSS/JS 全部使用一致的版本參數。`version.json` 記錄每一個資源的 SHA-256，合併及部署後可在有網路權限的機器執行 `npm run check:deployment` 精確比較；若連線失敗，工具回傳未確認。

此次未修改 Pages 設定。使用者核准本次開發分支 PR 並合併至 main 後，若來源仍為 main/root，GitHub 才會發布新版。若設定已改成其他來源，需恢復對應來源；在取得新證據前不要求使用者任意改設定。既有 `.nojekyll` 保持不動。

## 關於「新版無法做設定」

未取得出問題瀏覽器的錯誤輸出或本機資料，因此無法確認原始原因。可重現的禁止寫入情況包含缺少 Web Locks、資料解析／驗證失敗、過期分頁或儲存拒絕。這些情況現在有初始化、表單與保存失敗提示。UI 初始化改為先掛載基本設定，再掛載任務／匯入，並顯示初始化錯誤；沒有為了讓畫面看似正常而清除或重置資料。

## Windows 11 人工驗收

1. 用 Chrome / Edge 試用開發分支的本機伺服器；未合併前不要期待正式站顯示此版。
2. 以測試名單下載範本，在 Excel 輸入 30 位學生另存 CSV UTF-8 及 XLSX，兩者各試一次預覽與匯入。範本不支援複雜版型、合併儲存格或公式。
3. 重複座號應顯示原因；與既有座號相同時，逐列選擇身分，未確認不可匯入；選不同人造成衝突時先處理座號。
4. 建立任務、打卡、補登、取消、復原並檢查統計。取消輪次保留紀錄但不計有效累計。
5. 修訂本輪名單，移除已打卡學生時先按取消確認未變，再確認修訂並查看 before/after 修正紀錄。門檻超過人數應拒絕。
6. 重新整理、隔日再開啟，任務 ID／名單／進度應保留；更改今日參與不改本輪。
7. 五種尺寸及 Windows 125% 縮放檢查表單、捲動、導覽、座號與確認按鈕；測試 Tab／Esc。
8. PR 核准合併並完成 Pages 部署後，確認頁尾 2.0-stage2.1，再執行公開版本檢查。

未驗證：Windows 原生 Chrome/Edge、真實觸控、Microsoft Excel 真機、正式 Pages 資源。進化僅資料契約：不發魚、無收藏、沒有虛構的已取得狀態。依使用者指令在第二階段停止，不進入第三階段。外部備份還原與舊版遷移不在本次範圍，先以測試資料驗收。

## 本次實際修改檔案

- `README.md`
- `docs/stage2-acceptance.md`
- `index.html`
- `package.json`
- `src/app.js`
- `src/core/migrations.js`
- `src/core/model.js`
- `src/core/store.js`
- `src/core/validation.js`
- `src/features/settlement.js`
- `src/features/statistics.js`
- `src/features/task-validation.js`
- `src/features/tasks.js`
- `src/io/roster.js`
- `src/io/xlsx.js`
- `src/io/zip.js`
- `src/ui/controller.js`
- `src/ui/roster-import.js`
- `src/ui/tasks.js`
- `styles/main.css`
- `tests/core.test.js`
- `tests/fixtures/students-openpyxl.xlsx`
- `tests/fixtures/students-shared.xlsx`
- `tests/stage2-browser.cjs`
- `tests/stage2.test.js`
- `tests/version.test.js`
- `tools/check-deployment.mjs`
- `tools/release.mjs`
- `version.json`

## GitHub 交付狀態

開發分支已成功推送。建立 PR 的實際請求 `gh pr create` 於 `https://api.github.com/graphql` 收到 Forbidden，因此本環境未建立 PR；不可將分支或建立 PR 的預填頁連結當成已存在的 PR。使用者可由 GitHub 提供的 pull/new/develop/class-dashboard-v2-stage2-complete 入口建立審查，不需重新上傳檔案。main 與正式網站保持不變。
