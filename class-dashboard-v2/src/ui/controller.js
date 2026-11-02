export function mountUI(store) {
  const $ = selector => document.querySelector(selector);
  let editId = null;
  function message(text, error = false) {$('#notice').textContent = text; $('#notice').classList.toggle('error', error); $('#form-error').textContent = error ? text : '';}
  function resetForm() {editId = null; $('#student-form').reset(); $('#student-title').textContent = '新增學生'; $('#save-student').textContent = '新增學生'; $('#cancel-edit').hidden = true;}
  function render(state) {
    $('#class-name').textContent = state.classroom.name;
    $('#class-input').value = state.classroom.name;
    $('#student-count').textContent = `${state.students.length} / 50`;
    $('#empty').hidden = state.students.length > 0;
    $('#seats').replaceChildren(); $('#student-list').replaceChildren();
    for (const student of [...state.students].sort((a,b) => a.seat-b.seat)) {
      const seat = document.createElement('span'); seat.className = 'seat'; seat.textContent = String(student.seat).padStart(2,'0'); $('#seats').append(seat);
      const row = document.createElement('div'); row.className = 'student-row';
      const label = document.createElement('span'); label.textContent = `${student.seat} 號 · ${student.name || '未填姓名'}`;
      const edit = document.createElement('button'); edit.textContent = '編輯'; edit.setAttribute('aria-label',`編輯 ${student.seat} 號`);
      edit.onclick = () => {editId = student.id; $('#seat-input').value = student.seat; $('#name-input').value = student.name; $('#student-title').textContent = `編輯 ${student.seat} 號`; $('#save-student').textContent = '儲存學生'; $('#cancel-edit').hidden = false; $('#seat-input').focus();};
      row.append(label,edit); $('#student-list').append(row);
    }
    $('#storage-state').textContent = state.savedAt ? `已儲存 · ${new Date(state.savedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false})}` : '尚無儲存資料 · 請先設定班級';
  }
  async function run(command, success) {try {await store.dispatch(command); message(success); return true;} catch(error) {message(error.message,true); return false;}}
  $('#open-settings').onclick = () => {$('#form-error').textContent=''; $('#settings').showModal();};
  $('#close-settings').onclick = () => {$('#settings').close(); resetForm();};
  $('#cancel-edit').onclick = resetForm;
  $('#class-form').onsubmit = async event => {event.preventDefault(); run({type:'SET_CLASS_NAME',name:$('#class-input').value},'班級設定已儲存。');};
  $('#student-form').onsubmit = async event => {event.preventDefault(); if(await run({type:editId ? 'UPDATE_STUDENT':'ADD_STUDENT',id:editId,seat:Number($('#seat-input').value),name:$('#name-input').value},'學生資料已儲存。')) resetForm();};
  store.subscribe(render); render(store.getState());
  if (store.loadError) {message(`讀取失敗：${store.loadError.message} 原資料未變更，已停用設定寫入。`,true); $('#storage-state').textContent = '資料異常 · 寫入已鎖定'; $('#settings').querySelectorAll('input,form button').forEach(el => el.disabled = true);}
  window.addEventListener('storage', event => {if(event.key === 'class-dashboard-v2') message('其他分頁的資料已變更，請重新整理後再操作。',true);});
}
