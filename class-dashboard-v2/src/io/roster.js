export const TEMPLATE_ROWS = [['座號','姓名'],['1','王小明'],['2','陳小華'],['3','林小美']];
export function parseCSV(text) {
 if(typeof text!=='string'||text.length>200000)throw Error('CSV 超過大小限制。');
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<=text.length;i++){
  const c=text[i];
  if(quoted){if(c===undefined)throw Error('CSV 引號未結束。');if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(c==='"'){if(cell||closed)throw Error('CSV 引號位置錯誤。');quoted=true;continue;}
  if(c===','||c==='\n'||c==='\r'||c===undefined){row.push(cell);cell='';closed=false;if(c!==','){if(row.some(x=>x.trim()))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}continue;}
  if(closed)throw Error('CSV 引號後有不合法文字。');cell+=c;
 }
 return rows;
}
export function rowsToRoster(rows) {
 if(!Array.isArray(rows)||rows.length<2)throw Error('名單需包含標題與至少一位學生。');
 const header=rows[0].map(x=>String(x??'').trim());
 if(header.length!==2||!header.includes('座號')||!header.includes('姓名'))throw Error('標題必須包含且只有「座號」與「姓名」兩欄，可交換順序。');
 const seatIndex=header.indexOf('座號'),nameIndex=header.indexOf('姓名');
 const records=rows.slice(1).filter(row=>row.some(x=>String(x??'').trim())).map((row,i)=>{
  if(row.length>2)throw Error(`第 ${i+2} 列超過兩欄。`);
  const raw=String(row[seatIndex]??'').trim();
  if(!/^\d+$/.test(raw))throw Error(`第 ${i+2} 列座號必須是 1–50 整數。`);
  return {seat:Number(raw),name:String(row[nameIndex]??'').trim()};
 });
 validateRoster(records);return records;
}
export function validateRoster(records){
 if(!Array.isArray(records)||!records.length||records.length>50)throw Error('名單需有 1–50 位學生。');
 const seats=new Set();
 for(const [i,r] of records.entries()){
  if(!Number.isInteger(r.seat)||r.seat<1||r.seat>50)throw Error(`第 ${i+2} 列座號必須是 1–50 整數。`);
  if(seats.has(r.seat))throw Error(`座號 ${r.seat} 重複。`);seats.add(r.seat);
  if(typeof r.name!=='string'||r.name.length>40)throw Error(`第 ${i+2} 列姓名最多 40 字。`);
 }
}
export function csvText(rows){return '\uFEFF'+rows.map(row=>row.map(value=>{let s=String(value);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export function planRoster(state, rows) {
 validateRoster(rows);
 const matched=new Set();let added=0,updated=0;
 const students=structuredClone(state.students);
 for(const row of rows){
  if(row.studentId===null){students.push({id:`preview-new-${row.seat}`,seat:row.seat,name:row.name});added++;}
  else {
   if(typeof row.studentId!=='string'||matched.has(row.studentId))throw Error('請逐列確認對應；同一學生不能對應兩列。');
   const student=students.find(s=>s.id===row.studentId);if(!student)throw Error('找不到指定的既有學生。');
   matched.add(row.studentId);student.seat=row.seat;student.name=row.name;updated++;
  }
 }
 if(students.length>50)throw Error('新增後總人數超過 50 位；未列入者會保留，不會自動刪除。');
 if(new Set(students.map(s=>s.seat)).size!==students.length)throw Error('與既有座號衝突，請確認對應或先調整既有學生座號。');
 return {added,updated,students};
}
export function importRoster(state,c,newId,at){
 if(c.expectedRevision!==state.revision)throw Error('預覽後資料已變更，請重新預覽。');
 const plan=planRoster(state,c.rows),before=structuredClone(state.students);
 // Rebuild using explicit identities, never names or preview IDs.
 for(const row of c.rows){if(row.studentId===null)state.students.push({id:newId(),seat:row.seat,name:row.name});else Object.assign(state.students.find(s=>s.id===row.studentId),{seat:row.seat,name:row.name});}
 state.rosterImports.push({at,before,after:structuredClone(state.students),added:plan.added,updated:plan.updated});return state;
}
