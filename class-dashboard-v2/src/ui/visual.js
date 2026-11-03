import {$,el} from './dom.js?v=2.0-visual.0';
import {openOverlay} from './overlay.js?v=2.0-visual.0';
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('visual-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`./assets/visual/icons.svg#${name}`);svg.append(use);return svg;}
export function mountVisual(store){
 const targets=[['.brand','book'],['.clock-card','clock'],['.course-card h2','book'],['.timetable-card h2','calendar'],['.timer-card h2','timer'],['.picker-card h2','dice'],['.home-notes-card h2','note'],['#open-appearance','palette'],['#open-display-controls','screen'],['#fullscreen-toggle','fullscreen'],['#open-settings','settings'],['#open-media','media'],['#visual-notes-link','note'],['#visual-roster-link','people'],['#visual-display-link','screen']];
 for(const [selector,name] of targets){const host=$(selector);if(host)host.prepend(icon(name));}
 // Button text renderers may replace their children; keep the fullscreen state text managed by its controller.
 $('#open-display-controls').onclick=()=>{openOverlay($('#presentation-dialog'));$('#close-display-controls').focus();};$('#close-display-controls').onclick=()=>$('#presentation-dialog').close();
 const openNotes=()=>{$('#view-notes').click();$('#open-content').click();};$('#open-home-notes').onclick=openNotes;$('#visual-notes-link').onclick=openNotes;$('#visual-roster-link').onclick=()=>$('#open-roster').click();$('#visual-display-link').onclick=()=>$('#open-display-controls').click();
 const routes={home:()=>choose('home'),schedule:()=>{$('#view-today').click();$('#open-content').click();},timer:()=>choose('timer'),picker:()=>choose('picker'),media:()=>$('#open-media').click(),display:()=>$('#open-display-controls').click()};
 function choose(mode){const select=$('#focus-mode');select.value=mode;select.dispatchEvent(new Event('change',{bubbles:true}));}
 for(const b of document.querySelectorAll('[data-visual-route]')){b.prepend(icon({home:'book',schedule:'calendar',timer:'timer',picker:'dice',media:'media',display:'screen'}[b.dataset.visualRoute]));b.onclick=routes[b.dataset.visualRoute];}
 let signature;
 const render=s=>{const next=JSON.stringify(s.notes);if(next!==signature){signature=next;$('#home-notes-count').textContent=`${s.notes.filter(n=>!n.done).length} 項待完成 · 共 ${s.notes.length} 項`;
  $('#home-notes-preview').replaceChildren();for(const note of s.notes.slice(0,3)){const item=el('li');item.append(el('span',note.done?'✓':'○'),el('span',note.text.length>40?note.text.slice(0,40)+'…（查看全部）':note.text));item.classList.toggle('done',note.done);$('#home-notes-preview').append(item);}if(!s.notes.length)$('#home-notes-preview').append(el('li','尚無聯絡事項，可由教師設定新增。'));}
  $('#visual-roster-link').disabled=document.body.dataset.privacy==='true';
 };
 store.subscribe(render);render(store.getDisplayState());
}
