import {taiwanParts,timeMinutes,dateWeekday} from './time.js?v=2.0-home-layout.0';
export function activeTerm(state) {return state.school.terms.find(term=>term.id===state.school.activeTermId);}
export function lessons(state) {return [...state.school.periods].filter(p=>p.kind==='LESSON').sort((a,b)=>timeMinutes(a.start)-timeMinutes(b.start));}
export function courseAt(state,date,periodId,term=activeTerm(state)) {
  const weekday=dateWeekday(date);if(weekday<1||weekday>5)return {subject:'週末',temporary:false};
  const override=term.overrides[date];
  return Object.hasOwn(override??{},periodId) ? {subject:override[periodId],temporary:true} : {subject:term.weekly[weekday]?.[periodId]||'未設定',temporary:false};
}
export function todaySchedule(state,at=Date.now()) {const {date,weekday}=taiwanParts(at);return weekday===0||weekday===6?[]:lessons(state).map(p=>({...p,...courseAt(state,date,p.id)}));}
export function currentSchoolTime(state,at=Date.now()) {
  const {date,weekday,milliseconds}=taiwanParts(at);
  if(weekday===0||weekday===6)return {period:null,current:null,next:null,remainingMs:0,status:'週末休息日'};
  const periods=[...state.school.periods].sort((a,b)=>timeMinutes(a.start)-timeMinutes(b.start));
  const period=periods.find(p=>milliseconds>=timeMinutes(p.start)*60000 && milliseconds<timeMinutes(p.end)*60000)??null;
  const next=lessons(state).find(p=>timeMinutes(p.start)*60000>milliseconds)??null;
  return {period,current:period?.kind==='LESSON'?courseAt(state,date,period.id):null,next:next?{...next,...courseAt(state,date,next.id)}:null,remainingMs:period?timeMinutes(period.end)*60000-milliseconds:0,status:period?(period.kind==='LESSON'?'上課中':period.name):next?'尚未到下一節':'今日課程已結束'};
}
