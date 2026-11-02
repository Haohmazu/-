export function roundStatistics(round) {
 const completed=round.checkins.length,total=round.participants.length;
 return {completed,incomplete:total-completed,total,rate:total?completed/total:0};
}
export function taskStatistics(state) {
 const perStudent=Object.fromEntries(state.students.map(s=>[s.id,0]));
 for(const r of state.rounds.filter(r=>r.status!=='CANCELLED')) for(const c of r.checkins) perStudent[c.studentId]++;
 return {rounds:state.rounds.length,cancelled:state.rounds.filter(r=>r.status==='CANCELLED').length,settled:state.rounds.filter(r=>r.status==='COMPLETED').length,perStudent};
}
