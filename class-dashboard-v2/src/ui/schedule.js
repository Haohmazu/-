import {$,el,button,option,run} from './dom.js?v=2.0-stage4A.0';
import {activeTerm,lessons,courseAt,currentSchoolTime,todaySchedule} from '../school/schedule.js?v=2.0-stage4A.0';
import {taiwanParts,durationText} from '../school/time.js?v=2.0-stage4A.0';
import {WEEKDAYS} from '../io/timetable.js?v=2.0-stage4A.0';
export function mountSchedule(store){
  let mode='today',schoolSignature,viewSignature;
  const fillCourses=()=>{const s=store.getState(),term=activeTerm(s);$('#course-subject').value=term.weekly[$('#course-weekday').value]?.[$('#course-period').value]??'';};
  function periodRow(p){
    const row=el('div');row.className='period-row';row.dataset.id=p.id;
    for(const [key,title,type] of [['name','時段名稱','text'],['start','開始','time'],['end','結束','time']]){
      const label=el('label',title),input=el('input');input.type=type;input.value=p[key];input.required=true;if(key==='name')input.maxLength=30;input.dataset.field=key;input.setAttribute('aria-label',`${p.id} ${title}`);label.append(input);row.append(label);
    }
    const label=el('label','類型'),select=el('select');select.dataset.field='kind';select.setAttribute('aria-label',`${p.id} 類型`);for(const [value,text] of [['LESSON','授課'],['BREAK','下課／午休'],['OTHER','其他']])select.append(option(value,text));select.value=p.kind;label.append(select);row.append(label,button('移除',()=>row.remove()));return row;
  }
  function renderSettings(s){
    const next=JSON.stringify(s.school);if(schoolSignature===next)return;schoolSignature=next;viewSignature=null;
    const term=activeTerm(s);$('#term-select').replaceChildren(...s.school.terms.map(t=>option(t.id,`${t.year} 學年度 第 ${t.semester} 學期`)));$('#term-select').value=term.id;$('#term-year').value=term.year;$('#term-semester').value=String(term.semester);
    $('#term-class-summary').textContent=`目前：${term.year} 學年度 第 ${term.semester} 學期`;
    $('#period-editor').replaceChildren(...s.school.periods.map(periodRow));
    for(const selector of ['#course-period','#override-period']){
      const previous=$(selector).value;$(selector).replaceChildren(...lessons(s).map(p=>option(p.id,p.name)));if(lessons(s).some(p=>p.id===previous))$(selector).value=previous;
    }
    fillCourses();$('#override-list').replaceChildren();
    for(const date of Object.keys(term.overrides).sort())for(const [id,name] of Object.entries(term.overrides[date])){
      const row=el('p',`${date} · ${s.school.periods.find(p=>p.id===id).name} → ${name}`);row.append(button('取消單日調課',()=>{if(confirm(`取消 ${date} 的這節臨時調課？`))run(store,{type:'DELETE_OVERRIDE',date,periodId:id});}));$('#override-list').append(row);
    }
    if(!$('#override-list').childElementCount)$('#override-list').append(el('p','尚無單日調課。'));
  }
  function tick(at=Date.now()){
    const s=store.getDisplayState(),term=activeTerm(s),now=currentSchoolTime(s,at),parts=taiwanParts(at);
    $('#term-label').textContent=`${term.year} 學年度 第 ${term.semester} 學期`;
    $('#current-period').textContent=now.period?`${now.period.name} · ${now.period.start}–${now.period.end}`:now.status;
    $('#current-course').textContent=now.current?`${now.current.subject}${now.current.temporary?'（臨時調課）':''}`:now.status;
    $('#school-countdown').textContent=now.period?`${now.current?'距離下課':'本時段剩餘'} ${durationText(now.remainingMs)}`:'依學校作息自動顯示';
    $('#next-course').textContent=now.next?`下一節 ${now.next.start} · ${now.next.subject}${now.next.temporary?'（臨時調課）':''}`:(parts.weekday===0||parts.weekday===6?'週末不套用平日課表':'今日沒有下一節課');
    const scheduleNext=$('#schedule-next-course');if(scheduleNext)scheduleNext.textContent=$('#next-course').textContent;
    const sig=JSON.stringify([s.school,parts.date,now.period?.id,mode]);if(viewSignature===sig)return;viewSignature=sig;
    $('#schedule-table').classList.toggle('week',mode==='week');$('#schedule-table').replaceChildren();
    if(mode==='today'&&!todaySchedule(s,at).length){$('#schedule-table').append(el('p','今天是週末，沒有平日課表。'));return;}
    const table=el('table'),head=el('thead'),tr=el('tr');for(const title of mode==='today'?['節次／時間','科目']:['節次／時間',...WEEKDAYS])tr.append(el('th',title));head.append(tr);table.append(head);const body=el('tbody');table.append(body);
    for(const p of lessons(s)){
      const row=el('tr');if(now.period?.id===p.id)row.className='current-row';const name=el('td',p.name);name.append(el('small',`${p.start}–${p.end}`));row.append(name);
      if(mode==='today'){
        const course=courseAt(s,parts.date,p.id),td=el('td',course.subject);if(course.temporary){const tag=el('span',' · 臨時');tag.className='temporary';td.append(tag);}row.append(td);
      }else for(let day=1;day<=5;day++){const td=el('td',term.weekly[day]?.[p.id]||'未設定');if(day===parts.weekday&&now.period?.id===p.id)td.setAttribute('aria-current','true');row.append(td);}
      body.append(row);
    }
    $('#schedule-table').append(table);if(mode==='week')$('#schedule-table').append(el('p','整週顯示固定課表；單日臨時調課請看今日課表。'));
  }
  $('#view-today').onclick=()=>{mode='today';$('#view-today').setAttribute('aria-pressed','true');$('#view-week').setAttribute('aria-pressed','false');tick();};
  $('#view-week').onclick=()=>{mode='week';$('#view-today').setAttribute('aria-pressed','false');$('#view-week').setAttribute('aria-pressed','true');tick();};
  $('#period-form').onsubmit=e=>{e.preventDefault();const periods=[...$('#period-editor').children].map(row=>({id:row.dataset.id,...Object.fromEntries([...row.querySelectorAll('[data-field]')].map(i=>[i.dataset.field,i.value.trim()]))}));run(store,{type:'SAVE_PERIODS',periods});};
  $('#add-period').onclick=()=>$('#period-editor').append(periodRow({id:crypto.randomUUID(),name:'新時段',start:'16:00',end:'16:30',kind:'OTHER'}));
  $('#term-select').onchange=()=>run(store,{type:'SELECT_TERM',id:$('#term-select').value});
  $('#term-form').onsubmit=e=>{e.preventDefault();if(confirm('建立新學期？舊學期與學生資料都會保留。'))run(store,{type:'CREATE_TERM',year:Number($('#term-year').value),semester:Number($('#term-semester').value),copyCurrent:$('#copy-term').checked});};
  $('#course-weekday').onchange=fillCourses;$('#course-period').onchange=fillCourses;
  $('#course-form').onsubmit=e=>{e.preventDefault();run(store,{type:'SET_COURSE',weekday:Number($('#course-weekday').value),periodId:$('#course-period').value,subject:$('#course-subject').value});};
  $('#override-date').value=taiwanParts().date;$('#override-form').onsubmit=e=>{e.preventDefault();run(store,{type:'SET_OVERRIDE',date:$('#override-date').value,periodId:$('#override-period').value,subject:$('#override-subject').value});};
  store.subscribe(s=>{renderSettings(s);tick();});renderSettings(store.getState());tick();return tick;
}
