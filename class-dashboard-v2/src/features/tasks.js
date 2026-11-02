export function taiwanDay(at) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));}
export const activeRound = state => state.rounds.find(r => r.status === 'ACTIVE');
export function applyTaskCommand(state, c, newId, at) {
  const fail = text => {throw new Error(text);};
  const round = activeRound(state);
  const student = () => state.students.find(s => s.id === c.studentId) || fail('找不到學生。');
  switch(c.type) {
    case 'SET_PARTICIPATION': {
      student(); if(typeof c.participating !== 'boolean') fail('參與設定格式錯誤。');
      const day=taiwanDay(at); state.participation[day] ??= {};
      state.participation[day][c.studentId] = c.participating; break;
    }
    case 'SAVE_TEMPLATE': {
      const name = String(c.name ?? '').trim(); if(!name || name.length>60) fail('任務名稱需為 1–60 個字。');
      if(c.id) {const t=state.templates.find(t=>t.id===c.id); if(!t) fail('找不到範本。');t.name=name;}
      else state.templates.push({id:newId(),name}); break;
    }
    case 'DELETE_TEMPLATE':
      if(!state.templates.some(t=>t.id===c.id)) fail('找不到範本。');
      state.templates=state.templates.filter(t=>t.id!==c.id); break;
    case 'START_TASK': {
      if(round) fail('請先取消目前任務。');
      const t=state.templates.find(t=>t.id===c.templateId);if(!t) fail('請選擇任務範本。');
      const participants=state.students.filter(s=>state.participation[taiwanDay(at)]?.[s.id]!==false).map(s=>s.id);
      if(!participants.length) fail('至少需要一位有效參與學生。');
      const threshold=c.threshold ?? participants.length;
      if(!Number.isInteger(threshold)||threshold<1||threshold>participants.length) fail('門檻需介於 1 與本輪參與人數之間。');
      state.rounds.push({id:newId(),templateId:t.id,name:t.name,participants,threshold,startedAt:at,endedAt:null,status:'ACTIVE',checkins:[],audit:[],evolution:null});break;
    }
    case 'CHECK_IN': case 'UNCHECK': case 'UNDO_CHECK': {
      if(!round) fail('沒有進行中的任務。');
      const before=structuredClone(round.checkins);
      if(c.type==='UNDO_CHECK') {
        const last=round.audit.at(-1);
        if(!last || !['CHECK_IN','UNCHECK'].includes(last.type)) fail('沒有可復原的最近打卡操作。');
        round.checkins=structuredClone(last.before);
      } else {
        student(); if(!round.participants.includes(c.studentId)) fail('這位學生不在本輪參與名單。');
        const exists=round.checkins.some(x=>x.studentId===c.studentId);
        if(c.type==='CHECK_IN') {
          if(exists) fail('這位學生已打卡，不能重複餵食。');
          if(!['STUDENT','TEACHER'].includes(c.source)) fail('打卡來源錯誤。');
          round.checkins.push({studentId:c.studentId,at,source:c.source});
        } else {
          if(!exists) fail('這位學生尚未打卡。');
          round.checkins=round.checkins.filter(x=>x.studentId!==c.studentId);
        }
      }
      round.audit.push({type:c.type,at,studentId:c.studentId??null,before});break;
    }
    case 'CANCEL_TASK':
      if(!round) fail('沒有進行中的任務。');
      round.status='CANCELLED'; round.endedAt=at;round.audit.push({type:'CANCEL_TASK',at});break;
    default: fail('不支援的任務操作。');
  }
  return state;
}
