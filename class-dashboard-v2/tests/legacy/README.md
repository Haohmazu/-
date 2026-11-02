# 第二階段測試規格快照

原有任務操作 UI 及命令已依第三階段要求停用，這裡保留歷史測試文字，不納入第三階段測試計數。要重跑原版，請在獨立的第二階段提交 cd0e75a 檢查該版本的 tests，而不是在正式站重新啟用任務程式。

第三階段以 fixtures/stage2-state.json 與 stage3.test.js、stage3-browser.cjs 驗證真實舊資料升版、歷史完整及拒絕任務命令，並保留名單匯入、儲存失敗、重複座號等有效回歸測試。stage2-state.json 是由 main 的第二階段 createStore 與命令實際產生，全部為合成測試資料。
