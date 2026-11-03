import {$,el,button} from './dom.js?v=2.0-three-columns.0';
export function mountWidgets({store,media,stage}){
 const {engine}=media,tabs=['music','videos','tools'],viewer=$('#video-viewer');let listSignature,categorySignature;
 // These existing buttons move exactly once before any playback; media nodes never move.
 const toolbar=document.querySelector('main .visual-actions');$('#right-tools').append(toolbar);$('#open-media').textContent='完整多媒體';
 function selectTab(next){for(const name of tabs){const tab=$(`#widget-tab-${name}`);tab.setAttribute('aria-selected',String(name===next));tab.tabIndex=name===next?0:-1;$(`#widget-${name}`).hidden=name!==next;}}
 tabs.forEach((name,i)=>{const tab=$(`#widget-tab-${name}`);tab.onclick=()=>selectTab(name);tab.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;selectTab(tabs[n]);$(`#widget-tab-${tabs[n]}`).focus();};});
 const safe=async fn=>{try{await fn();}catch(e){$('#widget-message').textContent=e.message;}};
 $('#widget-music-play').onclick=()=>safe(()=>{const s=engine.getState();if(s.current?.kind==='music')return engine.play();const first=s.queues.music[0];if(!first)throw Error('請先開啟完整播放清單選曲或加入音樂。');return engine.play(first.id);});
 $('#widget-music-pause').onclick=()=>{if(engine.getState().current?.kind==='music')engine.pause();};$('#widget-music-prev').onclick=()=>safe(()=>engine.previous());$('#widget-music-next').onclick=()=>safe(()=>engine.next());
 $('#widget-volume').oninput=async()=>{const ok=await media.setPreferences({volume:Number($('#widget-volume').value)});render(engine.getState());if(!ok)$('#widget-message').textContent='音量設定未儲存，已恢復原值。';};$('#widget-muted').onchange=async()=>{const ok=await media.setPreferences({muted:$('#widget-muted').checked});render(engine.getState());if(!ok)$('#widget-message').textContent='靜音設定未儲存，已恢復原值。';};
 $('#widget-playlist').onclick=()=>{media.open();$('#music-tab').click();};$('#widget-add-video').onclick=()=>{media.open();$('#video-tab').click();};
 function renderList(){const data=store.getDisplayState().mediaLibrary;
  const categories=JSON.stringify(data.categories);if(categories!==categorySignature){categorySignature=categories;const selected=$('#widget-category').value;$('#widget-category').replaceChildren(new Option('全部分類',''));for(const c of data.categories)$('#widget-category').append(new Option(c.name,c.id));if([...$('#widget-category').options].some(o=>o.value===selected))$('#widget-category').value=selected;}
  const category=$('#widget-category').value,query=$('#widget-search').value.trim().toLocaleLowerCase();const local=engine.getState().queues.video.filter(i=>!i.libraryId),items=[...data.items.filter(i=>i.kind==='video'),...local];const signature=JSON.stringify([items,query,category]);if(signature===listSignature)return;listSignature=signature;$('#widget-video-list').replaceChildren();
  for(const item of items.filter(i=>(!category||i.categoryId===category)&&(!query||i.name.toLocaleLowerCase().includes(query)))){const row=el('li');row.append(el('strong',item.name),el('small',item.source==='local'?'本機：本次頁面有效':item.source==='youtube'?'YouTube 官方嵌入':'HTTPS 直接影片'),button('中央播放',()=>safe(()=>local.some(i=>i.id===item.id)?media.play(item.id):media.playSaved(item))));$('#widget-video-list').append(row);}if(!$('#widget-video-list').children.length)$('#widget-video-list').append(el('li','沒有符合的影片；可開啟完整清單新增或選檔。'));
 }
 $('#widget-search').oninput=renderList;$('#widget-category').onchange=renderList;store.subscribe(renderList);
 function restore(){if(viewer.matches(':modal'))viewer.close();}
 $('#video-enlarge').onclick=()=>{viewer.close();viewer.showModal();$('#video-enlarge').hidden=true;$('#video-restore').hidden=false;$('#video-restore').focus();};
 $('#video-restore').onclick=restore;
 viewer.addEventListener('close',()=>{if(viewer.matches(':modal'))return;if(!viewer.open)viewer.show();$('#video-enlarge').hidden=false;$('#video-restore').hidden=true;$('#video-enlarge').focus();});
 $('#central-play').onclick=()=>safe(()=>media.play());$('#central-pause').onclick=()=>engine.pause();$('#central-stop').onclick=()=>engine.stop();
 $('#central-fullscreen').disabled=!document.fullscreenEnabled;$('#central-fullscreen').onclick=()=>safe(async()=>{try{await $('#video-surface').requestFullscreen();}catch{throw Error('瀏覽器拒絕全螢幕，請直接點按按鈕或使用 Chrome／Edge。');}});
 stage.setVideoExit(()=>{restore();if(document.fullscreenElement&&viewer.contains(document.fullscreenElement))document.exitFullscreen().catch(()=>{});const s=engine.getState();if(s.current?.kind==='video'&&!['STOPPED','ERROR'].includes(s.status))engine.pause();});
 function render(s){const music=s.current?.kind==='music',video=s.current?.kind==='video',native=s.current?.source!=='youtube';$('#widget-track').textContent=music?s.current.name:'尚未選曲';$('#widget-music-status').textContent=music?({PLAYING:'播放中',PAUSED:'已暫停',STOPPED:'已停止',ERROR:'播放失敗'}[s.status]||'正在載入'):video?'影片已接管音源，音樂不會自動恢復。':'請選擇音樂。';$('#widget-message').textContent=s.error||'';
  $('#widget-music-pause').disabled=!music||!['PLAYING','BUFFERING','LOADING'].includes(s.status);$('#widget-music-prev').disabled=!music||s.queues.music.length<2;$('#widget-music-next').disabled=$('#widget-music-prev').disabled;$('#widget-volume').value=s.volume;$('#widget-muted').checked=s.muted;
  $('#central-video-title').textContent=video?s.current.name:'教學影片';$('#central-video-state').textContent=video&&!native&&s.status==='PAUSED'?'已送出暫停指令，請使用官方播放器繼續。':video?({PLAYING:'播放中',PAUSED:'已暫停，可恢復原進度',STOPPED:'已停止',ERROR:s.error,EMBEDDED:'請使用 YouTube 官方播放器控制'}[s.status]||'正在載入'):'';$('#central-video-empty').hidden=video&&!['STOPPED','ERROR'].includes(s.status);$('#central-play').disabled=!video||!native||['PLAYING','LOADING','BUFFERING'].includes(s.status);$('#central-pause').disabled=!video||!native||!['PLAYING','LOADING','BUFFERING'].includes(s.status);$('#central-stop').disabled=!video||s.status==='STOPPED';renderList();
 }
 engine.subscribe(render);render(engine.getState());
}
