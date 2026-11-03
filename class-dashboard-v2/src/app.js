import {mountWidgets} from './ui/widgets.js?v=2.0-three-columns.0';
import {mountStage} from './ui/stage.js?v=2.0-three-columns.0';
import {mountVisual} from './ui/visual.js?v=2.0-three-columns.0';
import {mountAppearance} from './ui/appearance.js?v=2.0-three-columns.0';
import {mountHome} from './ui/home.js?v=2.0-three-columns.0';
import {mountMedia} from './ui/media.js?v=2.0-three-columns.0';
import {mountDisplay} from './ui/display.js?v=2.0-three-columns.0';
import {withBrowserLock} from './core/browser-commands.js?v=2.0-three-columns.0';
import {createStore} from './core/store.js?v=2.0-three-columns.0';
import {mountUI} from './ui/controller.js?v=2.0-three-columns.0';
import {mountRosterImport} from './ui/roster-import.js?v=2.0-three-columns.0';
import {mountSchedule} from './ui/schedule.js?v=2.0-three-columns.0';
import {mountTimetableImport} from './ui/timetable-import.js?v=2.0-three-columns.0';
import {mountTools} from './ui/tools.js?v=2.0-three-columns.0';
import {mountBackup} from './ui/backup.js?v=2.0-three-columns.0';
import {startClock} from './ui/clock.js?v=2.0-three-columns.0';
// Paused task reducers and task UI are deliberately not imported.
const storage={getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)};
const store=withBrowserLock(createStore({storage}),navigator.locks);
try{
  mountDisplay(store);mountUI(store);mountRosterImport(store);const tickSchedule=mountSchedule(store);mountTimetableImport(store);const tickTools=mountTools(store);mountBackup(store);mountAppearance(store);mountHome(store);mountVisual(store);const stage=mountStage(store);startClock();
  try{const media=mountMedia(store,{onVideo:()=>stage.select('video')});mountWidgets({store,media,stage});}catch(mediaError){const entry=document.querySelector('#open-media');if(entry)entry.disabled=true;const notice=document.querySelector('#quick-notice')||document.querySelector('#startup-status');notice.textContent=`多媒體初始化失敗：${mediaError.message}。其他教室工具仍可使用。`;notice.classList.add('error');}
  const tick=()=>{tickSchedule();tickTools();};setInterval(tick,1000);document.addEventListener('visibilitychange',tick);
  const status=()=>document.querySelector('#startup-status').textContent=store.loadError?'原資料異常，請保留原始副本並從資料管理還原已驗證備份。':`2.0-three-columns.0 已載入 · ${navigator.locks?.request?'安全寫入鎖可用':'瀏覽器不支援寫入鎖，請使用 HTTPS 與最新版 Chrome / Edge。'}`;
  store.subscribe(status);status();
}catch(error){document.querySelector('#startup-status').textContent=`系統初始化失敗：${error.message}。請保留此訊息，不要清除本機資料。`;console.error(error);const notice=document.querySelector('#quick-notice');if(notice){notice.textContent=`系統初始化失敗：${error.message}。請勿清除資料。`;notice.classList.add('error');}}
