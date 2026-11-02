# 4A｜教室展示與操作驗收

## 範圍與 Git 起點

本次只處理 4A，不包含 4B／4C／4D 影音、播放器、清單或計時連動。水族箱維持取消、任務維持暫停。

- Repository：haohmazu/-；唯一修改目錄 class-dashboard-v2/。
- 預設分支經 Git remote show 確認為 main。
- main 起點：26fded4（Merge pull request #3），版本 2.0-stage3.0，schema 4。
- 工作開始時 Git 工作區乾淨；建立 develop/class-dashboard-v2-stage4a。
- 本次版本：2.0-stage4A.0，schema 5。未合併 main，未改 Pages 設定或正式站。
- API 查詢未合併 PR 與 Pages 設定遭 Forbidden，無法確認未合併 PR 清單或即時部署來源。
- 公開 version.json 請求被代理以 CONNECT 403 拒絕（HTTP 000），不是網站返回 404，也不是已部署失敗證據。公開資源版本未獨立核實；不憑 main 推定已上線。

## 已實作與依賴

| 4A 項目 | 實作 |
| --- | --- |
| 01 全螢幕 | requestFullscreen / exitFullscreen、fullscreenchange / fullscreenerror、狀態、拒絕及不支援提示。全螢幕不存入 localStorage |
| 02 四種專注 | 時鐘、倒數（剩餘進度條）、今日課表（含下一節）、抽號（保存後才播放短動畫），直接重用第三階段 DOM 與命令 |
| 03 獨立狀態 | 可全螢幕切專注或在專注進出全螢幕；按鈕或 Esc 不重載、不重設 deadline／抽號 |
| 04 投影隱私 | 關閉敏感設定與阻擋入口／快捷鍵，重整保留，必須明確關閉；跨分頁啟用時先關閉本頁設定 |
| 05 布局 | 標準、時鐘優先、課表優先保存 |
| 06 字體 | 小／中／大／特大保存；時鐘、課表、倒數、聯絡簿、抽號套用，數字受容器與畫面高度上限保護 |
| 07 主題 | 深海預設、明亮、高對比；reduced-motion 停止抽選動畫 |
| 08 快速列 | 真全螢幕、專注、返回、字體、主題、布局、隱私、教師設定與快捷鍵說明；多媒體只有 hidden 擴充位置，沒有假播放按鈕 |
| 09 快捷鍵 | 0–4／F／S／倒數空白鍵；輸入法、文字、對話框、表單、原生控制項、瀏覽器組合鍵不攔截 |
| 10 觸控與回饋 | 主要操作 48–64 px 目標、設定關閉列固定可及、錯誤不自動消失；小畫面可捲動 |

4B 只能在使用者確認後另外開始。可沿用 #multimedia-slot 作為將來入口，但本次沒有建立任何音樂／影片播放協調器。日常計時提示音仍使用第三階段原有模組。

## 資料相容性

新增單一 `display`：

```json
{"focus":"home","privacy":false,"layout":"standard","font":"medium","theme":"ocean"}
```

4→5 只加入這份預設展示資料；1→2→3→4 遷移保留。學生 ID、姓名、座號、所有學期課表／作息／單日調課、計時器 deadline、聯絡簿、參與、抽號、templates／rounds／checkins／audit／rosterImports 均保留。讀取不寫回，成功命令才原子保存。

SET_DISPLAY 僅允許五個明確欄位，禁止修改其他教室資料或接受不合法值。Web Locks 名稱、原始快照與過期分頁防護保留。展示寫入失敗維持舊模式、不宣告成功。完整 JSON 自動包含 display，舊 schema 4 備份讀取時遷移，無效／未來版拒絕。全螢幕是瀏覽器暫態，不備份、不自動恢復。

stage3-state.json 是使用 main 的真實第三階段 createStore 產生的合成資料，包含舊任務兩輪、學生、單日調課、聯絡簿、已抽座號、今日參與與暫停計時器。測試逐欄比較：展示操作不修改任何教室權威欄位；運行中的計時與全螢幕切換也保留相同 deadline。舊版 schema 4 程式無法接受 schema 5，仍建議升級前備份並關閉舊分頁，避免舊快取造成畫面與資料版本不一致。

投影隱私不是帳號或資料存取權限。只限制畫面入口，不能阻止 DevTools、備份或電腦檔案存取。外部分頁啟用隱私後，過期頁面保持關閉敏感設定並要求重新整理，避免自動解除保護。

## 實際測試

### 核心

`npm test`：43 項通過、0 失敗、0 跳過。

含 9 項展示測試、原班級／資料安全／課表／計時器／聯絡簿／抽號回歸，以及版本清單完整性。Fullscreen 核心測試使用 EventTarget 模擬成功、拒絕及不支援，明確不視為實際瀏覽器驗證。

### Chromium 實際瀏覽器

`npm run test:browser` 執行第三階段完整回歸及 stage4a-browser.cjs，兩組流程通過：

- 真實 requestFullscreen 進入、Esc／exitFullscreen 退出，檢查 document.fullscreenElement；沒有 CSS 假全螢幕。
- 運行中倒數進入全螢幕、切換專注再退出，deadline 保持相同，抽號狀態不變。
- 四種專注可操作；今日七節及下一節、進度條增減與比例上限、返回主畫面。
- 隱私阻擋教師／名單／敏感分頁與 S 快捷鍵、重整保留、跨分頁啟用時即關閉設定。
- 文字輸入／IME／對話框不觸發專注，原生 summary 空白鍵正常，Shift+Esc 不改模式。
- 三布局、三主題、四字體與保存；抽樣計算 body、時鐘卡與主題控制項文字對比均至少 4.5（非完整 WCAG 審核）。
- 1920×1080、1366×768、1280×720、1101×768（額外斷點）、1024×768、390×844，以特大字體測三種布局及五個展示狀態，無頁面水平溢出。1280×720 倒數主要控制在可視範圍；手機允許正常垂直捲動。
- 觸控模擬 tap 抽號只新增一筆，短動畫不重複抽選；reduced-motion 時無抽選動畫。
- 既有學生、歷史、聯絡簿、課表深比較不變，實際下載 JSON、預覽／確認還原保留 display。
- 第三階段 30 人名單 CSV／XLSX、課表 CSV／原生範本 XLSX／壓縮 35 筆 XLSX、單日調課、重疊拒絕、學期沿用、倒數重載、聯絡簿、29 次不重複抽號、JSON 下載還原、損壞資料保護、離線保存皆通過。

Fullscreen 拒絕與 localStorage 配額不足在瀏覽器中以故障注入模擬；已驗證中文錯誤、狀態不假裝成功、資料不變。不是宣稱所有瀏覽器／嵌入環境都允許全螢幕。

### 其他檢查及初期失敗處理

- 本機 HTTP 39 個 HTML／CSS／JS 資源 SHA-256 與 version.json 一致，CSS 與模組皆維持 Pages 子路徑相對載入及統一版本參數。
- git diff --check 通過，所有修改只在 class-dashboard-v2/。
- 初次舊回歸無法連線既有 localhost:8000（ERR_EMPTY_RESPONSE）；另啟本次可控的 8010 伺服器、設定 TEST_URL 後重跑通過，沒有清除任何真實資料。
- 測試曾抓到課表專注容器被一般顯示規則蓋過，已修正並重跑通過。目視檢查發現短投影畫面控制列過低，已用高度上限與精簡非必要內容修正；主要計時按鈕已確認在 720p 可視範圍。
- intentional renderer failure 是舊核心測試故意注入的 listener 失敗，驗證保存資料不會因畫面錯誤回退。

最終沒有未解決的自動化失敗。尚未執行：Windows 原生 Chrome/Edge、實際白板／投影機、OS 全螢幕 UI 與實際輸入法、真實多點觸控。headless Chromium 的 API 與觸控模擬不等於上述實機已通過。公開 Pages 資源與 PR 清單受網路／API 阻擋，未完成獨立核實。

## Windows 11 驗收方式

1. 使用 Chrome 或 Edge，合併前在分支測試環境試用；不需教師安裝資料庫或以命令列做日常操作。先下載完整 JSON 備份。
2. 選四種專注，再按返回。運行倒數、抽過座號後切模式，確認時間與紀錄延續。
3. 點全螢幕；切專注；按 Esc 應先退出全螢幕，專注仍保留。非全螢幕且離開輸入控制項後，Esc 可回主畫面。
4. 依序切三布局、三主題與四字體並重整確認。數字有安全上限；特大字或手機需要時可垂直捲動，整週課表仍可在表格內水平捲動。
5. 開投影隱私，教師／名單按鈕應停用，S 不可打開設定。明確關閉隱私後才能看到名單、匯入及還原。
6. 在輸入框輸入 f、s、1234、用中文輸入法及 Ctrl+F，不應改變模式或計時；離開控制項後試 0–4、F、S、倒數空白鍵。
7. 白板用手指點開始／暫停／返回／抽號／關閉設定；確認沒有依賴滑鼠懸停的必要操作。
8. 下載並還原備份，確定學生、課表、聯絡簿、抽號、歷史與展示設定皆在。投影隱私只是畫面保護，不是登入。
9. 使用者確認 PR 才合併 main；待 Pages 完成再看頁尾 2.0-stage4A.0，執行公開資源版本檢查。未合併前正式站不會自動更新。

4A 到此停止，不開始 4B。後續若使用者核准，4B 可在保留的擴充位置建立真正多媒體中心，重用現有展示與資料管理核心。

## 實際修改檔案

A 新增、M 修改。既有模組的部分修改僅為統一資源版本參數；未加入播放器或重啟任務。

- `M README.md`
- `A docs/stage4a-acceptance.md`
- `M index.html`
- `M package.json`
- `M src/app.js`
- `M src/core/migrations.js`
- `M src/core/model.js`
- `M src/core/store.js`
- `M src/core/validation.js`
- `A src/display/fullscreen.js`
- `A src/display/model.js`
- `A src/display/shortcuts.js`
- `M src/features/task-validation.js`
- `M src/io/backup.js`
- `M src/io/timetable.js`
- `M src/io/xlsx.js`
- `M src/legacy/task-ui.js`
- `M src/school/commands.js`
- `M src/school/model.js`
- `M src/school/schedule.js`
- `M src/school/validation.js`
- `M src/ui/backup.js`
- `M src/ui/controller.js`
- `A src/ui/display.js`
- `M src/ui/dom.js`
- `M src/ui/roster-import.js`
- `M src/ui/schedule.js`
- `M src/ui/timetable-import.js`
- `M src/ui/tools.js`
- `A styles/display.css`
- `A tests/display.test.js`
- `A tests/fixtures/stage3-state.json`
- `M tests/stage3-browser.cjs`
- `M tests/stage3.test.js`
- `A tests/stage4a-browser.cjs`
- `M tests/version.test.js`
- `M tools/release.mjs`
- `M version.json`
