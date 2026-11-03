import {validateSound} from './sound-model.js?v=2.0-IC.0';
import {timeMinutes,validDate,dateWeekday} from './time.js?v=2.0-IC.0';
export function validatePeriods(periods) {
  if(!Array.isArray(periods)||!periods.length||periods.length>40)throw Error('作息需有 1–40 個時段。');
  const ids=new Set(),lessonNames=new Set();
  const sorted=[...periods].sort((a,b)=>timeMinutes(a?.start)-timeMinutes(b?.start));let lastEnd=-1;
  for(const p of sorted){
    if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>30||!['LESSON','BREAK','OTHER'].includes(p.kind))throw Error('作息名稱、類型或 ID 不正確。');
    const start=timeMinutes(p.start),end=timeMinutes(p.end);if(start>=end)throw Error('作息開始時間必須早於結束時間。');if(start<lastEnd)throw Error('作息時段不可重疊。');lastEnd=end;ids.add(p.id);
    if(p.kind==='LESSON'){if(lessonNames.has(p.name))throw Error('授課節次名稱不可重複。');lessonNames.add(p.name);}
  }
}
export function validateSchool(s) {
  if(!s.school||typeof s.school!=='object')throw Error('缺少學校作息資料。');validatePeriods(s.school.periods);
  const periods=new Set(s.school.periods.filter(p=>p.kind==='LESSON').map(p=>p.id));
  if(!Array.isArray(s.school.terms)||!s.school.terms.length||s.school.terms.length>40)throw Error('學期資料格式不正確（最多 40 學期）。');
  const ids=new Set(),labels=new Set();
  const subjects=map=>{if(!map||typeof map!=='object'||Array.isArray(map))throw Error('課表格式不正確。');for(const [id,subject] of Object.entries(map))if(!periods.has(id)||typeof subject!=='string'||!subject.trim()||subject.length>40)throw Error('課表節次不存在，或科目需為 1–40 個字。');};
  for(const term of s.school.terms){
    if(!term||typeof term.id!=='string'||!term.id||ids.has(term.id)||!Number.isInteger(term.year)||term.year<100||term.year>999||![1,2].includes(term.semester)||labels.has(`${term.year}-${term.semester}`))throw Error('學年需為民國 100–999 年，學期為 1 或 2，且不可重複。');ids.add(term.id);labels.add(`${term.year}-${term.semester}`);
    if(!term.weekly||typeof term.weekly!=='object'||Array.isArray(term.weekly)||!term.overrides||typeof term.overrides!=='object'||Array.isArray(term.overrides))throw Error('學期課表格式不正確。');
    for(const [day,map] of Object.entries(term.weekly)){if(!/^[1-5]$/.test(day))throw Error('課表星期必須為一至五。');subjects(map);}
    for(const [date,map] of Object.entries(term.overrides)){if(!validDate(date)||![1,2,3,4,5].includes(dateWeekday(date)))throw Error('單日調課日期必須為有效平日。');subjects(map);}
  }
  if(!ids.has(s.school.activeTermId))throw Error('找不到目前學期。');
  const t=s.timer;if(!t||!['IDLE','RUNNING','PAUSED','FINISHED'].includes(t.status)||!Number.isInteger(t.durationMs)||t.durationMs<1000||t.durationMs>86400000||!Number.isInteger(t.remainingMs)||t.remainingMs<0||t.remainingMs>86400000||!Number.isInteger(t.generation)||t.generation<0)throw Error('倒數計時器資料不正確。');
  if(t.status==='RUNNING'?(!Number.isSafeInteger(t.endAt)||t.endAt<=0):t.endAt!==null)throw Error('計時結束時間不正確。');if(t.status==='FINISHED'&&t.remainingMs!==0)throw Error('計時狀態不一致。');
  const noteIds=new Set();if(!Array.isArray(s.notes)||s.notes.length>100)throw Error('聯絡簿最多 100 項。');for(const n of s.notes){if(!n||typeof n.id!=='string'||!n.id||noteIds.has(n.id)||typeof n.text!=='string'||!n.text.trim()||n.text.length>300||typeof n.done!=='boolean')throw Error('聯絡簿資料不正確。');noteIds.add(n.id);}
  const studentIds=new Set(s.students.map(s=>s.id));const p=s.picker;if(!p||!Number.isInteger(p.round)||p.round<1||!Array.isArray(p.drawn)||new Set(p.drawn).size!==p.drawn.length||p.drawn.some(id=>!studentIds.has(id))||(p.lastId!==null&&(!p.drawn.includes(p.lastId)||p.lastId!==p.drawn.at(-1))))throw Error('抽號資料不正確。');
  validateSound(s.preferences);
}
