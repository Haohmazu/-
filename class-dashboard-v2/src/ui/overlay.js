// One coordinator for existing native dialogs; media close handlers still own cleanup.
const openers=new WeakMap();
export function openOverlay(dialog,opener=document.activeElement){
 for(const other of document.querySelectorAll('dialog[open]'))if(other!==dialog)other.close();
 if(!dialog.open){openers.set(dialog,opener);dialog.showModal();}
 if(!dialog.dataset.overlayBound){dialog.dataset.overlayBound='true';dialog.addEventListener('close',()=>{const target=openers.get(dialog);if(!document.querySelector('dialog[open]')&&target?.isConnected&&!target.closest('[hidden]'))target.focus({preventScroll:true});});}
}
