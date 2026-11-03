import {$,notify,run,openSettings,setSettingsAccess} from './dom.js?v=2.0-home-layout.0';
import {createFullscreenController} from '../display/fullscreen.js?v=2.0-home-layout.0';
import {shortcutFor} from '../display/shortcuts.js?v=2.0-home-layout.0';
export function mountDisplay(store){
  let lastFocus,lastPrivacy,lastDraw,externalPrivacy=false;
  const privateNow=()=>externalPrivacy||store.getDisplayState().display.privacy;
  setSettingsAccess(()=>!privateNow());
  const fullscreen=createFullscreenController({document,
    onChange({active,available,pending}){
      $('#fullscreen-toggle').textContent=active?'離開全螢幕':'進入全螢幕';$('#fullscreen-toggle').setAttribute('aria-pressed',String(active));$('#fullscreen-toggle').disabled=pending||(!available&&!active);
      $('#fullscreen-status').textContent=active?'全螢幕展示中 · 按 Esc 離開全螢幕（不改變專注模式）':available?'一般視窗 · F 切換全螢幕，Esc 返回專注模式主畫面':'目前瀏覽器或嵌入頁面不允許全螢幕；可改用 Chrome / Edge 直接開啟網站。';
    },onError:text=>notify(text,true)});
  $('#fullscreen-toggle').onclick=()=>fullscreen.toggle();
  async function change(patch){if(!await run(store,{type:'SET_DISPLAY',patch},'展示設定已儲存。'))render(store.getDisplayState());}
  $('#focus-mode').onchange=()=>change({focus:$('#focus-mode').value});$('#return-home').onclick=()=>change({focus:'home'});
  for(const [id,key] of [['#display-font','font'],['#display-theme','theme'],['#display-layout','layout']])$(id).onchange=()=>change({[key]:$(id).value});
  $('#projection-privacy').onclick=()=>change({privacy:!privateNow()});
  function render(s){
    const d=s.display,privacy=d.privacy||externalPrivacy;
    document.body.dataset.focus=d.focus;document.body.dataset.layout=d.layout;document.body.dataset.font=d.font;document.body.dataset.theme=d.theme;document.body.dataset.privacy=String(privacy);
    $('#focus-mode').value=d.focus;$('#display-layout').value=d.layout;$('#display-font').value=d.font;$('#display-theme').value=d.theme;$('#return-home').hidden=d.focus==='home';
    $('#projection-privacy').textContent=privacy?'關閉投影隱私':'開啟投影隱私';$('#projection-privacy').setAttribute('aria-pressed',String(privacy));
    for(const selector of ['#open-settings','#open-roster','[data-open]'])document.querySelectorAll(selector).forEach(b=>b.disabled=privacy);
    if(privacy){if($('#settings').open)$('#settings').close();if(lastPrivacy!==privacy){$('#notice').textContent='';$('#form-error').textContent='';notify('投影隱私已開啟。請先明確關閉投影隱私，才能查看名單、匯入預覽及還原明細。');}}
    if(d.focus==='schedule'&&lastFocus!==d.focus)$('#view-today').click();
    if(lastDraw!==undefined&&s.picker.lastId&&lastDraw!==s.picker.lastId&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      try{$('#draw-result').getAnimations().forEach(a=>a.cancel());$('#draw-result').animate([{transform:'scale(.8)',opacity:.5},{transform:'scale(1.08)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:350,easing:'ease-out'});}catch{/* Cosmetic only: draws have already been saved. */}
    }
    lastDraw=s.picker.lastId;lastPrivacy=privacy;lastFocus=d.focus;
  }
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey&&document.fullscreenElement&&!document.querySelector('dialog[open]')&&!event.isComposing&&!event.target.closest?.('input,textarea,select,[contenteditable]')){document.exitFullscreen().catch(()=>{if(document.fullscreenElement)notify('暫時無法離開全螢幕，請使用瀏覽器的退出操作。',true);});return;}
    if(event.key==='Escape'&&!event.isComposing&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&!event.shiftKey&&!document.fullscreenElement&&!document.querySelector('dialog[open]')&&store.getDisplayState().display.focus!=='home'){
      // A select's native Escape must remain available as well.
      if(event.target.closest?.('input,textarea,select,[contenteditable]'))return;
      event.preventDefault();change({focus:'home'});return;
    }
    const s=store.getDisplayState(),action=shortcutFor(event,{dialogOpen:!!document.querySelector('dialog[open]'),focus:s.display.focus});if(!action)return;event.preventDefault();
    if(action.type==='focus')change({focus:action.value});
    if(action.type==='fullscreen')fullscreen.toggle();
    if(action.type==='settings')openSettings();
    if(action.type==='timer-toggle'){
      if(s.timer.status==='RUNNING')run(store,{type:'TIMER_PAUSE'});
      else if(['IDLE','PAUSED'].includes(s.timer.status))run(store,{type:'TIMER_START'});
      else notify('計時已結束，請先按重設，再開始倒數。');
    }
  });
  window.addEventListener('storage',event=>{
    if(event.key!=='class-dashboard-v2'||!event.newValue)return;
    try{if(JSON.parse(event.newValue)?.display?.privacy===true){externalPrivacy=true;render(store.getDisplayState());notify('其他分頁已啟用投影隱私，敏感設定已關閉。請重新整理後再操作。',true);}}catch{/* Never interpret corrupt data as an instruction to remove privacy. */}
  });
  store.subscribe(render);render(store.getDisplayState());
}
