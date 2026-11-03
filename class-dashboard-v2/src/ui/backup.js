import {STYLES} from '../display/appearance.js?v=2.0-home-layout.0';
import {taiwanParts} from '../school/time.js?v=2.0-home-layout.0';
import {$,el,button,download,notify} from './dom.js?v=2.0-home-layout.0';
import {makeBackup,parseBackup} from '../io/backup.js?v=2.0-home-layout.0';
export function mountBackup(store){
  let token=0;
  const render=s=>{
    $('#data-summary').textContent=`網站版本：2.0-home-layout.0\n資料版本：${s.schemaVersion}\n學生：${s.students.length} 位 · 學期：${s.school.terms.length} 份\n最近儲存：${s.savedAt?new Date(s.savedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚無'}\n儲存狀態：${store.loadError?'原資料異常，寫入已鎖定':'可用（實際寫入仍需成功才算保存）'}`;
    $('#export-json').disabled=!!store.loadError;$('#export-recovery').hidden=!store.loadError||typeof store.getRecoveryText()!=='string';
  };
  $('#export-json').onclick=()=>{if(store.loadError)return;download(makeBackup(store.getState()),`班級儀表板備份_${taiwanParts().date}_${String(Math.floor(taiwanParts().milliseconds/1000)).padStart(5,'0')}.json`,'application/json');$('#backup-message').textContent='已交由瀏覽器下載，請確認檔案已保存；這不是遠端同步。';};
  $('#export-recovery').onclick=()=>download(store.getRecoveryText(),'班級原始資料_未驗證.txt','text/plain;charset=utf-8');
  $('#restore-file').onchange=async event=>{
    const mine=++token,file=event.target.files[0];$('#restore-preview').replaceChildren();$('#backup-message').textContent='';$('#backup-message').classList.remove('error');if(!file)return;
    try{
      if(file.size>8*1024*1024)throw Error('備份上限 8 MB。');const text=await file.text(),parsed=parseBackup(text);if(mine!==token)return;
      const current=store.getState(),data=parsed.state,preview=$('#restore-preview');
      preview.append(el('p',`備份時間（臺灣）：${new Date(parsed.exportedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false})}；班級：${data.classroom.name}；學生 ${data.students.length} 位、學期 ${data.school.terms.length} 份、保留歷史輪次 ${data.rounds.length} 份、已儲存影音 ${data.mediaLibrary.items.length} 筆、分類 ${data.mediaLibrary.categories.length} 份（含最愛、順序、播放偏好與計時連動）。驗證後資料版本 ${data.schemaVersion}；外觀：${STYLES.find(s=>s.id===data.appearance.style)?.name??'原有外觀'}。`));
      preview.append(el('p','確認後將以備份取代目前全部資料。請先下載目前備份（原資料損壞時下載原始副本）。'));
      const label=el('label'),check=el('input');label.className='checkbox-label';check.type='checkbox';label.append(check,document.createTextNode('我已檢查備份內容，確認覆蓋目前資料。'));const commit=button('確認還原完整備份',async()=>{
        if(!check.checked)return;commit.disabled=true;
        try{await store.dispatch({type:'RESTORE_BACKUP',text,expectedRevision:current.revision,confirmed:true});preview.replaceChildren();$('#backup-message').textContent='還原完成，資料已儲存。';notify('完整備份已還原。');}catch(e){$('#backup-message').textContent=`還原失敗：${e.message} 原資料未變更。`;$('#backup-message').classList.add('error');commit.disabled=!check.checked;}
      });commit.disabled=true;check.onchange=()=>commit.disabled=!check.checked;preview.append(label,commit);$('#backup-message').textContent='備份格式驗證成功，尚未還原。';
    }catch(e){if(mine===token){$('#backup-message').textContent=`還原失敗：${e.message} 原資料未變更。`;$('#backup-message').classList.add('error');}}
  };
  store.subscribe(render);render(store.getState());
}
