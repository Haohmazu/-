// React only to committed timer commands; initialization/restore never starts media.
export function connectTimerMedia({store,engine,playSaved,onError}){
  return store.subscribe((state,event)=>{
    if(!event?.type.startsWith('TIMER_'))return;
    const link=state.mediaLibrary.timerLink,current=engine.getState();
    if(event.type==='TIMER_START'&&link.enabled){
      const item=state.mediaLibrary.items.find(item=>item.id===link.musicId&&item.kind==='music');if(!item)return;
      if(current.current?.libraryId===item.id&&['PLAYING','BUFFERING','LOADING'].includes(current.status))return;
      try{Promise.resolve(current.current?.libraryId===item.id&&current.status==='PAUSED'?engine.play():playSaved(item)).catch(e=>onError(e.message));}catch(e){onError(e.message);}
    }
    if(event.type==='TIMER_PAUSE'&&state.timer.status==='PAUSED'&&link.pauseWithTimer&&current.current?.kind==='music'&&['PLAYING','BUFFERING','LOADING'].includes(current.status))engine.pause();
    if(state.timer.status==='FINISHED'&&event.previousTimer?.status!=='FINISHED'){
      if(current.current?.kind==='music'){if(link.musicEnd==='pause')engine.pause();if(link.musicEnd==='stop')engine.stop();}
      if(current.current?.kind==='video'&&link.pauseVideoOnEnd)engine.pause();
    }
  });
}
