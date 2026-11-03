import {$} from './dom.js?v=2.0-home-layout.0';
import {openOverlay} from './overlay.js?v=2.0-home-layout.0';
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('visual-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`./assets/visual/icons.svg#${name}`);svg.append(use);return svg;}
export function mountVisual(store){
 const targets=[['.brand','book'],['.clock-card','clock'],['.course-card h2','book'],['.timetable-card h2','calendar'],['.timer-card h2','timer'],['.picker-card h2','dice'],['#open-appearance','palette'],['#open-display-controls','screen'],['#open-settings','settings'],['#open-media','media'],['#stage-focus','screen'],['#visual-roster-link','people'],['#classroom-tools','timer']];
 for(const [selector,name] of targets){const host=$(selector);if(host)host.prepend(icon(name));}
 $('#open-display-controls').onclick=()=>{openOverlay($('#presentation-dialog'));$('#close-display-controls').focus();};$('#close-display-controls').onclick=()=>$('#presentation-dialog').close();
 $('#visual-roster-link').onclick=()=>$('#open-roster').click();
 const render=()=>{$('#visual-roster-link').disabled=document.body.dataset.privacy==='true';};store.subscribe(render);render();
}
