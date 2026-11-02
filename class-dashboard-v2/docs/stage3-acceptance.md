# 第三階段驗收與交付紀錄

## 版本與範圍

- 正式儲存庫 `haohmazu/-`，只修改 `class-dashboard-v2/`。
- 起點 main：`cb8b4e70df9b7a0a2785b5743c2fd7f68094c259`，合併 PR #2，清單版本 `2.0-stage2.1` / schema 3。
- 本次開發分支：`develop/class-dashboard-v2-stage3`；版本 `2.0-stage3.0` / schema 4。
- 不合併 main，不改正式站或同儲存庫其他網站。第三階段完成後停止。

## 資料與停用策略

任務 UI、命令與統計移至 `src/legacy/`，app/store 完全不匯入這些操作模組。首頁與教師設定沒有任務、水族箱或進化入口，不是 CSS 隱藏。正式 store 拒絕原任務命令，今日參與改由教室工具 reducer 管理，只用於抽號。純歷史驗證仍保留，不建立打卡或結算。

3→4 加入 school、timer、notes、picker、preferences；原學生、內部 ID、名稱、座號、templates、rounds、checkins、audit、rosterImports 及其他欄位保留。載入只在記憶體升版，第一次成功操作才寫回。測試 fixture `stage2-state.json` 是用 main 的第二階段真實 createStore 與命令產生的合成資料，含取消輪次、進行中輪次、學生打卡、教師補登、取消及復原。

保留相同儲存鍵、Web Locks 名稱與過期預覽保護，另加原始快照比對防同 revision 改寫。損壞資料鎖定一般操作，不自動清空；明確確認後可用已驗證備份還原，也可先下載原始副本。完整 JSON 備份包含歷史；還原失敗或寫入失敗都不變更權威狀態。

## 實際自動化結果

`npm test`：34 項通過、0 失敗、0 跳過。`npm run test:browser`：完整 Chromium headless 流程通過。`check-deployment` 對本機 HTTP 路徑比對 34 個 HTML/CSS/JS 資源全數一致。`git diff --check` 無格式錯誤。

| 任務書項目 | 驗證證據 |
| --- | --- |
| 1. 第二階段舊資料升級 | schema 3 真實 fixture 轉 4，原 raw 在讀取後仍是 3，無載入時寫回 |
| 2. 學生 ID 不變 | Node 深比較與瀏覽器匯入更新保留 stable-1 等既有 ID |
| 3. 任務歷史保留 | 遷移、課表、計時、抽號、聯絡簿、名單更新、重載及備份後深比較 rounds |
| 4. 停用後不能打卡 | 正式 store 拒絕 CHECK_IN 等八種任務命令，raw 不變 |
| 5. 不意外執行任務 | 瀏覽器沒有載入 src/legacy 模組，app/store 不匯入操作程式，工具操作後 history 不變 |
| 6. 固定課表 | 週一至五各自設定並驗證科目，時間只在共用 periods |
| 7. 目前節次 | 臺灣 08:50 第一節、09:20 下課、午休、間隙、放學邊界 |
| 8. 星期切換 | 連續五個實際日期驗證；週六、日為空，臺灣午夜正確切日 |
| 9. 今日課表 | 瀏覽器目前科目／下一節／目前列正確，Node 每日課程驗證 |
| 10. 整週課表 | 瀏覽器六欄（節次＋五天）、七節 rows 正確；固定課表不混入調課 |
| 11. 單日調課 | 瀏覽器新增與確認取消；Node 隔週恢復固定科目，weekly 原樣 |
| 12. CSV 課表 | 真實檔案選取、預覽、勾選、儲存與保留其他科目 |
| 13. XLSX 課表 | 實際下載三欄 XLSX 範本並上傳；另匯入 openpyxl 產生的壓縮三欄 35 筆工作簿，解析／預覽／確認成功 |
| 14. 無效匯入 | 星期六、重複節次、未知節次、空科目、錯欄位、過期預覽拒絕；原資料不變 |
| 15. 倒數重整恢復 | 瀏覽器啟動後快轉、重整 deadline 相同、暫停後快轉不變、繼續後完成保存 |
| 16. 聯絡簿保存 | 新增、編輯、上下排序、完成、清除前取消／確認、刪除與重載 |
| 17. 抽號不重複 | 30 人排除一人，瀏覽器抽 29 次唯一、不含排除者，重整保留；Node 重設需確認 |
| 18. JSON 下載 | 瀏覽器 download 事件、讀取實際檔案及檢查 schema／完整 history |
| 19. JSON 還原 | 改班名後預覽仍未覆蓋，勾選確認後原班名／工具／歷史恢復，revision 單調增加 |
| 20. 無效 JSON | 格式錯誤、未來版本、未確認及寫入失敗拒絕，raw/state 保留；損壞資料可顯式恢復 |
| 21. Pages 相對路徑 | 本機 `/class-dashboard-v2/` 實際載入功能，34 資源 hash 相同；公開 Pages 連線未能驗證 |
| 22. 畫面尺寸 | 1920×1080、1366×768、1280×720、1024×768、390×844 首頁及設定無頁面水平溢出 |

其他回歸：30 人 CSV、壓縮 XLSX 學生名單匯入、HTML 字串安全呈現、明確 ID 對應、50 人上限、儲存失敗不發成功事件、Web Locks 缺少時拒絕、離線載入後保存、還原損壞資料解鎖。1366×768 首頁與設定另有目視檢查；小螢幕允許正常垂直捲動與整週表格內水平捲動。舊版任務操作測試移為 tests/legacy 文字快照，不宣稱它們在第三階段通過。

## 公開部署核對

已透過 Git 取得 main 的版本清單，確認 PR #2 已合併。對公開 `version.json` 的請求被本環境代理以 CONNECT 403 阻擋，未取得網站 HTTP 回應（HTTP 000）；Pages API 也回覆 Forbidden，另以 Chromium 讀取同一正式網址得到 ERR_TUNNEL_CONNECTION_FAILED。因此未獨立確認公開站 HTML/CSS/JS 的即時版本、部署來源是否仍與最近截圖相同，或是否受快取影響。這不是網站返回 404，也不是部署失敗證據。

本次沒有修改 Pages 設定。先前使用者截圖為 Deploy from a branch / main / root；若來源維持如此，本次 PR 在使用者確認並合併 main 後才發布第三階段。合併前正式站仍可能顯示第二階段，不能拿開發分支測試當作正式部署完成。新版本有明確頁尾與啟動標示 `2.0-stage3.0`，可用 `npm run check:deployment` 比較所有公開資源；連線失敗時工具回傳未確認。

## Windows 11 人工驗收

1. 合併前先下載第三階段分支，用 Python 靜態伺服器在 localhost 試用；不要直接雙擊 HTML。正式站開啟不需安裝。
2. Chrome 及 Edge 各用一組測試資料，下載完整 JSON 備份，再檢查四個教師設定分頁。
3. 按實際學校時間修改作息，嘗試重疊與錯誤時間應拒絕。課表選學年、學期、星期與節次，切今日／整週確認。
4. 用 Excel 開啟下載的課表範本，填入真實標準三欄另存 XLSX、CSV UTF-8，分別預覽再確認匯入。任意複雜版型、公式、合併儲存格不在支援範圍。
5. 以今天平日試單日調課及取消，整週固定科目不變；週末不應出現星期一的目前課程。
6. 計時設短秒數，開始、暫停、增減、繼續、重整與返回分頁驗證；提示音開關及音量用真實喇叭測試。
7. 聯絡簿新增、改字、上下移、勾選完成，清除對話框先取消再確認，重新整理驗證。
8. 設定今日不參與學生，抽完可抽名單應不重複；手動重設前須確認。
9. 下載備份、改資料、上傳備份；未確認前不可覆蓋，確認後恢復。另以錯誤 JSON 驗證不變更資料。請只用合成資料做損壞檔測試，不要故意破壞正式資料。
10. Windows 125% 縮放、五種尺寸、Tab／Esc、觸控白板測試；任務管理與水族箱入口應完全不存在。
11. 使用者確認 PR 後才合併，由 Pages 完成部署，再核對 2.0-stage3.0 及公開 hash。關閉同來源舊分頁，保留升級前備份。

未驗證：Windows 原生 Chrome/Edge、Microsoft Excel 真機、真實音效／觸控／投影機、公開 Pages 資源。無 Service Worker，離線重新載入不保證。作息為可編輯範例且限同日；時間依本機系統時鐘。沒有登入帳號或遠端同步。完整 CSV 報表、學期封存及進階診斷留待第五階段；不自動開發第四階段。

## 實際修改檔案

M：修改、A：新增、R：移動並保留。全部位於 class-dashboard-v2/。

- `M README.md`
- `A docs/stage3-acceptance.md`
- `M index.html`
- `M package.json`
- `M src/app.js`
- `M src/core/browser-commands.js`
- `M src/core/migrations.js`
- `M src/core/model.js`
- `M src/core/store.js`
- `M src/core/validation.js`
- `M src/features/task-validation.js`
- `A src/io/backup.js`
- `A src/io/timetable.js`
- `M src/io/xlsx.js`
- `A src/legacy/README.md`
- `R100 src/features/tasks.js → src/legacy/task-commands.js`
- `R100 src/features/statistics.js → src/legacy/task-statistics.js`
- `R097 src/ui/tasks.js → src/legacy/task-ui.js`
- `A src/school/commands.js`
- `A src/school/model.js`
- `A src/school/schedule.js`
- `A src/school/time.js`
- `A src/school/timer.js`
- `A src/school/validation.js`
- `A src/ui/backup.js`
- `M src/ui/controller.js`
- `A src/ui/dom.js`
- `M src/ui/roster-import.js`
- `A src/ui/schedule.js`
- `A src/ui/sound.js`
- `A src/ui/timetable-import.js`
- `A src/ui/tools.js`
- `M styles/main.css`
- `M tests/core.test.js`
- `A tests/fixtures/stage2-state.json`
- `A tests/fixtures/timetable-openpyxl.xlsx`
- `A tests/legacy/README.md`
- `R100 tests/browser.cjs → tests/legacy/browser.cjs.txt`
- `R100 tests/stage2-browser.cjs → tests/legacy/stage2-browser.cjs.txt`
- `R100 tests/stage2.test.js → tests/legacy/stage2.test.js.txt`
- `A tests/legacy/task-core-tests.txt`
- `R100 tests/tasks-browser.cjs → tests/legacy/tasks-browser.cjs.txt`
- `A tests/stage3-browser.cjs`
- `A tests/stage3.test.js`
- `M tests/version.test.js`
- `M tools/release.mjs`
- `M version.json`
