# 第一版調查紀錄

2026-11-02 讀取官方 GitHub `ckj1022-art/classdashboard` 的 main 分支 README.md 與 index.html。來源：

- https://github.com/ckj1022-art/classdashboard
- https://raw.githubusercontent.com/ckj1022-art/classdashboard/main/index.html

本工作區原有 `/workspace/-/index.html` 為「AI 語音全能王 v4.0」，不是第一版；檢查時 Git 狀態乾淨。保持該檔不變，新增獨立子目錄，未部署、未移除任何備份。參考專案未整份複製到新產品，未使用其魚種素材。

## 實際結構

參考 HTML 是單檔，內嵌 CSS、背景與像素素材。CSS 包含主畫面、分頁、座號格、抽屜、魚種卡、全螢幕／觀賞控制，JavaScript 與 DOM 事件緊密耦合。

- `STORE_KEY = 'aquarium-classroom-v1'`（約 1044 行）。`defaultState()` 的 `v: 5` 與鍵名 v1 並不相同。
- `students` 成員是 `{seat, checked, records, fish}`；`freshStudent(i)` 依索引產生座號，沒有固定的學生內部 ID。
- `settings` 有 `classSize`、`feedTotal`、音效與效能設定；另存 `homework.fish`、`collection`、`hwHistory`、`round`、`notes`、`timer` 等。
- `syncMission()` 將 `homework` 與打卡座號陣列同步到 `missions[missionIdx]`；`loadMission()` 再按座號還原 checked。實際程式最多允許三個任務，與第二版單一 ACTIVE 輪次需求不同。
- `checkIn(seat)`（約 2788 行）用 `students[seat-1]`，拒絕 checked 重複，再 push 時間、feedHwFish、渲染與延遲 save。`uncheck` pop 最後完成紀錄並退飼料。
- `rollHwSpecies()`（約 1859 行）實際閾值 .60/.88/.98：普通 60%、稀有 28%、珍稀 10%、傳說 2%。另一段註解寫 70/25/5，不能據此假設實作。
- `FISH_DATA` 包含名稱、shape、三個顏色、pattern 與選項；映射成 f01–f100。`tierOf` 控制魚種分類，`bodyCol` 依座標產生條紋／斑點等像素；`spriteOf` 生成圖像。游動物件 `update(dt,t)` 以方向、速度與邊界轉向，正弦起伏與目標高度平滑插值。
- `loadState` 經 sanitize；sanitize 會修剪格式、依版本合併歷史與轉換舊魚 ID。`save()` 延遲 150ms，`saveNow()` 寫入失敗只記錄 console warning，與第二版可靠儲存後才正式成功的要求不同。
- 備份包裝為 `{app:'class-dashboard', savedAt, data:state}`，還原也接受裸 students 物件；確認後覆蓋舊鍵並 reload。

## 遷移設計邊界（尚未實作）

不得直接把座號當成永久 ID，或將 checked 反推成具精確輪次的完整歷史；第一版紀錄無法無損推定第二版全部欄位。需在第六階段先保存原備份、辨識 wrapper/v5/更早版本、呈現可轉移與無法推定項目，再由教師確認學生對應及 ACTIVE 輪次。100 種魚／四種稀有度與第二版 50 種／三種稀有度不一對一，舊圖鑑應先原樣封存，不得擅自重新抽選。金幣、販售與環境音僅保存在舊檔，不帶回第二版。

第一階段完全不讀取或寫入舊鍵，因此不會暗中觸發遷移。
