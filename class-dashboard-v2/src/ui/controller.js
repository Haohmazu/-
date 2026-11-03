import {$,el,button,notify,run,openSettings} from './dom.js?v=2.0-IC.0';
export function mountUI(store){
  let editId=null,signature;
  function resetForm(){editId=null;$('#student-form').reset();$('#student-title').textContent='新增學生';$('#save-student').textContent='新增學生';$('#cancel-edit').hidden=true;}
  function render(s){
    $('#storage-state').textContent=s.savedAt?`已儲存 · ${new Date(s.savedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false})}`:'尚無儲存資料 · 請先設定班級';
    const next=JSON.stringify([s.classroom,s.students]);if(next===signature)return;signature=next;
    $('#class-name').textContent=s.classroom.name;$('#class-input').value=s.classroom.name;$('#student-count').textContent=`${s.students.length} / 50`;$('#empty').hidden=s.students.length>0;
    $('#seats').replaceChildren();$('#student-list').replaceChildren();
    for(const student of [...s.students].sort((a,b)=>a.seat-b.seat)){
      const seat=el('span',String(student.seat).padStart(2,'0'));seat.className='seat';$('#seats').append(seat);
      const row=el('div');row.className='student-row';const edit=button('編輯',()=>{editId=student.id;$('#seat-input').value=student.seat;$('#name-input').value=student.name;$('#student-title').textContent=`編輯 ${student.seat} 號`;$('#save-student').textContent='儲存學生';$('#cancel-edit').hidden=false;$('#seat-input').focus();});edit.setAttribute('aria-label',`編輯 ${student.seat} 號`);
      row.append(el('span',`${student.seat} 號 · ${student.name||'未填姓名'}`),edit);$('#student-list').append(row);
    }
  }
  $('#open-settings').onclick=()=>openSettings();$('#open-roster').onclick=()=>openSettings();
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>openSettings(b.dataset.panel));
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openSettings(b.dataset.open));
  document.querySelectorAll('[data-panel]').forEach((b,index)=>b.onkeydown=event=>{const tabs=[...document.querySelectorAll('[data-panel]')];let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();openSettings(tabs[next].dataset.panel);tabs[next].focus();}});
  $('#settings').addEventListener('close',resetForm);
  $('#close-settings').onclick=()=>{$('#settings').close();resetForm();};$('#cancel-edit').onclick=resetForm;
  $('#class-form').onsubmit=event=>{event.preventDefault();run(store,{type:'SET_CLASS_NAME',name:$('#class-input').value},'班級設定已儲存。');};
  $('#student-form').onsubmit=async event=>{event.preventDefault();if(await run(store,{type:editId?'UPDATE_STUDENT':'ADD_STUDENT',id:editId,seat:Number($('#seat-input').value),name:$('#name-input').value},'學生資料已儲存。'))resetForm();};
  store.subscribe(render);render(store.getState());
  if(store.loadError)notify(`本機資料讀取失敗：${store.loadError.message}。原資料未變更，可在資料管理下載原始副本或還原已驗證備份。`,true);
  window.addEventListener('storage',event=>{if(event.key==='class-dashboard-v2')notify('其他分頁已變更資料，請重新整理後再操作。',true);});
}
