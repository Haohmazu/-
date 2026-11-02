# Class Dashboard 2.0｜第二階段驗收版

原生 HTML、CSS、JavaScript ES Modules，無資料庫、後端、付費服務或執行期外部套件。繁體中文介面，適用 Chrome / Edge。

## 正式目標及發布規則

- 儲存庫：https://github.com/haohmazu/-
- 唯一開發範圍：`class-dashboard-v2/`，不修改根目錄其他網站。
- 正式網址：https://haohmazu.github.io/-/class-dashboard-v2/
- 第一版 `ckj1022-art/classdashboard` 僅供功能參考，絕不提交到該儲存庫。
- 開發分支測試、推送及 PR 審查；教師確認前不合併 `main`，不更新正式網站。
- 本次版本 `2.0-stage2.1`、資料版本 `schemaVersion: 3`。第一、二版資料在記憶體中升版，成功儲存才寫回；保留學生 ID 與任務紀錄。舊網站 `aquarium-classroom-v1` 資料完全不動，未提供舊版魚種遷移。

## 已完成

- 第一階段班級設定、50 位學生逐筆新增及編輯、固定內部 ID、臺灣時鐘、響應式畫面。
- 任務範本增刪改、單一 ACTIVE 任務、名稱快照、固定參與 ID 名單與 1–參與人數之間的門檻。
- 學生打卡、教師補登、取消打卡、最近一次未結算打卡操作復原。成功保存才更新 UI，重複打卡拒絕、不重複累計。
- 今日參與與本輪名單分離。跨日不重設輪次 ID、參與名單或打卡。
- 本輪參與名單與門檻修訂。須確認，移除已打卡者會明列移除筆數，再取消其本輪有效打卡；前後快照保留於 audit。修訂後不可用打卡復原跨越此次名單修改。
- 由有效紀錄重算完成人數、未完成人數、完成率、個人累計、輪次歷史、取消及修正紀錄。取消輪次保留明細，但排除個人有效累計；未取消 ACTIVE 打卡計入累計。
- CSV / XLSX 名單範本下載、本機讀檔、預覽、身分對應、確認後原子匯入。保留未列入學生及歷史。相同姓名不自動配對。
- 進化結算資料介面與驗證規則；本階段不發魚、不標示已取得、不會達門檻就假裝 COMPLETED。
- Web Locks 跨分頁寫入互斥、過期分頁拒絕、格式損壞保護、讀寫錯誤提示、初始化錯誤及寫入鎖可用性提示。
- HTML/CSS/JS 資源版本參數與 SHA-256 版本清單，保留 GitHub Pages 相對路徑。

## Windows 11 操作

### 正式站

使用 Chrome / Edge 開啟正式網址。此次分支尚未合併時，正式站仍為上一版；不會因開啟 PR 自動更新。新版頁尾應為 `2.0-stage2.1`。

1. 右上「教師設定」，上方可跳至「班級與學生」「任務管理」「任務統計」，內容仍在同一個可捲動視窗。
2. 班級與學生：設定班名；可逐筆新增或編輯學生。姓名選填，主畫面僅顯示座號。
3. 下載 CSV / XLSX 範本，依標題「座號」「姓名」填入 1–50 的不重複整數座號；姓名最多 40 字。CSV 需 UTF-8（範本含 BOM，Windows Excel 可正常開啟）。
4. 選取名單檔案，看到預覽代表尚未匯入。與既有座號重疊時，必須逐列選擇既有學生 ID 對應；如果是不同學生，先處理既有座號或使用其他空座號。其他列預設新增，仍需整體勾選身分確認。
5. 檢查「新增／更新筆數」並勾選確認，再按「正式匯入」。未列入者保留，不會刪除舊學生或歷史。同一學生不可對應多列。可透過逐列顯式 ID 對應交換座號；不按姓名猜測身分。
6. 任務管理：設定今日參與、選範本與門檻（留空預設有效人數），按開始任務。中央座號可打卡；教師設定可補登、取消、復原及取消整輪。
7. 調整本輪：展開「修訂本輪參與名單與門檻」，勾選學生與輸入門檻，確認對話框會列出人數、門檻變化及要取消的打卡筆數。今日參與設定不會代替本輪修訂。
8. 任務統計：查看累計與歷史，展開輪次即可看補登來源、修正紀錄、名單修訂前後座號與門檻。

若無法設定：查看頁面底部初始化／寫入鎖提示，以及表單旁錯誤訊息。Web Locks 需要 HTTPS（或本機 localhost）與支援的瀏覽器。其他分頁已修改時，重新整理再操作；資料損壞時不要清除 localStorage，請保留原資料再求助。不能僅憑畫面載入就認定寫入正常。

### 本機試用開發分支

教師不需自行安裝資料庫。開發者或協助人員下載本分支後，在儲存庫根目錄開啟命令提示字元（需要 Python 3）：

```bat
py -m http.server 8000
```

用 Chrome / Edge 開啟 `http://localhost:8000/class-dashboard-v2/`。保持命令視窗開啟，結束時 Ctrl+C。不要雙擊 HTML；ES Modules 不適合 `file://`。不同網址來源、埠、瀏覽器與電腦各有獨立資料。頁面已載入後可離線操作；尚無 Service Worker，斷網重新載入不保證可用。

## 測試與版本清單

核心需 Node.js 20+，無須安裝執行期套件：

```bat
npm test
```

在此目錄執行；瀏覽器測試需先啟動上述伺服器，另安裝測試用 Playwright：

```bat
npm install --no-save --package-lock=false playwright
set CHROMIUM_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
npm run test:browser
```

Edge 可改為 `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`，依實際位置調整。Linux 預設 `/usr/bin/chromium`，可用 `TEST_URL` 指定測試網址。

```bat
npm run version:prepare
node tools/check-deployment.mjs
```

修改執行期程式後，先更新 release.mjs 的版本常數及對應 UI/測試版本，再產生 `version.json`；清單測試會拒絕未更新的內容。檢查工具逐一比較公開 HTML/CSS/JS SHA-256；連線失敗回傳 2，內容不一致回傳 1，一致回傳 0。合併前預期正式網站與分支不一致，不要為了通過比對擅自發布。

本次 32 項核心測試及三組 Chromium 流程通過；完整驗收與部署檢查結果見 [第二階段驗收紀錄](docs/stage2-acceptance.md)。未驗證 Windows 原生 Chrome / Edge、真實觸控、真實 Microsoft Excel 開啟範本及公開 Pages 實際資源版本。

## 檔案架構

- `index.html`、`styles/main.css`：主畫面、教師導覽、表單、響應式布局。
- `src/app.js`：初始化、錯誤與瀏覽器寫入鎖提示。
- `src/core/{model,validation,migrations,store,browser-commands}.js`：模型、驗證、升版、唯一狀態入口及寫入互斥。
- `src/features/{classroom,tasks,task-validation,statistics,settlement}.js`：班級、任務、衍生統計與未發獎結算契約。
- `src/io/{roster,zip,xlsx}.js`：CSV、名單規劃及有大小／CRC 限制的 ZIP/XLSX 子集讀寫；沒有第三方執行期解析套件。
- `src/ui/{controller,clock,tasks,roster-import}.js`：UI 與時鐘；匯入內容以 textContent 呈現。
- `tests/`：核心、瀏覽器與格式測試、XLSX 測試素材；`tools/`、`version.json`：部署版本檢查。
- [第一版原始碼調查](docs/reference-audit.md)、[第二階段驗收](docs/stage2-acceptance.md)。

## XLSX 支援範圍與限制

第一張工作表，座號／姓名兩欄（可交換欄序），支援 ZIP store/deflate、inlineStr/sharedStrings 與數字儲存格。採瀏覽器原生 DOMParser、DecompressionStream；檔案上限 2 MB、最多 128 個 ZIP 項目、單項解壓 2 MB、總解壓 8 MB，校驗 CRC，拒絕 ZIP64、加密、外部連結、巨集、公式及合併儲存格。不是通用 Excel 編輯器，複雜版型請貼到範本。壓縮檔在可支援原生 deflate-raw 的最新版 Chrome/Edge 解析；不支援時改 CSV。CSV/XLSX 不會上傳至第三方。

## 結算介面（供第四階段）

`round.settlement = {version:1,status:'UNSETTLED',result:null}`。真正結算的結果契約為 `{roundId,rewardId:'round:'+roundId,speciesId,rarity:'COMMON'|'RARE'|'LEGENDARY',settledAt}`。`SETTLED` 必須搭配 `COMPLETED`、達門檻、相同輪次 ID 與 endedAt。每輪唯一 rewardId 可作冪等鍵；第四階段仍須實作安全隨機抽選及單次原子提交，不可從動畫發獎。本階段沒有結算命令或魚種收藏。舊 `evolution` 暫保留 null，權威契約使用 settlement。

## 尚未開發

依本次範圍停在第二階段驗收。未做課表、計時器、完整水族箱／圖鑑、外部 JSON 備份還原、學期管理及第一版資料遷移。此版仍無真正登入權限；自動儲存不是外部備份，請先以測試資料驗收。
