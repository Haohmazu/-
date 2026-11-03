import {$,el,button,option} from './dom.js?v=2.0-integration-IB.0';
import {openOverlay} from './overlay.js?v=2.0-integration-IB.0';
import {STYLES,appearanceTokens} from '../display/appearance.js?v=2.0-integration-IB.0';
const tokenKeys=['page','card','text','muted','border','surface','clock','accent','error','feedback','button-text'];
export function mountAppearance(store){
 const dialog=$('#appearance-dialog');let draft=null;
 function paint(){const s=store.getDisplayState(),value=draft??s.appearance,tokens=appearanceTokens(value,s.display.theme);document.body.dataset.style=value.style;document.body.dataset.palette=value.palette;document.body.dataset.preview=String(!!draft);for(const key of tokenKeys){if(tokens)document.body.style.setProperty('--'+key,tokens[key]);else document.body.style.removeProperty('--'+key);}$('#appearance-preview-name').textContent=value.style==='legacy'?'沿用原有主題':STYLES.find(s=>s.id===value.style).name+' · '+STYLES.find(s=>s.id===value.style).palettes.find(p=>p[0]===value.palette)[1];}
 function palettes(){const style=$('#appearance-style').value;$('#appearance-palette').replaceChildren(...(style==='legacy'?[option('default','原有三種主題')]:STYLES.find(s=>s.id===style).palettes.map(p=>option(p[0],p[1]))));}
 $('#appearance-style').append(option('legacy','保留原有外觀'),...STYLES.map(s=>option(s.id,s.name)));
 const cards=$('#appearance-options');for(const style of STYLES){const card=el('article');card.className='style-sample';card.dataset.sample=style.id;card.append(el('strong',style.icon+' '+style.name),el('p',style.description));const swatches=el('div');for(const p of style.palettes){const b=button(p[1],()=>{$('#appearance-style').value=style.id;palettes();$('#appearance-palette').value=p[0];preview();});b.style.borderColor=p[6];swatches.append(b);}card.append(swatches);cards.append(card);}
 function preview(){draft={style:$('#appearance-style').value,palette:$('#appearance-palette').value};paint();$('#appearance-message').textContent='預覽中，尚未保存。取消或 Esc 會恢復原設定。';}
 $('#appearance-style').onchange=()=>{palettes();preview();};$('#appearance-palette').onchange=preview;
 $('#open-appearance').onclick=()=>{const saved=store.getDisplayState().appearance;draft={...saved};$('#appearance-style').value=saved.style;palettes();$('#appearance-palette').value=saved.palette;$('#appearance-message').textContent='選擇風格與配色後預覽，確認才保存。';openOverlay(dialog);paint();};
 $('#appearance-cancel').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{draft=null;paint();});
 $('#appearance-apply').onclick=async()=>{const value={...(draft??store.getDisplayState().appearance)},apply=$('#appearance-apply');apply.disabled=true;try{await store.dispatch({type:'SET_APPEARANCE',appearance:value});draft=null;dialog.close();}catch(e){draft=null;paint();const saved=store.getDisplayState().appearance;$('#appearance-style').value=saved.style;palettes();$('#appearance-palette').value=saved.palette;$('#appearance-message').textContent=`未套用：${e.message} 原外觀已恢復。`;}finally{apply.disabled=false;}};
 store.subscribe(paint);paint();
}
