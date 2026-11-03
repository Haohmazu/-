import {validateSettlement} from './settlement.js?v=2.0-integration-IB.0';
export function validateTasks(s) {
  const fail=()=>{throw new Error('任務資料不一致，請保留原資料。');};
  const validTime=t=>typeof t==='string' && Number.isFinite(Date.parse(t));
  const students=new Set(s.students.map(x=>x.id));
  if(!s.participation || typeof s.participation!=='object' || Array.isArray(s.participation)) fail();
  for(const [day, roster] of Object.entries(s.participation)) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!roster||typeof roster!=='object'||Array.isArray(roster)) fail();
    for(const [id,value] of Object.entries(roster)) if(!students.has(id)||typeof value!=='boolean') fail();
  }
  if(!Array.isArray(s.templates)||!Array.isArray(s.rounds)) fail();
  const ids=new Set();
  for(const t of s.templates) {if(!t||typeof t.id!=='string'||!t.id||ids.has(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.length>60) fail();ids.add(t.id);}
  const roundIds=new Set();let active=0;
  for(const r of s.rounds) {
    if(!r||typeof r.id!=='string'||!r.id||roundIds.has(r.id)||typeof r.templateId!=='string'||typeof r.name!=='string'||!r.name.trim()||r.name.length>60) fail();
    roundIds.add(r.id);
    if(!['ACTIVE','CANCELLED','COMPLETED'].includes(r.status)||!validTime(r.startedAt)||r.evolution!==null) fail();
    validateSettlement(r);
    if(r.status==='ACTIVE'){active++;if(r.endedAt!==null) fail();}else if(!validTime(r.endedAt)) fail();
    if(!Array.isArray(r.participants)||!r.participants.length||new Set(r.participants).size!==r.participants.length||r.participants.some(id=>!students.has(id))) fail();
    if(!Number.isInteger(r.threshold)||r.threshold<1||r.threshold>r.participants.length) fail();
    const validateChecks=(checks,participants=r.participants)=>{if(!Array.isArray(checks)||new Set(checks.map(x=>x?.studentId)).size!==checks.length) fail();for(const x of checks)if(!x||!participants.includes(x.studentId)||!validTime(x.at)||!['STUDENT','TEACHER'].includes(x.source))fail();};
    validateChecks(r.checkins);
    if(!Array.isArray(r.audit)) fail();
    for(const a of r.audit) {if(!a||!['CHECK_IN','UNCHECK','UNDO_CHECK','CANCEL_TASK','REVISE_PARTICIPANTS'].includes(a.type)||!validTime(a.at)) fail();if(a.type==='REVISE_PARTICIPANTS') {
      for(const snap of [a.before,a.after]) {
       if(!snap||!Array.isArray(snap.participants)||!snap.participants.length||new Set(snap.participants).size!==snap.participants.length||snap.participants.some(id=>!students.has(id))||!Number.isInteger(snap.threshold)||snap.threshold<1||snap.threshold>snap.participants.length) fail();
       validateChecks(snap.checkins,snap.participants);
      }
      if(typeof a.confirmedRemoveChecked!=='boolean') fail();
    }else if(a.type!=='CANCEL_TASK')validateChecks(a.before,[...students]);}
  }
  if(active>1) fail();
}
