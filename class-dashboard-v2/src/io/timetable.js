import {lessons} from '../school/schedule.js?v=2.0-home-layout.0';
export const WEEKDAYS=['星期一','星期二','星期三','星期四','星期五'];
export function timetableTemplate(state) {
  const periods=lessons(state);if(!periods.length)throw Error('請先建立至少一個授課節次。');
  return [['星期','節次','科目'],['星期一',periods[0].name,'國語'],['星期一',(periods[1]??periods[0]).name,'數學'],['星期二',periods[0].name,'自然']].filter((row,i,rows)=>i===0||!rows.slice(1,i).some(r=>r[0]===row[0]&&r[1]===row[1]));
}
export function rowsToTimetable(rows,state) {
  if(!Array.isArray(rows)||rows.length<2||rows.length>201)throw Error('課表需有標題及 1–200 筆資料。');
  const headers=rows[0].map(v=>String(v??'').trim());
  if(headers.length!==3||!['星期','節次','科目'].every(h=>headers.includes(h)))throw Error('課表標題必須包含且只有「星期、節次、科目」三欄，可交換欄序。');
  const seen=new Set(),periods=lessons(state);
  const records=rows.slice(1).filter(row=>row.some(v=>String(v??'').trim())).map((row,i)=>{
    if(row.length>3)throw Error(`第 ${i+2} 列超過三欄。`);
    const get=h=>String(row[headers.indexOf(h)]??'').trim(),day=get('星期');
    const weekday=/^[1-5]$/.test(day)?Number(day):WEEKDAYS.indexOf(day)+1;
    if(weekday<1||weekday>5)throw Error(`第 ${i+2} 列星期需為星期一至星期五（或 1–5）。`);
    const period=periods.find(p=>p.name===get('節次'));if(!period)throw Error(`第 ${i+2} 列節次「${get('節次')}」不存在，請依作息設定填寫。`);
    const subject=get('科目');if(!subject||subject.length>40)throw Error(`第 ${i+2} 列科目需為 1–40 字。`);
    const key=`${weekday}:${period.id}`;if(seen.has(key))throw Error(`第 ${i+2} 列星期與節次重複。`);seen.add(key);
    return {weekday,periodId:period.id,subject};
  });
  if(!records.length)throw Error('課表沒有有效課程。');return records;
}
