// Native top-layer presentation of existing DOM: no clone, second store or media move.
export function restoreCardFocus(){for(const d of document.querySelectorAll('dialog[data-card-focus]:modal')){d.close();if(!d.open)d.show();}}
export function mountCardFocus(store){
 const openers=new WeakMap();let lastMode=store.getDisplayState().display.focus;store.subscribe(s=>{if(s.display.focus!==lastMode)restoreCardFocus();lastMode=s.display.focus;});
 for(const dialog of document.querySelectorAll('dialog[data-card-focus]')){
  dialog.addEventListener('close',()=>{if(dialog.matches(':modal'))return;if(!dialog.open)dialog.show();dialog.querySelector('[data-close-focus]').hidden=true;const opener=openers.get(dialog);if(!document.querySelector('dialog:modal')&&opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});});
  dialog.addEventListener('keydown',event=>{if(event.key!=='Tab'||!dialog.matches(':modal'))return;const controls=[...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]')].filter(e=>e.tabIndex>=0&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');if(!controls.length)return;event.preventDefault();const index=controls.indexOf(document.activeElement);controls[index<0?(event.shiftKey?controls.length-1:0):(index+(event.shiftKey?controls.length-1:1))%controls.length].focus();});
  dialog.querySelector('[data-close-focus]').onclick=()=>restoreCardFocus();
 }
 for(const button of document.querySelectorAll('[data-card-target]'))button.onclick=()=>{
  if(button.dataset.cardTarget==='classroom-stage'&&document.body.dataset.stage==='video'){restoreCardFocus();document.querySelector('#video-enlarge').click();return;}
  const dialog=document.getElementById(button.dataset.cardTarget);restoreCardFocus();for(const other of document.querySelectorAll('dialog:modal'))other.close();openers.set(dialog,button);dialog.close();dialog.showModal();const close=dialog.querySelector('[data-close-focus]');close.hidden=false;close.focus();
 };
}
