import {mountRosterImport} from './ui/roster-import.js?v=2.0-stage2.1';
import {withBrowserLock} from './core/browser-commands.js?v=2.0-stage2.1';
import {mountTasks} from './ui/tasks.js?v=2.0-stage2.1';
import {createStore} from './core/store.js?v=2.0-stage2.1';
import {mountUI} from './ui/controller.js?v=2.0-stage2.1';
import {startClock} from './ui/clock.js?v=2.0-stage2.1';
// Defer storage access to the store so denied localStorage is handled safely.
const storage = {getItem: key => window.localStorage.getItem(key), setItem: (key,value) => window.localStorage.setItem(key,value)};
const store=withBrowserLock(createStore({storage}), navigator.locks);
try {
 mountUI(store);
 mountTasks(store);
 mountRosterImport(store);
 startClock();
 document.querySelector('#startup-status').textContent = store.loadError ? '本機資料異常，寫入已鎖定；請保留資料並提供上方錯誤訊息。' : `2.0-stage2.1 已載入 · ${navigator.locks?.request ? '安全寫入鎖可用' : '瀏覽器不支援安全寫入鎖，無法儲存設定，請改用最新版 Chrome / Edge'}`;
} catch(error) {
 document.querySelector('#startup-status').textContent=`系統初始化失敗：${error.message}。請提供此訊息，不要清除本機資料。`;
 console.error(error);
}
