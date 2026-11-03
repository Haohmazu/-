import {youtubeEmbed} from './sources.js?v=2.0-ID.0';
let apiPromise;
export function loadYouTubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(apiPromise)return apiPromise;
  const pending=new Promise((resolve,reject)=>{
    const previous=window.onYouTubeIframeAPIReady;
    const script=document.createElement('script');let settled=false;
    const finish=(error)=>{
      if(settled)return;settled=true;clearTimeout(timeout);
      if(window.onYouTubeIframeAPIReady===ready)window.onYouTubeIframeAPIReady=previous;
      script.onerror=null;
      if(error){script.remove();reject(error);}else resolve(window.YT);
    };
    const ready=()=>{try{previous?.();}catch{}finish(window.YT?.Player?null:Error('YouTube API 尚未就緒，請重新點選影片重試。'));};
    const timeout=setTimeout(()=>finish(Error('YouTube API 載入逾時，可重新點選影片重試，或使用官方播放器控制。')),12000);
    window.onYouTubeIframeAPIReady=ready;
    script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.onerror=()=>finish(Error('無法連線 YouTube 控制 API，請檢查網路後重新點選影片。'));
    document.head.append(script);
  });
  apiPromise=pending;
  // A transient network failure must not poison every subsequent play attempt.
  pending.catch(()=>{if(apiPromise===pending)apiPromise=undefined;});
  return pending;
}
export function createYouTubeAdapter(host,onWarning){
  let generation=0,player,ready=false;
  return {
    mount(item){
      const ticket=++generation;ready=false;
      const frame=document.createElement('iframe'),url=new URL(youtubeEmbed(item.videoId));url.searchParams.set('enablejsapi','1');url.searchParams.set('origin',location.origin);
      frame.id=`youtube-${ticket}`;frame.src=url.href;frame.title=`YouTube 官方播放器：${item.name}`;frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';host.replaceChildren(frame);
      loadYouTubeAPI().then(YT=>{
        if(ticket!==generation)return;
        player=new YT.Player(frame,{events:{onReady:e=>{if(ticket!==generation){e.target.destroy();return;}ready=true;},onError:e=>{if(ticket===generation)onWarning(`YouTube 官方播放器錯誤（${e.data}）。可能為禁止嵌入、來源不可用或播放限制，請查看官方提示。`);}}});
      }).catch(e=>{if(ticket===generation)onWarning(e.message);});
    },
    play(){if(!ready||!player?.playVideo)throw Error('YouTube 控制未就緒。');player.playVideo();},
    pause(){if(!ready||!player?.pauseVideo)throw Error('YouTube 控制未就緒。');player.pauseVideo();},
    unmount(){generation++;ready=false;try{player?.destroy();}catch{}player=null;for(const frame of host.querySelectorAll('iframe')){try{frame.src='about:blank';}finally{frame.remove();}}}
  };
}
