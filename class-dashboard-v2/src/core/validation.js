import {validateDisplay} from '../display/model.js?v=2.0-stage4A.0';
import {validateSchool} from '../school/validation.js?v=2.0-stage4A.0';
import {validateTasks} from '../features/task-validation.js?v=2.0-stage4A.0';
import {DATA_VERSION} from './model.js?v=2.0-stage4A.0';
export function validateState(s) {
  const fail = message => { throw new Error(message); };
  if (!s || s.schemaVersion !== DATA_VERSION) fail('資料版本不支援，請保留原資料並聯絡開發者。');
  if (!Number.isInteger(s.revision) || s.revision < 0) fail('資料修訂編號不正確。');
  if (s.savedAt !== null && (typeof s.savedAt !== 'string' || !Number.isFinite(Date.parse(s.savedAt)))) fail('儲存時間格式不正確。');
  if (typeof s.classroom?.name !== 'string' || !s.classroom.name.trim() || s.classroom.name.length > 40) fail('班級名稱需為 1–40 個字。');
  if (!Array.isArray(s.students) || s.students.length > 50) fail('學生最多 50 位。');
  const ids = new Set(), seats = new Set();
  for (const st of s.students) {
    if (typeof st.id !== 'string' || !st.id || ids.has(st.id)) fail('學生 ID 不可空白或重複。');
    if (!Number.isInteger(st.seat) || st.seat < 1 || st.seat > 50 || seats.has(st.seat)) fail('座號需為 1–50，且不可重複。');
    if (typeof st.name !== 'string' || st.name.length > 40) fail('學生姓名最多 40 個字。');
    ids.add(st.id); seats.add(st.seat);
  }
  if(!Array.isArray(s.rosterImports)) fail('匯入紀錄格式錯誤。');
  for(const entry of s.rosterImports) {
    if(!entry||typeof entry.at!=='string'||!Number.isFinite(Date.parse(entry.at))||!Array.isArray(entry.before)||!Array.isArray(entry.after)||entry.before.length>50||entry.after.length>50||!Number.isInteger(entry.added)||entry.added<0||!Number.isInteger(entry.updated)||entry.updated<0) fail('匯入紀錄格式錯誤。');
    for(const snapshot of [entry.before,entry.after]) {
      const seenIds=new Set(),seenSeats=new Set();
      for(const row of snapshot){if(!row||typeof row.id!=='string'||!ids.has(row.id)||seenIds.has(row.id)||!Number.isInteger(row.seat)||row.seat<1||row.seat>50||seenSeats.has(row.seat)||typeof row.name!=='string'||row.name.length>40) fail('匯入快照格式錯誤。');seenIds.add(row.id);seenSeats.add(row.seat);}
    }
  }
  validateTasks(s);
  validateSchool(s);
  validateDisplay(s.display);
  return s;
}
