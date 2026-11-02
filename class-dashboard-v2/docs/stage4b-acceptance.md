# 4B｜統一多媒體中心驗收

## 範圍、起點及交付界線

只實作 4B：暫存來源的播放、Modal、生命週期、背景音樂控制。不實作 4C 分類、最愛、持久化清單／偏好、計時連動或選配獨立視窗。不恢復任務或水族箱。

- 唯一儲存庫 haohmazu/-、唯一修改目錄 class-dashboard-v2/。
- 開始時工作區乾淨，main 起點 4204f2c（Merge PR #4），版本 2.0-stage4A.0 / schema 5。
- 新分支 develop/class-dashboard-v2-stage4b，版本 2.0-stage4B.0，資料版本仍為 5。
- 不改 main、Pages 設定或同 Repository 其他網站；使用者確認前不發布。
- GitHub API 查 PR 清單被 Forbidden 拒絕，無法核實其他開啟的 PR。

## 已實作

| 項目 | 交付 |
| --- | --- |
| 4B-01 | 原生 dialog 音樂／影片分頁、焦點與 Esc、可捲動、關閉容易；首頁只放入口及必要的小型迷你列 |
| 4B-02 | 本機多檔與 HTTPS 直接音訊；播放／暫停／停止、上／下一首、音量／靜音、進度／時間、單曲／全部／不循環／隨機 |
| 4B-03 | 本機 MP4／WebM、直接 HTTPS 影片、YouTube watch／youtu.be／Shorts／embed 等 ID 驗證及官方 iframe |
| 4B-04 | Native 影片控制、進度、音量、靜音、速度、真全螢幕；YouTube 使用平台內建控制，不支援的本站控制停用 |
| 4B-05 | 單一 createMediaCoordinator，固定一個 audio／一個 video，切換前清理舊來源，舊 play promise 失敗不覆蓋新來源 |
| 4B-06 | 音樂關閉可背景控制，停止收合；關閉影片先同步停止，再關視窗，YouTube iframe 移除，Esc 同樣處理 |
| 4B-07 | HTTPS 協定／無網址密碼、只允許 YouTube 官方 iframe，不執行不可信 HTML，不將學生資料送到影音來源 |

音訊／影片錯誤與 HTML 版本不一致的媒體初始化失敗，都隔離於多媒體模組；時鐘、課表、資料保存照常。錯誤訊息不被 timeupdate 蓋掉。合法原始來源另開時先停止本站媒體。

YouTube 不使用 IFrame API 偽造狀態。狀態為 EMBEDDED，代表已建立官方播放器，不代表已播放；音量、暫停、進度、倍速及全螢幕由官方介面處理。本站停止／關閉會移除 iframe。沒有下載、代理、繞過限制或控制廣告的程式。

## 資料與資源

媒體協調器完全不接收教室 store，也不呼叫 localStorage；全部 queue、volume、repeat、shuffle、rate、current 都是本頁暫態。每筆暫存有本頁穩定 ID。重新整理後需重選檔／重貼網址，UI 明確告知，沒有假裝永久保存 Blob URL。

因此維持 schema 5，既有 1→5 遷移與 Web Locks／過期分頁保護未改動。完整 JSON 備份仍只包含既有教室資料與展示偏好，不包含暫存清單、檔案內容或 Blob URL。媒體音量不改 preferences.volume，計時結束不控制影音。本機檔案不讀成 base64 寫入資料，也不傳到後端。

停止時 pause、移除 src、load 取消網路與解碼；佇列還要重播的本機 Blob 保留，不把這些必要引用誤當洩漏。清空／dispose 回收未使用 URL。pagehide 清理；若進入 bfcache，先停止播放，保留仍由該頁佇列引用的 URL 供返回後手動重播。YouTube 切換或關閉即清空 iframe，不留下隱藏聲音。

## 實際測試結果

### 核心：54 項通過

npm test：54 passed、0 failed、0 skipped。含既有 43 項及 11 項來源／播放協調測試：協定與 YouTube ID、互斥、關閉、所有控制、循環與隨機不意外無限循環、舊 promise 競態、拒絕播放、Blob 回收／回滾、官方 frame 建立失敗後仍可播音樂。

核心 Native/EventTarget 是模擬，用於確定控制流程；不拿這些測試當作真正解碼證明。intentional renderer failure 仍是既有故障注入案例。

### 實際 Chromium 原生解碼與 UI

npm run test:browser 執行第三階段、4A、4B 三組流程，通過：

- 真實本機 WAV、MP3、WebM、H.264/AAC MP4 載入，currentTime 前進、playing／paused／ended，影片實際解碼寬高 160×90。
- Native 音樂上／下一首、單曲循環、全部循環、不循環、隨機、進度、音量、靜音與倍速；沒有用 play() stub 當作解碼成功。
- 音樂關閉後仍播放，迷你暫停／繼續／停止／重開正常；迷你列在文流，不遮住教室工具。
- 本機影片真全螢幕、關閉及 Esc 立即移除來源並暫停。新來源先停止舊來源，只有一個 audio、一個 video，iframe 最多一個。
- HTTPS 測試網址以 Playwright route 回應已知 WAV／WebM，仍由實際 HTMLMediaElement 解碼。這是網路替身，不是已連線第三方網站證明。
- 官方 YouTube iframe URL／allowed host／controls 停用／無自動播放／關閉移除皆驗證；iframe 回應亦為測試替身，未假稱 YouTube 真正播放。
- 受控 404、不安全 HTTP、文字 HTML 注入、錯誤持續、格式支援提示。錯誤不刪佇列、不改原始資料。
- 以 main 的實際 4A store 產生 schema 5 合成 fixture（含顯示偏好、課表、調課、暫停倒數、抽號、學生、舊任務）；多媒體一連串操作前後 raw localStorage 逐位元相同。另啟動倒數後製造媒體錯誤，deadline 與整份保存內容也相同。
- 實際追蹤四個本機 Blob URL；重播沒有新建同數量播放器或重覆配置，清空音樂／影片後四個 URL 全數回收。
- 五種尺寸 1920×1080、1366×768、1280×720、1024×768、390×844，Modal 不超出螢幕、可捲動、關閉鈕可用。小畫面自動將新影片帶入視野；object-fit 保留比例。
- 模擬 HTML 缺少多媒體區的版本不一致，會顯示錯誤，仍能修改保存班級；不讓媒體初始化例外中止主畫面。
- 第三階段完整回歸（CSV/XLSX、作息、課表、調課、時鐘、計時器、聯絡簿、抽號、備份還原、歷史與離線保存）及 4A 展示／全螢幕／隱私／字體／主題流程保持通過。

測試素材由 ffmpeg 的 sine／color 產生，不含第三方影音或真實學生資料，合計約 350 KB。實際瀏覽器測試確認解碼與時間前進，沒有宣稱實體喇叭已聽音。Windows／白板實機與實體喇叭仍需人工驗收。

### 已處理的測試問題

測試初期在 metadata 未完成就跳至 duration 附近，得到非有限 currentTime；測試改成等待真實 metadata。影片 close 事件是非同步，已改成按鈕／cancel 先同步停止影片，再關閉 modal。測試 fixture 原先會在不透明子文件嘗試讀 localStorage，已限制僅主頁指定 origin 注入；正式程式沒有這類注入。最終無未解決自動化失敗。

## 外部來源及部署限制

外部探測：w3schools HTTPS MP3、media.w3.org HTTPS MP4、YouTube 官方 nocookie iframe 全部遭本環境代理 CONNECT 403 拒絕，HTTP 000。這不是來源回覆 403/404，也不能據此認定來源壞掉。公開 Pages version.json／GitHub API 同樣受阻，未獨立核實公開站資源或 PR 清單。

因此外網音訊、外網影片與 YouTube 真正播放仍是待人工驗收項；不是全數已通過的宣稱。本次交付程式及本機／受控網路流程，老師需在學校網路用有權播放的來源實播。YouTube 可能因禁止嵌入、地區、年齡、登入、Referrer 或平台政策而失敗；只能使用官方提示或合法原頁，不繞過限制。本站無法控制廣告、平台 UI 或另開瀏覽器分頁的播放狀態。

原有 Pages 路徑與設定不變。版本 2.0-stage4B.0，43 個本機 HTML/CSS/JS hash 與清單一致。使用者確認 PR 合併 main 後才由既有 main/root 來源發布，不能把已推分支當作正式站已更新。

## Windows 11 人工步驟與後續依賴

1. Chrome／Edge 開站，確認版本，先開多媒體中心；不用教師安裝資料庫、轉碼器或使用命令列。
2. 選兩首本機 MP3/WAV，點播放並測全部控制，實體喇叭確認音量／靜音。關閉視窗，使用迷你列，再停止。
3. 選 MP4/WebM，試播放、進度、倍速、全螢幕。關閉與 Esc 後應立即無聲；切音樂與影片不應雙重發聲。
4. 在校網輸入有效 HTTPS 直接音訊／影片，各自確認播放。一般網站頁面不是直接媒體，失敗請看訊息，不保證任意網址可播。
5. 試常見 YouTube URL，確認只載入官方播放器；自行在官方播放器按播放。對被禁止嵌入的影片確認平台訊息及原頁入口，勿要求繞過。
6. 清空暫存，重新整理後應無清單。JSON 備份不含實際檔案或本批暫存，不將重選檔當成資料遺失。
7. 計時中播放、故意輸入失效來源，教室倒數、課表與資料仍須正常。投影隱私保護名單設定，不遮老師主動選的影音內容／檔名。
8. 大小螢幕、Tab／Esc、觸控、字體與主題實機確認，並核對喇叭及校網限制。

4B 完成後停止。4C 須使用者另行確認，未來應沿用同一 coordinator，再新增集中狀態的永久 URL 清單、分類／最愛／排序與計時連動；不可建立第二套播放器。獨立視窗目前未實作。

## 實際修改檔案

M 修改、A 新增。部分既有模組僅更新資源版本參數，未修改資料模型或恢復任務功能。

- `M README.md`
- `A docs/stage4b-acceptance.md`
- `M index.html`
- `M package.json`
- `M src/app.js`
- `M src/core/migrations.js`
- `M src/core/model.js`
- `M src/core/store.js`
- `M src/core/validation.js`
- `M src/features/task-validation.js`
- `M src/io/backup.js`
- `M src/io/timetable.js`
- `M src/io/xlsx.js`
- `M src/legacy/task-ui.js`
- `A src/media/coordinator.js`
- `A src/media/sources.js`
- `M src/school/commands.js`
- `M src/school/model.js`
- `M src/school/schedule.js`
- `M src/school/validation.js`
- `M src/ui/backup.js`
- `M src/ui/controller.js`
- `M src/ui/display.js`
- `A src/ui/media.js`
- `M src/ui/roster-import.js`
- `M src/ui/schedule.js`
- `M src/ui/timetable-import.js`
- `M src/ui/tools.js`
- `A styles/media.css`
- `A tests/fixtures/media-clip.mp4`
- `A tests/fixtures/media-clip.webm`
- `A tests/fixtures/media-tone.mp3`
- `A tests/fixtures/media-tone.wav`
- `A tests/fixtures/stage4a-state.json`
- `A tests/media.test.js`
- `M tests/stage4a-browser.cjs`
- `A tests/stage4b-browser.cjs`
- `M tests/version.test.js`
- `M tools/release.mjs`
- `M version.json`
