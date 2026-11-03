# Stage 4D｜第四階段完整整合驗收

驗收日期：2026-11-03（臺灣）。應用版本 `2.0-stage4D.0`，資料版本維持 schema 6。唯一變更範圍 `class-dashboard-v2/`。

main 基底 `ea93dd2`（已合併 4C PR #6），開發分支 `develop/class-dashboard-v2-stage4d`。本批次未合併 main、未改 Pages 設定、未發布正式站，完成後停止，不進入第五階段。

## 各批次整合結果

| 批次 | 實作及回歸結果 | 未驗證／延後事項 |
| --- | --- | --- |
| 4A | 原生全螢幕、四種專注、隱私、三布局／主題、四字體、輸入安全快捷鍵、觸控與焦點；Chromium 流程通過 | Windows Chrome/Edge、教室白板與投影實機尚待人工驗收 |
| 4B | 共用子畫面、原生音樂／影片、官方 YouTube iframe、單一協調器、迷你列、互斥、關閉影片與 Blob 清理；真實 WAV/MP3/WebM/MP4 解碼測試通過 | 真實外部來源、網路授權、YouTube 政策／廣告與喇叭未驗證；網路部分使用受控測試回應 |
| 4C | 網址 CRUD、穩定 ID、分類／最愛／順序／搜尋、一鍵播放、偏好、計時連動、JSON 整合；流程通過 | 選配獨立瀏覽器視窗延後，不另建播放器或跨視窗同步 |
| 4D | 資料完整性、混合來源壓力、回歸、焦點、錯誤恢復、六尺寸及文件完成；本機驗證通過 | 公開 Pages/API 被環境拒絕，正式站即時部署驗收未完成 |

前三批次的詳細歷史證據保留：[4A](stage4a-acceptance.md)、[4B](stage4b-acceptance.md)、[4C](stage4c-acceptance.md)。本次只修正既有模組，不建立新的播放器、顯示核心或儲存入口。

## 4D 找到並修正的問題

1. **YouTube API 暫時載入失敗後無法重試**：原程式持續快取被拒絕的 Promise。現在失敗後清掉該快取與失敗腳本，恢復原回呼，之後重新點選可重試；同時只保留一個進行中的載入。逾時及失敗均有中文提示。
2. **改播已保存來源仍殘留上一筆錯誤**：切換分頁會先重繪舊來源，重新黏住舊錯誤。現在在分頁切換後、播放新來源前清除舊提示；新來源若失敗仍顯示其真實原因。
3. **收藏／排序後鍵盤焦點落回頁面**：清單重建會移除原按鈕。現在依穩定項目 ID 與操作名稱恢復可用按鈕；被篩掉或刪除時移到相鄰項目，沒有項目時移到清單選擇器。

## 資料版本、遷移及權威紀錄

4D 沒有新增持久化欄位，因此**維持 schema 6，不製造無需要的資料遷移**。既有 1→2→3→4→5→6 遷移鏈、集中 store、Web Locks、完整原始快照與過期預覽保護不變。

`tests/fixtures/stage4c-state.json` 由既有 store 的真實命令產生 schema 6 測試資料，含分類、直接音樂／影片、YouTube、最愛、排序、偏好、連動及舊歷史；不包含真實教師私人資料。新測試逐欄比對：

- schema 3、4、5 可升至 6，學生內部 ID、姓名／座號、既有課表／作息、聯絡簿、抽號與歷史不變，讀取不自動寫回。
- schema 6 完整讀取與 JSON 往返保持全部欄位，不清掉 4C 的清單、偏好或連動。
- 無效／未來版本資料鎖定一般寫入，保留精確原始文字供保護副本；不以初始化或清空資料修復。
- 寫入失敗不變更狀態、revision、原始資料或發成功事件；失敗還原不覆蓋。
- Web Lock 名稱維持 `class-dashboard-v2-write`，瀏覽器實際命令使用此鎖；兩個已讀取分頁競爭時，後者不能覆蓋新資料。
- 網址庫拒絕不安全協定、額外 HTML 欄位、重複 ID、錯誤分類／選曲引用及無效偏好；文字不當 HTML 執行。
- 任務操作與水族箱仍停用／取消，舊任務歷史保留且沒有背景操作。

## 可重複執行與實際結果

本次執行環境 Linux／Node.js／Chromium。先於 repository 根目錄啟動 Python HTTP server，本次使用 8011，再於 `class-dashboard-v2/` 執行：

```sh
npm run version:prepare
npm test
TEST_URL=http://127.0.0.1:8011/class-dashboard-v2/ npm run test:browser
node tools/check-deployment.mjs http://127.0.0.1:8011/class-dashboard-v2/
git diff --check
```

結果：**74 項 Node 測試全部通過；五個瀏覽器流程全部通過；48 個 HTML/CSS/JS 本機 HTTP 資源與 version.json 雜湊一致；diff whitespace 檢查通過。** 沒有未解釋的失敗。Node 日誌中的 intentional renderer failure 是既有測試故意模擬壞掉的畫面 listener，用來驗證資料仍可靠保存。

| 測試來源 | 實際驗證範圍 |
| --- | --- |
| 既有 66 項 Node | 班級、名單、課表／作息、工具、歷史、版本遷移、備份、隱私展示、播放協調與網址庫、Quota／過期頁、計時連動 |
| 新增 8 項 Node（stage4d.test.js） | 完整 schema 6 往返、3/4/5 遷移、還原／保存失敗、損壞原始資料保護、雙分頁寫入鎖、嚴格 URL/JSON 驗證、500 次混合來源資源檢查、停止後延遲事件不復活 |
| 第三階段瀏覽器 | 學生新增編輯及 30 人 CSV/XLSX、範本、作息、固定／今日／整週課表、CSV/XLSX 課表、調課、學期、時鐘、時間戳倒數、聯絡簿、抽號、完整 JSON 與歷史保留 |
| 4A 瀏覽器 | 真實 Fullscreen API 進出／拒絕、四專注、隱私及跨頁保護、快捷鍵／輸入法、三布局三主題四字體、觸控、六尺寸、reduced-motion |
| 4B 瀏覽器 | 真實 WAV/MP3/WebM/MP4 解碼、播放暫停停止／上一下一首、音量靜音、進度倍速、循環隨機、影片全螢幕、背景迷你列、關閉清理、互斥、錯誤、Blob 釋放 |
| 4C 瀏覽器 | CRUD／ID／分類／最愛／排序／搜尋、持久化與不自播、來源修改後停止、原生偏好、計時開始暫停繼續／結束三選項／影片暫停、真實 JSON 下載預覽還原、無效 JSON/URL、Quota、過期頁、播放阻擋仍計時 |
| 新增 4D 瀏覽器 | schema 6 讀取不寫回、初始不載入第三方 API、清單焦點／Tab 限制在 dialog／Esc 返回、來源錯誤恢復、YouTube 網路失敗重試／100/101/150 錯誤／關閉後延遲回呼、16 次真實 WAV/MP4 交替播放及資源檢查、六尺寸特大字與三組主題布局、觸控與投影隱私、真實 Web Lock 使用及教室資料逐欄不變 |

六尺寸：1920×1080、1366×768、1280×720、1024×768、1180×820（平板橫式）、390×844（手機直式）。模態窗不超出畫面、無水平溢出，重要按鈕可見可觸控，關閉及返回可操作。4A 原有測試另覆蓋全部字體／專注組合。

## 效能與資源證據及界限

- Node 以兩個固定的媒體替身反覆混合本機音樂、本機影片及 YouTube 共 500 次，事件監聽器上限 10、不累積，iframe 不超過 1，停止／關閉影片後來源卸載。
- Chromium 以兩個固定原生元素實際交替解碼 WAV／MP4 共 16 次，確認同時只有一個主要音源、影片關閉後 readyState 回到 0、src 清掉、事件上限 10；只建兩個本機檔案 Blob，清空後精確回收兩個，永久清單保留。
- 單曲／全部／不循環／隨機的完成事件及 Blob 清理已有 4B 真實原生流程與 Node 覆蓋；停止後暫態 Blob 保留供佇列重播，清空或頁面銷毀才回收。
- 不把實際影音或 Blob 存進 localStorage／JSON。影音載入錯誤不修改課表、學生、聯絡簿或抽號。

這是有界壓力與生命週期檢查，**不是數小時播放或記憶體 heap 長期量測的證明**。未在實體白板或長時間教室使用環境做 soak test。

## 音樂、影片與 YouTube 支援界線

本機 MP3/WAV、MP4/WebM 已有真實 Chromium 解碼；其他格式依瀏覽器支援實際編碼，不以副檔名保證。線上來源只接受不含帳密的 HTTPS；直接來源使用原生媒體元素，只有明確支援的 YouTube 使用官方 iframe／API。

外部 HTTPS 音訊／影片測試由 Playwright 回傳合成 fixture，再以真實瀏覽器解碼；YouTube 使用官方 URL 配合受控 iframe／API 替身。API 失敗、重試、禁止嵌入錯誤碼、暫停及關閉流程均測試，但**不能宣稱任意真實 YouTube 影片、廣告、來源政策、學校網路皆正常**。不下載受保護內容、不繞過嵌入或播放限制；API 未就緒的計時暫停會停止並移除播放器以避免留下聲音。

## GitHub 與 Pages 檢查

- 預設分支 main，以 Git remote 核實；起點 `ea93dd2` 已合併 PR #6，程式為 `2.0-stage4C.0`／schema 6。
- 本分支 `2.0-stage4D.0`／schema 6，48 個相對資源載入及 SHA-256 本機比對通過。
- GitHub PR 列表與 Pages API 回覆 Forbidden；公開 Pages 由環境代理回覆 CONNECT 403。因此尚未獨立核實目前 Pages 來源、是否有其他未合併 PR、正式 HTML/CSS/JS 即時版本或快取狀態。不能把 main 程式版本當成網站已部署的證據。
- 本次不更動 Pages，未合併 main，不覆蓋根目錄其他網站。提交／推送與建立 PR 的實際結果由交付訊息列明，不能把建立頁面連結稱為已存在的 PR。

教師確認後的發布與驗證步驟見 [GitHub Pages](github-pages.md)。Windows 11 使用方式與實機清單見 [操作說明](windows11-guide.md)。

## 修改檔案

功能修正：`src/media/youtube.js`（可重試載入與清理）、`src/ui/media.js`（清除前一來源錯誤）、`src/ui/library.js`（清單操作焦點）。

新增測試：`tests/stage4d.test.js`、`tests/stage4d-browser.cjs`、`tests/fixtures/stage4c-state.json`；`package.json` 加入 4D 及完整連續回歸。版本更新：`index.html`、`src/app.js`、`src/ui/backup.js`、`tools/release.mjs`、`tests/version.test.js`、`version.json`。原有其他模組 diff 僅為同版 ES import 查詢參數，包含未載入 legacy，未啟用舊功能。

文件：`README.md`、本紀錄、`docs/windows11-guide.md`、`docs/github-pages.md`。完整提交檔案清單可於 PR 的 Files changed 核對；所有路徑都在 `class-dashboard-v2/`。

## 尚待確認及停止範圍

Windows 11 Chrome/Edge、Microsoft Excel、電子白板／投影／喇叭、真實第三方媒體與正式 Pages 需人工或有網路權限的環境驗收。選配獨立瀏覽器視窗延後。沒有 Service Worker；離線重整不保證，外部媒體依賴網路。

第四階段已實作軟體項目與可執行驗收交付後停止，保留上述未驗證界限；未開始第五階段的報表、完整封存或進階診斷。
