import {validateItem,mediaError} from './sources.js?v=2.0-three-columns.0';
// One runtime coordinator. It has no reference to the classroom store/localStorage.
export function createMediaCoordinator({audio,video,youtube,createObjectURL=file=>URL.createObjectURL(file),revokeObjectURL=url=>URL.revokeObjectURL(url),newId=()=>crypto.randomUUID(),random=Math.random}){
  const queues={music:[],video:[]},owned=new Set(),listeners=new Set();
  let current=null,status='STOPPED',error='',volume=.5,muted=false,repeat='none',shuffle=false,rate=1,epoch=0,active=null,bindings=[],disposed=false,shuffled=new Set(),playAttempt=0;
  const view=()=>({current:current?{...current}:null,status,error,volume,muted,repeat,shuffle,rate,time:active&&Number.isFinite(active.currentTime)?active.currentTime:0,duration:active&&Number.isFinite(active.duration)?active.duration:0,queues:{music:queues.music.map(x=>({...x})),video:queues.video.map(x=>({...x}))}});
  const emit=(event='state')=>{for(const fn of listeners){try{fn(view(),event);}catch{/* UI errors cannot change playback or classroom data. */}}};
  function unbind(){for(const [node,name,fn] of bindings)node.removeEventListener(name,fn);bindings=[];}
  function bind(node,name,fn){node.addEventListener(name,fn);bindings.push([node,name,fn]);}
  function detach(){
    unbind();for(const node of [audio,video]){try{node.pause();node.removeAttribute('src');node.load();}catch{/* Continue cleaning the other source. */}}
    try{youtube.unmount();}catch{}active=null;
  }
  function find(id){return [...queues.music,...queues.video].find(item=>item.id===id);}
  function select(item){
    if(disposed)throw Error('播放器已關閉。');epoch++;detach();current=item;if(shuffle&&item.kind==='music')shuffled.add(item.id);status=item.source==='youtube'?'EMBEDDED':'LOADING';error='';
    if(item.source==='youtube'){try{youtube.mount(item);}catch{status='ERROR';error='無法建立 YouTube 官方播放器，請改開啟原始影片頁。';}emit('selected');return;}
    const node=item.kind==='music'?audio:video,token=epoch;active=node;
    node.volume=volume;node.muted=muted;node.playbackRate=rate;node.src=item.url;node.preload='metadata';
    const valid=()=>token===epoch&&active===node;
    bind(node,'playing',()=>{if(valid()&&!node.paused){status='PLAYING';error='';emit();}});
    bind(node,'pause',()=>{if(valid()&&status!=='STOPPED'&&status!=='ERROR'&&node.paused&&!node.ended){status='PAUSED';emit();}});
    bind(node,'waiting',()=>{if(valid()&&status==='PLAYING'){status='BUFFERING';emit();}});
    bind(node,'error',()=>{if(valid()&&node.error){status='ERROR';error=mediaError(node.error);try{node.pause();}catch{}emit();}});
    for(const event of ['loadedmetadata','durationchange','timeupdate','volumechange','ratechange'])bind(node,event,()=>{if(!valid())return;if(event==='volumechange'){volume=node.volume;muted=node.muted;}if(event==='ratechange')rate=node.playbackRate;emit(['volumechange','ratechange'].includes(event)?'native-preference':'state');});
    bind(node,'ended',()=>{if(!valid())return;if(item.kind==='music'&&repeat==='single'){node.currentTime=0;play();}else if(item.kind==='music')next(false);else{status='ENDED';emit();}});
    node.load();emit('selected');
  }
  async function play(id){
    if(id!==undefined){const item=find(id);if(!item)throw Error('找不到暫存媒體，請重新選檔或加入網址。');select(item);}
    else if(current&&['STOPPED','ERROR'].includes(status))select(current);
    if(!current)throw Error('請先選擇媒體。');
    if(current.source==='youtube'){if(id===undefined&&status==='PAUSED'){try{youtube.play();status='EMBEDDED';emit();}catch{error='YouTube 控制尚未就緒，請使用官方播放按鈕。';emit();}}return;}
    if(!active)return;
    const node=active,token=epoch,attempt=++playAttempt;
    try{await node.play();if(token===epoch&&attempt===playAttempt&&!node.paused){status='PLAYING';error='';emit();}}
    catch(reason){if(token!==epoch||attempt!==playAttempt)return;status='ERROR';try{node.pause();}catch{}error=reason?.name==='NotAllowedError'?'瀏覽器阻擋了播放。請再直接點按播放按鈕。':reason?.name==='NotSupportedError'?'此來源或實際編碼不受瀏覽器支援。':'播放失敗，請檢查來源及瀏覽器提示。';emit();}
  }
  function pause(){if(current?.source==='youtube'){try{youtube.pause();status='PAUSED';emit();}catch{stop();error='YouTube 控制尚未就緒，已停止播放器以避免繼續發聲。';emit();}return;}playAttempt++;active?.pause();if(current&&status!=='STOPPED'&&status!=='ERROR'){status='PAUSED';emit();}}
  function stop(){epoch++;playAttempt++;detach();shuffled.clear();status='STOPPED';error='';emit();}
  function next(manual=true,direction=1){
    if(!current)return;const queue=queues[current.kind];let index=queue.findIndex(x=>x.id===current.id);
    if(shuffle&&queue.length>1&&direction===1){
      let alternatives=queue.filter(x=>x.id!==current.id&&!shuffled.has(x.id));
      if(!alternatives.length){if(!manual&&repeat!=='all'){status='ENDED';emit();return;}shuffled=new Set([current.id]);alternatives=queue.filter(x=>x.id!==current.id);}
      index=queue.indexOf(alternatives[Math.min(alternatives.length-1,Math.max(0,Math.floor(random()*alternatives.length)))]);
    }
    else index+=direction;
    if(index<0||index>=queue.length){if(manual||repeat==='all')index=(index+queue.length)%queue.length;else{status='ENDED';emit();return;}}
    return play(queue[index].id);
  }
  return {
    getState:view,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    addURL(source,name){if(disposed||source?.source==='local')throw Error('請使用選檔功能加入本機檔案。');const item={...source,id:newId(),name:(name||'線上媒體').trim()};validateItem(item);if(queues[item.kind].filter(x=>!x.libraryId).length>=100)throw Error('暫存佇列最多 100 筆。');queues[item.kind].push(item);emit();return item.id;},
    addFiles(files,kind){
      if(disposed||!['music','video'].includes(kind)||!files.length)throw Error('請選擇媒體檔案。');
      if(queues[kind].filter(x=>!x.libraryId).length+files.length>100)throw Error('每種暫存佇列最多 100 筆。');
      const added=[],created=[];
      try{for(const file of files){const url=createObjectURL(file);owned.add(url);created.push(url);const item={id:newId(),name:String(file.name||'本機媒體').slice(0,200),kind,source:'local',url};validateItem(item);added.push(item);}}
      catch(e){for(const url of created){owned.delete(url);revokeObjectURL(url);}throw e;}
      queues[kind].push(...added);emit();return added.map(x=>x.id);
    },
    syncLibrary(items){
      if(!Array.isArray(items)||items.length>500)throw Error('網址庫超出限制。');
      const saved=items.map(item=>({id:`saved:${item.id}`,libraryId:item.id,name:item.name,kind:item.kind,source:item.source,url:item.url,...(item.videoId?{videoId:item.videoId}:{})}));
      const ids=new Set();for(const item of saved){validateItem(item);if(item.source==='local'||ids.has(item.id))throw Error('網址庫來源不正確。');ids.add(item.id);}
      if(current?.libraryId){const updated=saved.find(item=>item.id===current.id);if(!updated||updated.url!==current.url||updated.kind!==current.kind||updated.source!==current.source){stop();current=updated??null;}else current=updated;}
      for(const kind of ['music','video'])queues[kind]=[...queues[kind].filter(item=>!item.libraryId),...saved.filter(item=>item.kind===kind)];emit();
    },
    play,pause,stop,next:()=>next(true),previous:()=>next(true,-1),
    closeDialog(){if(current?.kind==='video'&&status!=='STOPPED')stop();},
    switchTab(kind){if(current&&current.kind!==kind){if(current.kind==='video')stop();else pause();}},
    clear(kind){if(!queues[kind])throw Error('媒體類型不正確。');if(current?.kind===kind&&!current.libraryId){stop();current=null;}for(const item of queues[kind].filter(x=>!x.libraryId))if(owned.delete(item.url))revokeObjectURL(item.url);queues[kind]=queues[kind].filter(x=>x.libraryId);emit();},
    setVolume(value){if(!Number.isFinite(value)||value<0||value>1)throw Error('音量需介於 0–1。');volume=value;for(const node of [audio,video])node.volume=value;emit();},
    setMuted(value){if(typeof value!=='boolean')throw Error('靜音設定不正確。');muted=value;for(const node of [audio,video])node.muted=value;emit();},
    seek(value){if(!active||!Number.isFinite(value)||value<0||!Number.isFinite(active.duration)||value>active.duration)throw Error('目前無法跳至此播放位置。');active.currentTime=value;emit();},
    setRate(value){if(![.5,.75,1,1.25,1.5,2].includes(value))throw Error('目前不支援這個播放速度。');try{if(active)active.playbackRate=value;rate=value;emit();}catch{throw Error('瀏覽器不支援此播放速度。');}},
    setRepeat(value){if(!['none','single','all'].includes(value))throw Error('循環模式不正確。');repeat=value;emit();},
    setShuffle(value){if(typeof value!=='boolean')throw Error('隨機播放設定不正確。');shuffle=value;shuffled=new Set(current?.kind==='music'?[current.id]:[]);emit();},
    dispose(){if(disposed)return;stop();for(const url of owned)revokeObjectURL(url);owned.clear();queues.music=[];queues.video=[];current=null;disposed=true;listeners.clear();}
  };
}
