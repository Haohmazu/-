import {$,el,button,download,notify} from './dom.js?v=2.0-three-columns.0';
import {parseCSV,csvText} from '../io/roster.js?v=2.0-three-columns.0';
import {readXlsx,writeXlsx} from '../io/xlsx.js?v=2.0-three-columns.0';
import {rowsToTimetable,timetableTemplate,WEEKDAYS} from '../io/timetable.js?v=2.0-three-columns.0';
export function mountTimetableImport(store){
  const host=$('#timetable-import');host.append(el('h3','課表匯入與範本'),el('p','標準三欄：星期、節次、科目。只更新預覽列出的課程，其他課程保留；科目時間一律引用作息。'));
  const buttons=el('div');buttons.className='import-buttons';
  const template=(xlsx)=>{try{const rows=timetableTemplate(store.getState());download(xlsx?writeXlsx(rows,'每週課表'):csvText(rows),`課表範本.${xlsx?'xlsx':'csv'}`,xlsx?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv;charset=utf-8');}catch(e){notify(e.message,true);}};
  buttons.append(button('下載 CSV 課表範本',()=>template(false)),button('下載 XLSX 課表範本',()=>template(true)));host.append(buttons);
  const label=el('label','選取 CSV / XLSX 課表（上限 2 MB）'),file=el('input');file.id='timetable-file';file.type='file';file.accept='.csv,.xlsx';label.append(file);const message=el('p');message.id='timetable-message';message.setAttribute('role','status');const preview=el('div');preview.id='timetable-preview';host.append(label,message,preview);let token=0;
  file.onchange=async()=>{
    const mine=++token,selected=file.files[0];preview.replaceChildren();message.textContent='';if(!selected)return;
    try{
      if(selected.size>2*1024*1024)throw Error('檔案不可超過 2 MB。');
      const state=store.getState(),buffer=await selected.arrayBuffer();
      const rows=/\.xlsx$/i.test(selected.name)?await readXlsx(buffer,{maxColumns:3,maxRows:201}):/\.csv$/i.test(selected.name)?parseCSV(new TextDecoder('utf-8',{fatal:true}).decode(buffer)):(()=>{throw Error('請選擇 CSV 或 XLSX。');})();
      const records=rowsToTimetable(rows,state);if(mine!==token)return;
      const term=state.school.terms.find(t=>t.id===state.school.activeTermId);message.textContent=`預覽 ${term.year} 學年度 第 ${term.semester} 學期，共 ${records.length} 筆，尚未匯入。`;
      const table=el('table');for(const r of records){const row=el('tr');for(const value of [WEEKDAYS[r.weekday-1],state.school.periods.find(p=>p.id===r.periodId).name,r.subject])row.append(el('td',value));table.append(row);}preview.append(table);
      const consent=el('label'),check=el('input');consent.className='checkbox-label';check.type='checkbox';consent.append(check,document.createTextNode('確認更新這些固定課程，其他課程保留。'));const commit=button('確認匯入課表',async()=>{
        commit.disabled=true;try{if(!check.checked)throw Error('請先確認預覽。');await store.dispatch({type:'IMPORT_TIMETABLE',records,termId:term.id,expectedRevision:state.revision});message.textContent='課表匯入成功，資料已儲存。';preview.replaceChildren();notify('課表已匯入。');}catch(e){message.textContent=`匯入失敗：${e.message} 原資料未被覆蓋。`;commit.disabled=!check.checked;}
      });commit.disabled=true;check.onchange=()=>commit.disabled=!check.checked;preview.append(consent,commit);
    }catch(e){if(mine===token)message.textContent=`匯入失敗：${e.message} 原資料未變更。`;}
  };
}
