# Stage 4C｜影音清單與智慧播放驗收

版本 `2.0-stage4C.0` / schema 6。工作範圍只有 `class-dashboard-v2/`。基底為 main `2ab1baa`（PR #5，4B 已合併），開發分支 `develop/class-dashboard-v2-stage4c`。本批次停止於 4C，不合併 main、不更新正式站、不進入 4D。

## 完成項目

- 共用 4B 的一個 audio、一個 video 與單一播放協調器；沒有另建播放器或儲存入口。
- 網址庫新增、編輯、確認刪除、排序、搜尋、分類及最愛；保存穩定 ID、名稱、類型、安全且正規化的 HTTPS URL、來源、分類 ID、最愛狀態。陣列順序就是權威排序，不另外保存易失配的排序數字。
- 九種預設分類及自訂分類；改名保留 ID，刪除分類需確認並把既有項目移至保留的其他分類。最多 50 分類、500 網址；音樂僅直接音訊，影片可為直接影片或明確支援的 YouTube。
- 一鍵播放保存來源、互斥、切換及關閉影片清理、背景音樂迷你控制。失效來源保留原清單，可編輯或查看／開啟合法原始來源；原始連結開啟前停止本站音源。
- 音量、靜音、倍速、循環與隨機保存。原生影片控制的偏好也經集中命令保存，失敗恢復前值。
- 可選計時開始／繼續音樂、同步暫停、結束暫停／停止／繼續，以及結束暫停影片。僅在成功保存的計時命令後執行，不由畫面重繪觸發。預設不自動播放；讀取、重整、JSON 還原均不啟動影音。被瀏覽器阻擋仍保留倒數，主畫面迷你列可查看中文原因。
- YouTube 採官方 IFrame API 的 pauseVideo；未就緒時卸載以避免繼續發聲，API 錯誤與禁止嵌入提示不破壞清單或教室工具。沒有任意跨站 iframe。
- 完整 JSON 涵蓋新資料；預覽含影音及分類數量。沒有把本機檔案、檔案內容或暫態 Blob URL 存入資料。

## 資料相容性與交易

1→2→3→4→5 的原遷移保留，5→6 僅增加 `mediaLibrary`。學生 ID／姓名／座號、作息、課表／調課、聯絡簿、抽號與停用的任務歷史／打卡不變。讀取只在記憶體升版，不覆寫原始資料；第一筆成功操作才保存 schema 6。

新命令仍經原 `class-dashboard-v2-write` Web Lock、完整原始快照比較、全模型驗證與 localStorage 成功寫入。失敗不提交、不發成功事件。舊分頁與同 revision 外部修改仍被拒絕；還原另有預覽 revision 比對。舊版不能解析 schema 6，請升級前下載備份並關閉舊分頁，不要讓新舊版同時編輯。

清單成功提交才同步播放器：只改名稱／分類／最愛／順序不重播；改現行 URL／類型或刪除才停止。刪連動選曲或改成影片會清掉連動引用。還原清單不自動播放。本機佇列只存在記憶體，清空暫存不刪永久網址；Blob 由原協調器精確釋放。

## 可重複測試與實際結果

在 repository 根目錄啟動 Python HTTP server，本次使用 8010；以下命令於 `class-dashboard-v2/` 執行：

```sh
npm run version:prepare
npm test
TEST_URL=http://127.0.0.1:8010/class-dashboard-v2/ npm run test:browser
node tools/check-deployment.mjs http://127.0.0.1:8010/class-dashboard-v2/
git diff --check
```

- Node：66/66 通過（12 項新增 4C 測試，54 項既有資料／展示／媒體／匯入回歸）。測試故意輸出的 intentional renderer failure 是驗證壞掉的 UI listener 不破壞已保存資料；不是未解釋失敗。
- Chromium 第三階段流程通過：學生 CSV/XLSX、課表 CSV/XLSX、學期、作息／調課、計時、聯絡簿、抽號、備份還原、任務停用、歷史保留。
- Chromium 4A 通過：專注／全螢幕、隱私、快捷鍵、主題／布局／字體、觸控、reduced-motion、六尺寸。
- Chromium 4B 通過：真實 WAV/MP3/WebM/MP4 解碼、控制／循環／進度、影片全螢幕、背景迷你列、影片關閉與 Blob 釋放。4C 允許保存播放偏好，因此回歸比較排除合法的偏好／revision／savedAt，仍逐項比對全部教室與歷史資料。
- Chromium 4C 通過：schema 5 唯讀升 6；網址 CRUD／ID／分類／最愛／排序／搜尋；名稱作文字呈現；來源修改停止、偏好與重載；計時開始／暫停／繼續與三種音樂結束規則、影片結束暫停；重載不自播；官方 API 暫停測試替身；完整 JSON 真實下載／預覽／還原及無效資料拒絕；HTTP 網址拒絕；過期頁拒寫、Quota 失敗保留現行播放／資料並回復偏好；播放被瀏覽器阻擋仍正常計時；五尺寸 1920×1080、1366×768、1280×720、1024×768、390×844；只有一對 audio/video，無未處理 pageerror。
- 本機 HTTP：48 個 HTML/CSS/JS 與 version.json 的 SHA-256 一致，相對資源路徑正常。
- `git diff --check` 通過；變更全部在允許的子目錄。

測試中的 HTTPS 外部來源由 Playwright 回傳合成媒體 fixture，再由真實瀏覽器原生解碼；這證明播放整合，不代表任意網路來源可存取。YouTube iframe 與 API 使用測試回應／替身，只證明 URL、呼叫、關閉及錯誤降級流程；**未驗證真實 YouTube 播放、廣告、來源政策或教室網路**。

## Windows 11 人工驗收

不需命令列，正式發布後用 Chrome／Edge 開啟正式網址，頁尾應顯示 `2.0-stage4C.0`；尚未合併此分支時不會出現此版。

1. 先在教師設定 → 資料管理下載原完整 JSON，確認學生／課表等資料正確。
2. 多媒體中心 → 新增／編輯影音網址，保存兩首可合法直接播放的 HTTPS 音訊、直接影片及允許嵌入的 YouTube。重新整理確認保留，再用音樂／影片／最愛、搜尋、分類找出一筆點播放。
3. 修改名稱、來源與分類、上移下移、刪除確認。驗證改名稱不重播，改來源才停止；刪分類保留項目。查看來源網址應只顯示文字與 HTTPS 連結。
4. 關閉音樂視窗用迷你列暫停／繼續；改播影片確認音樂停止；影片關閉及 Esc 退出後無聲。選本機檔案、刷新後應需要重新選取。
5. 設定計時連動的選曲與結束行為，再到教室工具設 5–10 秒。測開始、暫停、繼續及結束三選項。預設不啟用音樂連動；重整不自行發聲。確認提示音音量與媒體音量獨立。
6. 分別測可播放、禁止嵌入及網路受阻的 YouTube；計時結束時已就緒 API 應暫停，未就緒應移除。外部平台錯誤不清掉清單，課表／倒數仍正常。
7. 下載新版完整 JSON → 修改清單 → 預覽／確認還原 → 驗證影音、偏好、學生、課表及歷史；無效備份不應覆蓋。
8. 用教室喇叭／白板／投影機、Chrome 與 Edge 實測音量、觸控與全螢幕。Linux Chromium 自動化不等於上述 Windows 實機已驗收。

## GitHub / Pages 與限制

本次未改 Pages 設定，未合併 main 或更新正式網站。main 原始碼可確認為 PR #5 / Stage 4B schema 5；正式 Pages 即時資源與目前來源設定無法獨立確認：GitHub API（含 PR 列表／Pages）回覆 Forbidden，公開 Pages HTTPS 連線由環境代理回覆 CONNECT 403。這是檢查受限，不代表正式站出錯或已更新。提交與推送、建立 PR 的實際結果另於交付訊息列明；禁止捏造 PR 編號。

YouTube 官方 API 需要網路，直接影音需 HTTPS、來源允許、瀏覽器支援實際編碼；不能繞過平台保護、嵌入限制或廣告。網站沒有帳號權限，投影隱私不會遮蔽教師主動展示的媒體名稱／網址。無 Service Worker；已載入後的本機教室工具可離線操作，未載入的外部媒體及離線重整不保證可用。

選配的獨立瀏覽器視窗延後；不建立跨視窗播放同步。4D 最終整合批次尚未開始。不得恢復任務操作或水族箱。

## 修改檔案

新增：`src/library/model.js`、`src/library/commands.js`、`src/ui/library.js`、`src/media/timer-link.js`、`src/media/youtube.js`、`tests/library.test.js`、`tests/stage4c-browser.cjs`、本紀錄。

功能修改：`index.html`、`styles/media.css`、`src/app.js`、`src/core/model.js`、`migrations.js`、`validation.js`、`store.js`、`src/media/coordinator.js`、`src/ui/media.js`、`src/ui/backup.js`。

測試及交付：`package.json`、`tests/display.test.js`、`tests/stage3.test.js`、`tests/stage3-browser.cjs`、`tests/stage4a-browser.cjs`、`tests/stage4b-browser.cjs`、`tests/version.test.js`、`tools/release.mjs`、`version.json`、`README.md`。其他原有模組的 diff 僅為 release 工具統一更新 ES import 版本參數（包含未載入的 legacy），不啟用舊功能。完整列表可由 PR 的 Files changed 核對。
