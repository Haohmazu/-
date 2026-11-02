// Browser-owned state: never persisted and never changes classroom records.
export function createFullscreenController({document,onChange,onError}){
  let pending=false;
  const state=()=>({active:!!document.fullscreenElement,available:document.fullscreenEnabled!==false&&typeof document.documentElement.requestFullscreen==='function',pending});
  const update=()=>onChange(state());
  const error=()=>onError('瀏覽器未允許全螢幕。請直接點按全螢幕按鈕，或檢查瀏覽器與嵌入頁面的權限。');
  document.addEventListener('fullscreenchange',update);document.addEventListener('fullscreenerror',error);update();
  return {
    async toggle(){
      if(pending)return;
      if(!state().available&&!state().active){onError('此瀏覽器或目前頁面不支援全螢幕。請用 Chrome 或 Edge 直接開啟正式網站。');return;}
      pending=true;update();
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{error();}finally{pending=false;update();}
    },
    dispose(){document.removeEventListener('fullscreenchange',update);document.removeEventListener('fullscreenerror',error);}
  };
}
