export function shortcutFor(event,{dialogOpen=false,focus='home'}={}){
  if(event.defaultPrevented||event.isComposing||event.keyCode===229||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||dialogOpen)return null;
  const target=event.target;
  if(target?.closest?.('input,textarea,select,button,a,summary,[role="button"],[role="switch"],[contenteditable]:not([contenteditable="false"]),[role="tab"]'))return null;
  const key=event.key.toLowerCase();
  const modes={'0':'home','1':'clock','2':'timer','3':'schedule','4':'picker'};
  if(Object.hasOwn(modes,key))return {type:'focus',value:modes[key]};
  if(key==='f')return {type:'fullscreen'};
  if(key==='s')return {type:'settings'};
  if(key===' '&&focus==='timer')return {type:'timer-toggle'};
  return null;
}
