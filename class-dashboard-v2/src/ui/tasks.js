import {activeRound,taiwanDay} from '../features/tasks.js';
export function mountTasks(store) {
 const panel=document.querySelector('#task-panel'), teacher=document.querySelector('#task-settings');
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 const notify=text=>{document.querySelector('#notice').textContent=text;document.querySelector('#task-error').textContent=text;};
 const run=async(c)=>{try{await store.dispatch(c);notify('操作已儲存。');}catch(e){notify(e.message);}};
 const button=(text,action)=>{const b=el('button',text);b.type='button';b.onclick=action;return b;};
 let renderedDay;
 function render(s){
  panel.replaceChildren(el('h2','班級共同任務'));teacher.replaceChildren(el('h3','今日參與及任務管理'));
  const day=taiwanDay(new Date().toISOString());renderedDay=day;
  teacher.append(el('p',`今日：${day}。參與設定只影響新任務，不修改進行中的名單。`));
  for(const student of [...s.students].sort((a,b)=>a.seat-b.seat)){
   const label=el('label');label.className='participation';const input=el('input');input.type='checkbox';input.checked=s.participation[day]?.[student.id]!==false;
   input.onchange=()=>run({type:'SET_PARTICIPATION',studentId:student.id,participating:input.checked});label.append(input,document.createTextNode(`${student.seat} 號參與`));teacher.append(label);
  }
  const form=el('form'),name=el('input');name.required=true;name.maxLength=60;name.placeholder='新增任務範本';name.setAttribute('aria-label','新增任務範本名稱');const save=el('button','新增範本');form.append(name,save);form.onsubmit=e=>{e.preventDefault();run({type:'SAVE_TEMPLATE',name:name.value});};teacher.append(form);
  const select=el('select');select.setAttribute('aria-label','選擇任務範本');
  for(const t of s.templates){const option=el('option',t.name);option.value=t.id;select.append(option);
   const row=el('div');row.className='student-row';const input=el('input');input.value=t.name;input.maxLength=60;input.setAttribute('aria-label',`範本 ${t.name}`);
   row.append(input,button('修改範本',()=>run({type:'SAVE_TEMPLATE',id:t.id,name:input.value})),button('刪除範本',()=>{if(confirm('刪除此範本？歷史輪次會保留。'))run({type:'DELETE_TEMPLATE',id:t.id});}));teacher.append(row);
  }
  const start=el('form'),threshold=el('input');threshold.type='number';threshold.min=1;threshold.max=50;threshold.placeholder='留空＝參與人數';threshold.setAttribute('aria-label','本輪進化門檻');start.append(select,threshold,el('button','開始任務'));start.onsubmit=e=>{e.preventDefault();run({type:'START_TASK',templateId:select.value,threshold:threshold.value===''?undefined:Number(threshold.value)});};teacher.append(start);
  const r=activeRound(s);
  if(!r)panel.append(el('p','尚無進行中的任務，請在教師設定開始任務。'));
  else {
   panel.append(el('h3',r.name),el('p',`${r.checkins.length} / ${r.participants.length} 人完成（${Math.round(r.checkins.length/r.participants.length*100)}%） · 門檻 ${r.threshold}`),el('p',`開始時間：${new Date(r.startedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}。未完成任務跨日保留。`));
   if(r.checkins.length>=r.threshold)panel.append(el('p','已達設定門檻；進化與完成結算將於第四階段開放。'));
   const grid=el('div');grid.className='seats';
   for(const id of r.participants){const st=s.students.find(x=>x.id===id),done=r.checkins.some(x=>x.studentId===id);const b=button(`${String(st.seat).padStart(2,'0')}${done?' ✓':''}`,()=>run({type:'CHECK_IN',studentId:id,source:'STUDENT'}));b.setAttribute('aria-label',`${st.seat} 號${done?'已打卡':'打卡'}`);b.classList.toggle('checked',done);grid.append(b);
    const row=el('div');row.className='student-row';row.append(el('span',`${st.seat} 號`),button(done?'取消打卡':'教師補登',()=>run({type:done?'UNCHECK':'CHECK_IN',studentId:id,source:'TEACHER'})));teacher.append(row);
   }
   panel.append(grid);teacher.append(button('復原最近打卡操作',()=>run({type:'UNDO_CHECK'})),button('取消進行中任務',()=>{if(confirm('取消目前任務？打卡與修正歷史會保留，且無法繼續本輪。'))run({type:'CANCEL_TASK'});}));
   const audit=el('details');audit.append(el('summary','本輪修正紀錄'));for(const a of r.audit) audit.append(el('p',`${a.at} · ${{CHECK_IN:'打卡',UNCHECK:'取消打卡',UNDO_CHECK:'復原'}[a.type]??a.type}`));teacher.append(audit);
  }
  teacher.append(el('p',`任務歷史：${s.rounds.length} 輪；已取消 ${s.rounds.filter(r=>r.status==='CANCELLED').length} 輪。尚未提供完成結算。`));
  for(const r of s.rounds.filter(r=>r.status!=='ACTIVE'))teacher.append(el('p',`${r.name} · 已取消 · ${r.checkins.length}/${r.participants.length}`));
 }
 store.subscribe(render);render(store.getState());
 const syncDay=()=>{if(renderedDay!==taiwanDay(new Date().toISOString()))render(store.getState());};
 setInterval(syncDay,30000);document.addEventListener('visibilitychange',syncDay);
}
