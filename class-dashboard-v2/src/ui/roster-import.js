import {TEMPLATE_ROWS,parseCSV,rowsToRoster,planRoster,csvText} from '../io/roster.js?v=2.0-home-layout.0';
import {readXlsx,writeXlsx} from '../io/xlsx.js?v=2.0-home-layout.0';
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function mountRosterImport(store){
 const host=document.querySelector('#roster-import');
 host.innerHTML='<h3>學生名單匯入</h3><p>所有檔案都在本機處理。只接受第一張工作表的「座號、姓名」兩欄，保留未列入的學生與歷史。</p><div class="import-buttons"><button type="button" id="csv-template">下載 CSV 範本</button><button type="button" id="xlsx-template">下載 XLSX 範本</button></div><label>選取 CSV / XLSX 名單（上限 2 MB）<input id="roster-file" type="file" accept=".csv,.xlsx"></label><p id="import-message" role="status"></p><div id="import-preview"></div>';
 const $=s=>host.querySelector(s),message=text=>{$('#import-message').textContent=text;};let selection=0;
 $('#csv-template').onclick=()=>download(csvText(TEMPLATE_ROWS),'學生名單範本.csv','text/csv;charset=utf-8');
 $('#xlsx-template').onclick=()=>download(writeXlsx(TEMPLATE_ROWS),'學生名單範本.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 $('#roster-file').onchange=async event=>{
  const token=++selection,file=event.target.files[0];$('#import-preview').replaceChildren();message('');if(!file)return;
  try{
   if(file.size>2*1024*1024)throw Error('檔案不可超過 2 MB。');
   let rows;if(/\.xlsx$/i.test(file.name))rows=await readXlsx(await file.arrayBuffer());else if(/\.csv$/i.test(file.name))rows=parseCSV(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));else throw Error('請選擇 UTF-8 CSV 或 XLSX。');
   const records=rowsToRoster(rows);if(token!==selection)return;
   const state=store.getState(),choices=records.map(row=>({...row,studentId:state.students.some(s=>s.seat===row.seat)?undefined:null}));
   const table=document.createElement('table'),thead=document.createElement('thead');
   thead.innerHTML='<tr><th>座號</th><th>姓名</th><th>學生身分對應（必須確認）</th></tr>';table.append(thead);const tbody=document.createElement('tbody');table.append(tbody);
   for(const row of choices){
    const tr=document.createElement('tr');for(const value of [row.seat,row.name]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
    const td=document.createElement('td'),select=document.createElement('select');select.setAttribute('aria-label',`座號 ${row.seat} 身分對應`);
    for(const [value,label] of [['','請確認對應'],['NEW','新增學生'],...state.students.map(s=>[s.id,`既有 ${s.seat} 號 · ${s.name||'未填姓名'}`])]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
    select.value=row.studentId===null?'NEW':'';select.onchange=()=>{row.studentId=select.value==='NEW'?null:select.value||undefined;showPlan();};td.append(select);tr.append(td);tbody.append(tr);
   }
   const summary=document.createElement('p'),confirm=document.createElement('button');confirm.type='button';confirm.textContent='確認身分對應並正式匯入';confirm.disabled=true;
   const acknowledgement=document.createElement('label'),check=document.createElement('input');check.type='checkbox';acknowledgement.className='participation';acknowledgement.append(check,document.createTextNode('我已確認每列學生身分；更新會保留既有 ID，未列入者不刪除。'));
   const showPlan=()=>{try{const plan=planRoster(state,choices);summary.textContent=`預覽：新增 ${plan.added} 位、更新 ${plan.updated} 位；合計 ${plan.students.length} 位。`;confirm.disabled=!check.checked;}catch(e){summary.textContent=e.message;confirm.disabled=true;}};
   check.onchange=showPlan;
   confirm.onclick=async()=>{confirm.disabled=true;try{if(!check.checked)throw Error('請先確認學生身分。');await store.dispatch({type:'IMPORT_STUDENTS',rows:structuredClone(choices),expectedRevision:state.revision});message('名單匯入成功，既有學生 ID 與任務歷史已保留。');$('#import-preview').replaceChildren();}catch(e){message(e.message);showPlan();}};
   $('#import-preview').append(table,summary,acknowledgement,confirm);showPlan();message('已讀取檔案，尚未匯入。');
  }catch(e){if(token===selection)message(`匯入失敗：${e.message} 現有資料未變更。`);}
 };
}
