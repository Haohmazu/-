import {taiwanParts} from '../school/time.js?v=2.0-visual.0';
import {$,el} from './dom.js?v=2.0-visual.0';
import {openOverlay} from './overlay.js?v=2.0-visual.0';
export function mountHome(store){
 const tabs=[$('#view-today'),$('#view-week'),$('#view-notes')],dialog=$('#content-details');let active='view-today',tableHome,tableNode;
 const restoreTable=()=>{if(tableHome){tableHome.replaceWith(tableNode);tableHome=null;tableNode=null;}};
 function select(id){active=id;for(const t of tabs){t.setAttribute('aria-selected',String(t.id===id));t.setAttribute('aria-pressed',String(t.id===id));t.tabIndex=t.id===id?0:-1;}$('#schedule-panel').hidden=id==='view-notes';$('#notes-panel').hidden=id!=='view-notes';$('#notes-edit').hidden=id!=='view-notes';$('#schedule-panel').setAttribute('aria-labelledby',id==='view-week'?'view-week':'view-today');$('#open-content').textContent=id==='view-notes'?'查看完整事項':'查看完整課表';}
 tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(t.id));t.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;tabs[n].click();tabs[n].focus();});});
 function fullNotes(){const list=el('ol');for(const n of store.getDisplayState().notes){const item=el('li',n.text);item.classList.toggle('done',n.done);item.prepend(document.createTextNode(n.done?'✓ 已完成：':'○ 未完成：'));list.append(item);}if(!list.children.length)list.append(el('li','尚無事項。'));return list;}
 $('#open-content').onclick=()=>{restoreTable();$('#content-body').replaceChildren();$('#content-title').textContent=active==='view-notes'?'完整班級事項':active==='view-week'?'整週固定課表':'今日完整課表';if(active==='view-notes')$('#content-body').append(fullNotes());else{const table=$('#schedule-table');tableNode=table;tableHome=document.createComment('原課表位置');table.before(tableHome);$('#content-body').append(table);}openOverlay(dialog);$('#close-content').focus();};
 $('#close-content').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(!dialog.open)restoreTable();});
 $('#open-picker-records').onclick=()=>{restoreTable();const s=store.getDisplayState(),date=taiwanParts().date;const seat=id=>s.students.find(st=>st.id===id)?.seat;$('#content-title').textContent='抽號紀錄與剩餘座號';$('#content-body').replaceChildren(el('p',`本輪已抽：${s.picker.drawn.map(seat).join('、')||'尚無'}`),el('p',`今日剩餘：${s.students.filter(st=>s.participation[date]?.[st.id]!==false&&!s.picker.drawn.includes(st.id)).map(st=>st.seat).join('、')||'無'}`));openOverlay(dialog);};
 $('#open-system-status').onclick=()=>openOverlay($('#system-status'));$('#close-system-status').onclick=()=>$('#system-status').close();
 let pending=false,lastLayout;
 function checkFit(){pending=false;if(document.body.dataset.focus!=='home'||innerWidth<960||innerHeight<620||document.body.dataset.readableflow==='true')return;
   const overflow=document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1||['#clock','#current-period','#current-course','#school-countdown','#next-course'].some(id=>{const node=$(id),box=node.closest('.clock-card,.course-card').getBoundingClientRect(),r=node.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1;});
   if(overflow){document.body.dataset.readableflow='true';$('#layout-fallback').hidden=false;}
 }
 const scheduleFit=()=>{if(!pending){pending=true;requestAnimationFrame(checkFit);}};
 function retryFit(){delete document.body.dataset.readableflow;$('#layout-fallback').hidden=true;scheduleFit();}
 window.addEventListener('resize',retryFit);
 const observer=new MutationObserver(scheduleFit);for(const id of ['#clock','#current-period','#current-course','#next-course'])observer.observe($(id),{childList:true,characterData:true,subtree:true});
 const update=s=>{const signature=JSON.stringify([s.display,s.appearance,s.school,s.classroom]);if(signature!==lastLayout){lastLayout=signature;retryFit();}
if(dialog.open&&active==='view-notes'&&$('#content-title').textContent==='完整班級事項')$('#content-body').replaceChildren(fullNotes());};store.subscribe(update);update(store.getDisplayState());select('view-today');scheduleFit();
}
