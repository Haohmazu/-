import {$} from './dom.js?v=2.0-three-columns.0';
// View state only. Timer, picker, schedule and media keep their existing authorities.
export function mountStage(store){
 const modes=['clock','timer','picker','video'];let selected='clock',leaveVideo=()=>{},previousActive;
 function paint(){const s=store.getDisplayState(),focus=s.display.focus,active=focus==='home'?selected:focus;
  if(previousActive==='video'&&active!=='video')leaveVideo();previousActive=active;
  document.body.dataset.stage=active;
  for(const mode of modes){const tab=$(`#stage-tab-${mode}`);tab.setAttribute('aria-selected',String(mode===selected));tab.tabIndex=mode===selected?0:-1;$(`#stage-${mode}`).hidden=mode!==active;}
  $('#stage-focus-label').textContent=`專注展示：${{clock:'時鐘',timer:'倒數',picker:'抽號',video:'影片'}[selected]}`;
  const running=['RUNNING','PAUSED','FINISHED'].includes(s.timer.status);const badge=$('#stage-timer-status');badge.hidden=!running||active==='timer';badge.textContent=running?`${{RUNNING:'倒數進行中',PAUSED:'倒數已暫停',FINISHED:'時間到！'}[s.timer.status]} ${$('#timer-display').textContent} · 查看`:'';
 }
 function choose(mode){selected=mode;$('#timer-presets').open=false;paint();window.dispatchEvent(new Event('resize'));}
 for(const [i,mode] of modes.entries()){const tab=$(`#stage-tab-${mode}`);tab.onclick=()=>choose(mode);tab.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;choose(modes[next]);$(`#stage-tab-${modes[next]}`).focus();};}
 $('#stage-timer-status').onclick=()=>{choose('timer');$('#stage-tab-timer').focus();};
 $('#stage-focus').onclick=()=>{if(selected==='video'){$('#video-enlarge').click();return;}const select=$('#focus-mode');select.value=selected;select.dispatchEvent(new Event('change',{bubbles:true}));};
 const date=()=>{$('#stage-date').textContent=$('#date').textContent;};const dateObserver=new MutationObserver(date);dateObserver.observe($('#date'),{childList:true,subtree:true,characterData:true});date();
 const observer=new MutationObserver(paint);observer.observe($('#timer-display'),{childList:true,subtree:true,characterData:true});store.subscribe(paint);paint();
 return {select:choose,setVideoExit(fn){leaveVideo=fn;}};
}
