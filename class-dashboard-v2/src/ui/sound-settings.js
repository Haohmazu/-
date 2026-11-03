import {$,el,notify} from './dom.js?v=2.0-ID.0';
export function mountSoundSettings(store,{sound}){
 const views=[];let saving=false,message='設定會自動保存。';
 for(const [host,prefix] of [[$('#sound-form'),'sound'],[$('#timer-sound-options'),'timer-sound']]){
  host.replaceChildren();host.onsubmit=e=>e.preventDefault();const label=el('label'),enabled=el('input');label.className='sound-switch';enabled.type='checkbox';enabled.id=`${prefix}-enabled`;enabled.setAttribute('role','switch');const status=el('span');label.append(enabled,status);
  const typeLabel=el('label','提示音種類'),type=el('select');type.id=`${prefix}-type`;for(const [value,text] of [['electronic','電子提示音'],['bell','柔和鐘聲'],['ring','清脆鈴聲']])type.append(new Option(text,value));typeLabel.append(type);
  const volumeLabel=el('label','提示音音量 '),percent=el('output'),volume=el('input');volume.type='range';volume.id=`${prefix}-volume`;volume.min='0';volume.max='1';volume.step='.05';percent.id=`${prefix}-percent`;volumeLabel.append(percent,volume);
  const countLabel=el('label','播放次數'),count=el('select');count.id=`${prefix}-count`;for(const value of [1,2,3])count.append(new Option(`${value} 次`,value));countLabel.append(count);
  const preview=el('button','試聽提示音');preview.type='button';preview.id=`${prefix}-preview`;const feedback=el('p');feedback.id=`${prefix}-feedback`;feedback.setAttribute('role','status');feedback.className='sound-feedback';host.append(label,typeLabel,volumeLabel,countLabel,preview,feedback);
  const view={enabled,status,type,volume,percent,count,preview,feedback};views.push(view);
  const command=async()=>{if(saving)return render();const c={type:'SET_SOUND',enabled:enabled.checked,volume:Number(volume.value),soundType:type.value,repeatCount:Number(count.value)};saving=true;message='正在儲存提示音設定…';render();try{await store.dispatch(c);message='提示音設定已儲存。';}catch(e){message=`未儲存，已恢復原設定：${e.message}`;notify(message,true);}finally{saving=false;render();}};
  for(const control of [enabled,type,volume,count])control.onchange=command;volume.oninput=()=>{percent.textContent=`${Math.round(Number(volume.value)*100)}%${Number(volume.value)===0?'（靜音）':''}`;};
  preview.onclick=async()=>{const result=await sound.preview(store.getDisplayState().preferences);if(result.cancelled)return;if(result.error)message=`試聽失敗：${result.error}`;else if(result.played)message='正在試聽已選音效；不會改變計時器或提示音開關。';else message='目前音量為0，已靜音。';render();feedback.scrollIntoView({block:'nearest'});};
 }
 function render(){const p=store.getDisplayState().preferences;for(const v of views){v.enabled.checked=p.timerSound;v.enabled.setAttribute('aria-checked',String(p.timerSound));v.status.textContent=p.timerSound?'提示音：開啟':'提示音：關閉';v.type.value=p.timerSoundType;v.volume.value=p.volume;v.percent.textContent=`${Math.round(p.volume*100)}%${p.volume===0?'（靜音）':''}`;v.count.value=p.timerSoundCount;v.feedback.textContent=message;for(const c of [v.enabled,v.type,v.volume,v.count,v.preview])c.disabled=saving;}}
 store.subscribe(render);render();
}
