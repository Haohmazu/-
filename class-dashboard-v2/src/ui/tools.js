import {$,el,button,run,notify} from './dom.js?v=2.0-integration-IB.0';
import {remainingTime} from '../school/timer.js?v=2.0-integration-IB.0';
import {taiwanParts,durationText} from '../school/time.js?v=2.0-integration-IB.0';
import {createTimerSound} from './sound.js?v=2.0-integration-IB.0';
export function mountTools(store){
  const sound=createTimerSound();let finishing=false,finishAttempt,noteSignature,participationSignature,timerSignature,preferenceSignature;
  const timer=type=>run(store,{type});
  $('#timer-start').onclick=()=>timer('TIMER_START');$('#timer-pause').onclick=()=>timer('TIMER_PAUSE');$('#timer-reset').onclick=()=>timer('TIMER_RESET');
  $('#timer-plus').onclick=()=>run(store,{type:'TIMER_ADJUST',milliseconds:60000});$('#timer-minus').onclick=()=>run(store,{type:'TIMER_ADJUST',milliseconds:-60000});
  document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>run(store,{type:'TIMER_SET',milliseconds:Number(b.dataset.preset)*1000}));
  $('#timer-form').onsubmit=e=>{e.preventDefault();run(store,{type:'TIMER_SET',milliseconds:(Number($('#timer-minutes').value)*60+Number($('#timer-seconds').value))*1000});};
  $('#sound-form').onsubmit=e=>{e.preventDefault();run(store,{type:'SET_SOUND',enabled:$('#sound-enabled').checked,volume:Number($('#sound-volume').value)});};
  $('#note-form').onsubmit=async e=>{e.preventDefault();if(await run(store,{type:'ADD_NOTE',text:$('#note-text').value.trim()}))$('#note-text').value='';};
  $('#clear-done-notes').onclick=()=>{if(confirm('清除所有已完成聯絡事項？未完成事項會保留。'))run(store,{type:'CLEAR_DONE_NOTES',confirmed:true});};
  $('#draw-student').onclick=()=>run(store,{type:'DRAW_STUDENT'},'抽號已儲存。');$('#reset-picker').onclick=()=>{if(confirm('重新開始抽號？本輪已抽清單將清空。'))run(store,{type:'RESET_PICKER',confirmed:true});};
  function render(s){
    paintTimer(s);
    const notes=JSON.stringify(s.notes);if(notes!==noteSignature){noteSignature=notes;$('#notes-display').replaceChildren();$('#note-editor').replaceChildren();
      if(!s.notes.length)$('#notes-display').append(el('li','尚無聯絡事項。'));
      $('#notes-summary').textContent=`共 ${s.notes.length} 項 · 未完成 ${s.notes.filter(n=>!n.done).length} 項。此處顯示摘要，完整內容請按下方按鈕。`;
      for(const [index,n] of s.notes.entries()){
        if(index<2){const item=el('li',n.text.length>60?n.text.slice(0,60)+'…（查看完整內容）':n.text);item.classList.toggle('done',n.done);$('#notes-display').append(item);}
        const row=el('div');row.className='note-row';const check=el('input');check.type='checkbox';check.checked=n.done;check.setAttribute('aria-label',`完成事項 ${index+1}`);check.onchange=()=>run(store,{type:'TOGGLE_NOTE',id:n.id,done:check.checked});
        const field=el('input');field.type='text';field.value=n.text;field.maxLength=300;field.setAttribute('aria-label',`聯絡事項 ${index+1}`);
        const up=button('上移',()=>run(store,{type:'MOVE_NOTE',id:n.id,direction:-1})),down=button('下移',()=>run(store,{type:'MOVE_NOTE',id:n.id,direction:1}));up.disabled=index===0;down.disabled=index===s.notes.length-1;
        row.append(check,field,button('儲存事項',()=>run(store,{type:'EDIT_NOTE',id:n.id,text:field.value.trim()})),up,down,button('刪除事項',()=>{if(confirm('刪除這一項聯絡事項？'))run(store,{type:'DELETE_NOTE',id:n.id});}));$('#note-editor').append(row);
      }
    }
    if(timerSignature!==s.timer.durationMs){timerSignature=s.timer.durationMs;$('#timer-minutes').value=Math.floor(s.timer.durationMs/60000);$('#timer-seconds').value=s.timer.durationMs/1000%60;}
    const pref=JSON.stringify(s.preferences);if(pref!==preferenceSignature){preferenceSignature=pref;$('#sound-enabled').checked=s.preferences.timerSound;$('#sound-volume').value=s.preferences.volume;}
    const date=taiwanParts().date,signature=JSON.stringify([s.students,s.participation[date],date]);if(signature!==participationSignature){participationSignature=signature;$('#participation-date').textContent=`今日 ${date}：取消勾選代表不參與抽號。`;$('#participation-editor').replaceChildren();for(const student of [...s.students].sort((a,b)=>a.seat-b.seat)){const label=el('label');label.className='checkbox-label';const check=el('input');check.type='checkbox';check.checked=s.participation[date]?.[student.id]!==false;check.setAttribute('aria-label',`${student.seat} 號今日參與`);check.onchange=()=>run(store,{type:'SET_PARTICIPATION',studentId:student.id,participating:check.checked});label.append(check,document.createTextNode(`${student.seat} 號`));$('#participation-editor').append(label);}}
    const eligible=s.students.filter(st=>s.participation[date]?.[st.id]!==false&&!s.picker.drawn.includes(st.id));
    const seat=id=>s.students.find(st=>st.id===id)?.seat;$('#draw-result').textContent=s.picker.lastId?String(seat(s.picker.lastId)).padStart(2,'0'):'—';$('#picker-remaining').textContent=`第 ${s.picker.round} 輪 · 剩餘 ${eligible.length} 人${eligible.length?'':' · 請重新開始或檢查參與設定'}`;$('#picker-drawn').textContent=`已抽：${s.picker.drawn.slice(-6).map(seat).join('、')+(s.picker.drawn.length>6?`（共 ${s.picker.drawn.length} 人，查看全部）`:'')||'尚無'}`;$('#draw-student').disabled=!eligible.length;
  }
  function paintTimer(s,at=Date.now()){const t=s.timer,remaining=remainingTime(t,at);$('#timer-display').textContent=durationText(remaining);const progress=$('#timer-progress');if(progress){progress.max=t.durationMs;progress.value=Math.min(t.durationMs,remaining);progress.setAttribute('aria-valuetext',`剩餘 ${Math.round(Math.min(1,remaining/t.durationMs)*100)}%`);}$('#timer-status').textContent=t.status==='RUNNING'?(remaining?'計時中':'時間到，正在保存結果…'):{IDLE:'準備就緒',PAUSED:'已暫停',FINISHED:'時間到！'}[t.status];$('#timer-status').classList.toggle('finished',t.status==='FINISHED');$('#timer-start').textContent=t.status==='PAUSED'?'繼續':'開始';$('#timer-start').disabled=!['IDLE','PAUSED'].includes(t.status)||!remaining;$('#timer-pause').disabled=t.status!=='RUNNING';
  }
  async function tick(at=Date.now()){
    const s=store.getDisplayState(),t=s.timer,remaining=remainingTime(t,at);
    render(s);
    if(t.status==='RUNNING'&&remaining===0&&finishAttempt===`${t.generation}:${s.revision}`&&!finishing)$('#timer-status').textContent='時間到；儲存尚未成功，請檢查錯誤後重新整理。';
    if(t.status==='RUNNING'&&remaining===0&&!finishing&&finishAttempt!==`${t.generation}:${s.revision}`){finishAttempt=`${t.generation}:${s.revision}`;finishing=true;try{await store.dispatch({type:'TIMER_FINISH',generation:t.generation});notify('時間到！計時結果已儲存。');sound(store.getState().preferences);}catch(e){notify(e.message,true);}finally{finishing=false;}}
  }
  store.subscribe(render);render(store.getState());tick();return tick;
}
