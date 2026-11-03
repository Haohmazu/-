import {openOverlay} from './overlay.js?v=2.0-visual.0';
export const $=selector=>document.querySelector(selector);
export function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
export function button(text,action){const b=el('button',text);b.type='button';b.onclick=action;return b;}
export function notify(text,error=false){$('#notice').textContent=text;$('#notice').classList.toggle('error',error);$('#form-error').textContent=text;$('#form-error').classList.toggle('error',error);const presentation=$('#presentation-message');if(presentation){presentation.textContent=text;presentation.classList.toggle('error',error);}const quick=$('#quick-notice');if(quick){quick.textContent=text;quick.classList.toggle('error',error);}}
export async function run(store,command,text='操作已儲存。'){try{await store.dispatch(command);notify(text);return true;}catch(error){notify(error.message,true);return false;}}
let settingsAccess=()=>true;
export function setSettingsAccess(check){settingsAccess=check;}
export function openSettings(id='class-settings'){
  if(!settingsAccess()){notify('投影隱私已開啟。請先明確關閉投影隱私，再進入教師設定。',true);return false;}
  document.querySelectorAll('[data-settings-panel]').forEach(panel=>panel.hidden=panel.id!==id);
  document.querySelectorAll('[data-panel]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.panel===id));b.tabIndex=b.dataset.panel===id?0:-1;});
  openOverlay($('#settings'));$('#settings').scrollTop=0;
}
export function option(value,text){const node=el('option',text);node.value=value;return node;}
export function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
