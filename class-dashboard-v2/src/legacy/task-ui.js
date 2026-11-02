import {activeRound,taiwanDay} from './task-commands.js?v=2.0-stage3.0';
import {roundStatistics,taskStatistics} from './task-statistics.js?v=2.0-stage3.0';
export function mountTasks(store) {
 const panel=document.querySelector('#task-panel'),teacher=document.querySelector('#task-settings'),statsPanel=document.querySelector('#task-stats');
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 const notify=text=>{document.querySelector('#notice').textContent=text;document.querySelector('#task-error').textContent=text;};
 const run=async c=>{try{await store.dispatch(c);notify('操作已儲存。');}catch(e){notify(e.message);}};
 const button=(text,action)=>{const b=el('button',text);b.type='button';b.onclick=action;return b;};
 const input=(label,value,type='text')=>{const field=el('input');field.type=type;field.setAttribute('aria-label',label);field.value=value;return field;};
 let renderedDay;
 function render(s){
  const sorted=[...s.students].sort((a,b)=>a.seat-b.seat),seat=id=>s.students.find(st=>st.id===id)?.seat??'未知';
  panel.replaceChildren(el('h2','班級共同任務'));teacher.replaceChildren(el('h3','今日參與及任務管理'));
  const day=taiwanDay(new Date().toISOString());renderedDay=day;
  teacher.append(el('p',`今日：${day}。參與設定只影響新任務，不修改進行中的名單。`));
  for(const student of sorted){const label=el('label');label.className='participation';const field=input(`${student.seat} 號今日參與`,'','checkbox');field.checked=s.participation[day]?.[student.id]!==false;field.onchange=()=>run({type:'SET_PARTICIPATION',studentId:student.id,participating:field.checked});label.append(field,document.createTextNode(`${student.seat} 號參與`));teacher.append(label);}
  const form=el('form'),name=input('新增任務範本名稱','');name.required=true;name.maxLength=60;name.placeholder='新增任務範本';form.append(name,el('button','新增範本'));form.onsubmit=e=>{e.preventDefault();run({type:'SAVE_TEMPLATE',name:name.value});};teacher.append(form);
  const select=el('select');select.setAttribute('aria-label','選擇任務範本');
  for(const t of s.templates){const option=el('option',t.name);option.value=t.id;select.append(option);const row=el('div');row.className='student-row';const field=input(`範本 ${t.name}`,t.name);field.maxLength=60;row.append(field,button('修改範本',()=>run({type:'SAVE_TEMPLATE',id:t.id,name:field.value})),button('刪除範本',()=>{if(confirm('刪除此範本？歷史輪次會保留。'))run({type:'DELETE_TEMPLATE',id:t.id});}));teacher.append(row);}
  const start=el('form'),threshold=input('本輪進化門檻','','number');threshold.min=1;threshold.max=50;threshold.placeholder='留空＝參與人數';const startButton=el('button','開始任務');startButton.disabled=!!activeRound(s)||!s.templates.length;start.append(select,threshold,startButton);start.onsubmit=e=>{e.preventDefault();run({type:'START_TASK',templateId:select.value,threshold:threshold.value===''?undefined:Number(threshold.value)});};teacher.append(start);
  const r=activeRound(s);
  if(!r)panel.append(el('p','尚無進行中的任務，請在教師設定開始任務。'));
  else {
   const summary=roundStatistics(r),command=c=>run({...c,roundId:r.id});
   panel.append(el('h3',r.name),el('p',`${summary.completed} / ${summary.total} 人完成（${Math.round(summary.rate*100)}%） · 未完成 ${summary.incomplete} 人 · 門檻 ${r.threshold}`),el('p',`開始時間：${new Date(r.startedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}。未完成任務跨日保留，可直接繼續打卡。`));
   if(r.checkins.length>=r.threshold)panel.append(el('p','已達設定門檻；尚未結算或發放魚種，第四階段才開放進化。'));
   const grid=el('div');grid.className='seats';
   for(const id of r.participants){const done=r.checkins.some(x=>x.studentId===id),b=button(`${String(seat(id)).padStart(2,'0')}${done?' ✓':''}`,()=>command({type:'CHECK_IN',studentId:id,source:'STUDENT'}));b.setAttribute('aria-label',`${seat(id)} 號${done?'已打卡':'打卡'}`);b.classList.toggle('checked',done);grid.append(b);const row=el('div');row.className='student-row';row.append(el('span',`${seat(id)} 號`),button(done?'取消打卡':'教師補登',()=>command({type:done?'UNCHECK':'CHECK_IN',studentId:id,source:'TEACHER'})));teacher.append(row);}
   panel.append(grid);teacher.append(button('復原最近打卡操作',()=>command({type:'UNDO_CHECK'})),button('取消進行中任務',()=>{if(confirm('取消本輪？紀錄會保留，但本輪不能再繼續，且不計入有效累計。'))command({type:'CANCEL_TASK'});}));
   const revision=el('details');revision.append(el('summary','修訂本輪參與名單與門檻'));
   revision.append(el('p','不會變更學生 ID。移除已打卡學生會取消其本輪有效打卡，並保留修正紀錄；需要再次確認。'));
   const checks=[];
   for(const student of sorted){const label=el('label');label.className='participation';const field=input(`本輪 ${student.seat} 號參與`,'','checkbox');field.checked=r.participants.includes(student.id);checks.push([student.id,field]);label.append(field,document.createTextNode(`${student.seat} 號${r.checkins.some(x=>x.studentId===student.id)?'（已打卡）':''}`));revision.append(label);}
   const target=input('修訂後門檻',r.threshold,'number');target.min=1;target.max=50;const label=el('label','修訂後門檻');label.append(target);revision.append(label,button('確認修訂本輪名單',()=>{
    const participants=checks.filter(([,field])=>field.checked).map(([id])=>id),removed=r.checkins.filter(c=>!participants.includes(c.studentId));
    if(!confirm(`本輪參與 ${r.participants.length} → ${participants.length} 人，門檻 ${r.threshold} → ${target.value}。${removed.length?`將取消 ${removed.length} 筆已打卡紀錄。`:''}確定修訂？`))return;
    command({type:'REVISE_PARTICIPANTS',participants,threshold:Number(target.value),confirmRemoveChecked:removed.length>0,expectedRevision:s.revision});
   }));teacher.append(revision);
  }
  const total=taskStatistics(s);statsPanel.replaceChildren(el('h3','任務統計與歷史'),el('p',`歷史 ${total.rounds} 輪 · 取消 ${total.cancelled} 輪 · 已結算 ${total.settled} 輪。累計只計未取消輪次的現存有效打卡；取消、復原與名單修訂後即時重算。`));
  for(const student of sorted)statsPanel.append(el('p',`${student.seat} 號累計有效完成 ${total.perStudent[student.id]} 次`));
  for(const round of [...s.rounds].reverse()){
   const history=el('details'),summary=roundStatistics(round),status={ACTIVE:'進行中',CANCELLED:'已取消',COMPLETED:'已結算'}[round.status];history.append(el('summary',`${round.name} · ${status} · ${summary.completed}/${summary.total}（${Math.round(summary.rate*100)}%）`));
   history.append(el('p',`輪次 ${round.id} · 開始 ${round.startedAt} · 結束 ${round.endedAt??'尚未結束'} · 未完成 ${summary.incomplete} 人`));
   for(const check of round.checkins)history.append(el('p',`${seat(check.studentId)} 號 · ${check.source==='TEACHER'?'教師補登':'學生打卡'} · ${check.at}`));
   for(const a of round.audit){const type={CHECK_IN:'打卡',UNCHECK:'取消打卡',UNDO_CHECK:'復原',CANCEL_TASK:'取消任務',REVISE_PARTICIPANTS:'修訂名單'}[a.type];history.append(el('p',`${a.at} · ${type}${a.studentId?` · ${seat(a.studentId)} 號`:''}${a.source==='TEACHER'?' · 教師操作':a.source==='STUDENT'?' · 學生操作':''}${a.type==='REVISE_PARTICIPANTS'?` · 座號 [${a.before.participants.map(seat).join(', ')}] → [${a.after.participants.map(seat).join(', ')}] · 門檻 ${a.before.threshold} → ${a.after.threshold}`:''}`));}
   statsPanel.append(history);
  }
 }
 store.subscribe(render);render(store.getState());
 const syncDay=()=>{if(renderedDay!==taiwanDay(new Date().toISOString()))render(store.getState());};setInterval(syncDay,30000);document.addEventListener('visibilitychange',syncDay);
}
