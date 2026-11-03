import {openOverlay} from './overlay.js?v=2.0-integration-IB.0';
import {mountLibrary} from './library.js?v=2.0-integration-IB.0';
import {createYouTubeAdapter} from '../media/youtube.js?v=2.0-integration-IB.0';
import {$,el,button} from './dom.js?v=2.0-integration-IB.0';
import {parseSource} from '../media/sources.js?v=2.0-integration-IB.0';
import {createMediaCoordinator} from '../media/coordinator.js?v=2.0-integration-IB.0';
function time(value){if(!Number.isFinite(value)||value<0)return '--:--';return `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;}
export function mountMedia(store){
  const dialog=$('#media-center'),audio=$('#media-audio'),video=$('#media-video'),youtubeHost=$('#youtube-host');
  if(!dialog||!audio||!video||!youtubeHost)throw Error('多媒體頁面版本不一致，請按 Ctrl＋F5 重新整理；既有資料不需清除。');
  let tab='music',queueSignature='',opener,uiError=false,scrubbing=false,lastVideoId;
  const youtube=createYouTubeAdapter(youtubeHost,text=>message(text,true));
  const engine=createMediaCoordinator({audio,video,youtube});
  const message=(text,error=false)=>{uiError=error;$('#media-message').textContent=text;$('#media-message').classList.toggle('error',error);};
  async function action(fn){message('');try{await fn();return true;}catch(e){message(e.message,true);return false;}}
  function open(){
    const source=engine.getState().current;if(source)selectTab(source.kind);
    if($('#settings').open)$('#settings').close();
    if(!dialog.open){opener=document.activeElement;openOverlay(dialog,opener);$('#close-media').focus();}render(engine.getState());
  }
  function closed(){
    engine.closeDialog();if(document.fullscreenElement&&dialog.contains(document.fullscreenElement))document.exitFullscreen().catch(()=>{});
    if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus();else $('#open-media').focus();
  }
  const library=mountLibrary({store,engine,playSaved:(item,{background=false}={})=>{if(!background)selectTab(item.kind);message('');return engine.play(`saved:${item.id}`);},message});
  $('#open-media').onclick=open;$('#mini-open').onclick=open;$('#close-media').onclick=()=>{engine.closeDialog();dialog.close();};dialog.addEventListener('cancel',()=>engine.closeDialog());dialog.addEventListener('close',closed);
  // Native dialog cancel/Esc closes the top layer; display shortcuts already ignore open dialogs.
  function selectTab(next){if(!['music','video'].includes(next))return;tab=next;engine.switchTab(tab);for(const b of dialog.querySelectorAll('[data-media-tab]')){const selected=b.dataset.mediaTab===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}for(const panel of dialog.querySelectorAll('[data-media-panel]'))panel.hidden=panel.dataset.mediaPanel!==tab;render(engine.getState());}
  const tabs=[...dialog.querySelectorAll('[data-media-tab]')];tabs.forEach((b,i)=>{b.onclick=()=>selectTab(b.dataset.mediaTab);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;selectTab(tabs[n].dataset.mediaTab);tabs[n].focus();};});
  for(const kind of ['music','video']){
    $(`#${kind}-files`).onchange=event=>action(()=>{const files=[...event.target.files];if(!files.length)return;engine.addFiles(files,kind);event.target.value='';message(`已加入 ${files.length} 個本機檔案。請點暫存佇列的播放按鈕；重新整理後需重新選檔。`);});
    $(`#${kind}-url-form`).onsubmit=event=>{event.preventDefault();action(async()=>{const source=parseSource($(`#${kind}-url`).value,kind),id=engine.addURL(source,$(`#${kind}-name`).value|| (source.source==='youtube'?'YouTube 教學影片':'線上媒體'));await engine.play(id);});};
    $(`#clear-${kind}`).onclick=()=>{if(confirm('清空這個暫存佇列？本機檔案需要重新選擇，網址也不會保留。'))action(()=>engine.clear(kind));};
  }
  $('#media-original').onclick=()=>engine.stop();
  $('#media-play').onclick=()=>action(()=>engine.play());$('#media-pause').onclick=()=>engine.pause();$('#media-stop').onclick=()=>action(()=>engine.stop());
  $('#media-previous').onclick=()=>action(()=>engine.previous());$('#media-next').onclick=()=>action(()=>engine.next());
  $('#media-volume').oninput=()=>library.setPreferences({volume:Number($('#media-volume').value)});
  $('#media-mute').onchange=()=>library.setPreferences({muted:$('#media-mute').checked});
  $('#media-progress').onpointerdown=()=>{scrubbing=true;};window.addEventListener('pointerup',()=>{scrubbing=false;});$('#media-progress').onpointercancel=()=>{scrubbing=false;};
  $('#media-progress').onchange=()=>action(()=>engine.seek(Number($('#media-progress').value)));
  $('#media-rate').onchange=async()=>{if(!await library.setPreferences({rate:Number($('#media-rate').value)}))$('#media-rate').value=String(engine.getState().rate);};
  $('#media-repeat').onchange=()=>library.setPreferences({repeat:$('#media-repeat').value});$('#media-shuffle').onchange=()=>library.setPreferences({shuffle:$('#media-shuffle').checked});
  $('#video-fullscreen').onclick=()=>action(async()=>{if(!document.fullscreenEnabled||!video.requestFullscreen)throw Error('此頁面不支援影片全螢幕，請直接用 Chrome / Edge 開啟網站。');try{await video.requestFullscreen();}catch{throw Error('瀏覽器未允許影片全螢幕。請直接點按按鈕，或改用 Chrome／Edge 開啟網站。');}});
  $('#mini-play').onclick=()=>action(()=>engine.play());$('#mini-pause').onclick=()=>engine.pause();$('#mini-stop').onclick=()=>action(()=>engine.stop());
  function render(s){
    const current=s.current,native=current?.source!=='youtube',sameTab=current?.kind===tab;
    $('#media-current').textContent=current?`${current.kind==='music'?'音樂':'影片'}：${current.name}`:'尚未選取媒體';
    $('#media-status').textContent=({STOPPED:'已停止',LOADING:'載入中',PLAYING:'播放中',PAUSED:'已暫停',BUFFERING:'緩衝中',ENDED:'播放結束',ERROR:'播放失敗',EMBEDDED:'官方播放器已開啟，請在播放器內按播放；播放狀態由 YouTube 管理。'})[s.status];
    if(s.error)message(s.error,true);
    else if(!uiError&&current?.source==='youtube')message('YouTube 是否允許播放取決於來源及網路。若播放器顯示禁止嵌入、年齡／地區限制或無法載入，請開啟原始頁面；本站不繞過限制。');
    else if(!uiError&&current?.kind==='video'&&video.readyState>=1&&video.videoWidth===0)message('此來源沒有可顯示的影像，可能只有音訊，或影像編碼不受瀏覽器支援。請改用相容格式。');
    else if(!uiError&&current)message(current.source==='local'?'本機來源僅在本次頁面有效，不寫入備份；重新整理需重新選檔。':'線上來源使用瀏覽器直接載入；網址、網路、權限或編碼可能影響播放。');
    $('#media-video').hidden=!(current?.kind==='video'&&native&&s.status!=='STOPPED');youtubeHost.hidden=!(current?.source==='youtube'&&s.status!=='STOPPED'&&s.status!=='ERROR');
    for(const id of ['#media-play','#media-pause','#media-progress','#media-volume','#media-mute','#media-rate'])$(id).disabled=!current||!native||!sameTab;
    $('#media-play').disabled||=s.status==='PLAYING';$('#media-pause').disabled||=!['PLAYING','BUFFERING','LOADING'].includes(s.status);
    $('#media-progress').disabled||=!(s.duration>0&&s.status!=='STOPPED');$('#media-stop').disabled=!current||s.status==='STOPPED';
    $('#media-previous').disabled=!current||current.kind!=='music'||s.queues.music.length<2;$('#media-next').disabled=$('#media-previous').disabled;
    $('#video-fullscreen').disabled=!(current?.kind==='video'&&native&&sameTab&&!['STOPPED','ERROR'].includes(s.status)&&video.readyState>0&&video.videoWidth>0&&document.fullscreenEnabled&&video.requestFullscreen);
    $('#media-time').textContent=`${time(s.time)} / ${time(s.duration)}`;if(!scrubbing){$('#media-progress').max=s.duration||1;$('#media-progress').value=Math.min(s.time,s.duration||1);}
    $('#media-volume').value=s.volume;$('#media-mute').checked=s.muted;$('#media-rate').value=String(s.rate);$('#media-repeat').value=s.repeat;$('#media-shuffle').checked=s.shuffle;
    const original=$('#media-original');original.hidden=!current||current.source==='local';if(current&&current.source!=='local')original.href=current.url;else original.removeAttribute('href');
    $('#youtube-controls-note').hidden=current?.source!=='youtube';
    if(!current||current.kind!=='video'||s.status==='STOPPED')lastVideoId=null;
    else if(dialog.open&&sameTab&&current.id!==lastVideoId){lastVideoId=current.id;(current.source==='youtube'?youtubeHost:video).scrollIntoView({block:'center'});}
    const signature=JSON.stringify([s.queues,current?.id]);if(signature!==queueSignature){queueSignature=signature;for(const kind of ['music','video']){
      const list=$(`#${kind}-queue`);list.replaceChildren();for(const item of s.queues[kind].filter(item=>!item.libraryId)){const li=el('li');li.append(el('span',`${item.name} · ${item.source==='local'?'本機（需重新選檔）':item.source==='youtube'?'YouTube':'HTTPS'}`),button('播放',()=>action(()=>engine.play(item.id))));li.lastChild.setAttribute('aria-label',`播放 ${item.name}`);if(item.id===current?.id)li.setAttribute('aria-current','true');list.append(li);}if(!s.queues[kind].some(item=>!item.libraryId))list.append(el('li','尚無暫存媒體。'));
    }}
    const mini=$('#music-mini');mini.hidden=dialog.open||current?.kind!=='music'||s.status==='STOPPED';$('#mini-name').textContent=current?.kind==='music'?(current.name.length>18?current.name.slice(0,18)+'…':current.name):'';$('#mini-name').title=current?.name??'';$('#mini-status').textContent=$('#media-status').textContent;$('#mini-error').textContent=s.error;$('#mini-play').disabled=s.status==='PLAYING';$('#mini-pause').disabled=!['PLAYING','BUFFERING','LOADING'].includes(s.status);
  }
  engine.subscribe(render);render(engine.getState());
  // Closing audio is allowed to keep playing; show the miniature controls after the close event.
  dialog.addEventListener('close',()=>render(engine.getState()));
  window.addEventListener('pagehide',event=>{if(event.persisted)engine.stop();else engine.dispose();});
}
