import {activeTerm} from './schedule.js?v=2.0-stage3.0';
import {validatePeriods} from './validation.js?v=2.0-stage3.0';
import {dateWeekday,taiwanParts} from './time.js?v=2.0-stage3.0';
import {applyTimerCommand} from './timer.js?v=2.0-stage3.0';
export function applySchoolCommand(s,c,newId,at,random) {
  if(c.expectedRevision!==undefined&&c.expectedRevision!==s.revision)throw Error('預覽後資料已變更，請重新預覽。');
  if(c.type.startsWith('TIMER_'))return applyTimerCommand(s,c,at);
  const term=activeTerm(s);
  const subject=()=>{if(typeof c.subject!=='string'||c.subject.length>40)throw Error('科目最多 40 個字。');return c.subject.trim();};
  const period=()=>{if(!s.school.periods.some(p=>p.id===c.periodId&&p.kind==='LESSON'))throw Error('請選擇有效授課節次。');};
  switch(c.type){
    case 'SAVE_PERIODS':validatePeriods(c.periods);s.school.periods=structuredClone(c.periods);break;
    case 'CREATE_TERM': {
      if(!Number.isInteger(c.year)||c.year<100||c.year>999||![1,2].includes(c.semester))throw Error('學年或學期格式錯誤。');
      if(s.school.terms.some(t=>t.year===c.year&&t.semester===c.semester))throw Error('這個學年與學期已存在，請切換既有學期。');
      s.school.terms.push({id:newId(),year:c.year,semester:c.semester,weekly:c.copyCurrent?structuredClone(term.weekly):{},overrides:{}});s.school.activeTermId=s.school.terms.at(-1).id;break;
    }
    case 'SELECT_TERM':
      if(!s.school.terms.some(t=>t.id===c.id))throw Error('找不到學期。');s.school.activeTermId=c.id;break;
    case 'SET_COURSE': {
      period();if(!Number.isInteger(c.weekday)||c.weekday<1||c.weekday>5)throw Error('請選擇星期一至五。');
      const name=subject();term.weekly[c.weekday]??={};if(name)term.weekly[c.weekday][c.periodId]=name;else delete term.weekly[c.weekday][c.periodId];break;
    }
    case 'IMPORT_TIMETABLE':
      if(c.termId!==term.id)throw Error('目前學期已改變，請重新預覽。');
      if(!Array.isArray(c.records)||!c.records.length||c.records.length>200)throw Error('課表需有 1–200 筆。');
      {const seen=new Set();for(const r of c.records){const key=`${r.weekday}:${r.periodId}`;if(seen.has(key))throw Error('課表星期及節次不可重複。');seen.add(key);applySchoolCommand(s,{...r,type:'SET_COURSE'},newId,at,random);}}
      break;
    case 'SET_OVERRIDE': {
      period();if(![1,2,3,4,5].includes(dateWeekday(c.date)))throw Error('單日調課請選擇星期一至五。');
      const name=subject();if(!name)throw Error('臨時科目不可空白，取消請使用取消調課。');term.overrides[c.date]??={};term.overrides[c.date][c.periodId]=name;break;
    }
    case 'DELETE_OVERRIDE':
      dateWeekday(c.date);if(!term.overrides[c.date]||!Object.hasOwn(term.overrides[c.date],c.periodId))throw Error('這個日期與節次沒有臨時調課。');
      delete term.overrides[c.date][c.periodId];if(!Object.keys(term.overrides[c.date]).length)delete term.overrides[c.date];break;
    case 'ADD_NOTE':
      s.notes.push({id:newId(),text:c.text,done:false});break;
    case 'EDIT_NOTE':case 'TOGGLE_NOTE':case 'DELETE_NOTE':case 'MOVE_NOTE': {
      const index=s.notes.findIndex(n=>n.id===c.id);if(index<0)throw Error('找不到聯絡事項。');
      if(c.type==='EDIT_NOTE')s.notes[index].text=c.text;
      if(c.type==='TOGGLE_NOTE'){if(typeof c.done!=='boolean')throw Error('完成狀態不正確。');s.notes[index].done=c.done;}
      if(c.type==='DELETE_NOTE')s.notes.splice(index,1);
      if(c.type==='MOVE_NOTE'){if(![-1,1].includes(c.direction))throw Error('排序方向不正確。');const target=index+c.direction;if(target<0||target>=s.notes.length)throw Error('已在最上方或最下方。');[s.notes[index],s.notes[target]]=[s.notes[target],s.notes[index]];}
      break;
    }
    case 'CLEAR_DONE_NOTES':
      if(c.confirmed!==true)throw Error('請先確認清除已完成事項。');s.notes=s.notes.filter(n=>!n.done);break;
    case 'SET_PARTICIPATION': {
      if(!s.students.some(st=>st.id===c.studentId)||typeof c.participating!=='boolean')throw Error('今日參與設定不正確。');
      const date=taiwanParts(at).date;s.participation[date]??={};s.participation[date][c.studentId]=c.participating;break;
    }
    case 'DRAW_STUDENT': {
      const eligible=s.students.filter(st=>s.participation[taiwanParts(at).date]?.[st.id]!==false&&!s.picker.drawn.includes(st.id));
      if(!eligible.length)throw Error('本輪可抽學生已抽完，或今日無參與學生，請檢查設定或重新開始。');
      const value=random();if(value<0||value>=1||!Number.isFinite(value))throw Error('隨機來源異常，未保存抽號。');
      const id=eligible[Math.floor(value*eligible.length)].id;s.picker.drawn.push(id);s.picker.lastId=id;break;
    }
    case 'RESET_PICKER':
      if(c.confirmed!==true)throw Error('請確認重新開始抽號。');s.picker={round:s.picker.round+1,drawn:[],lastId:null};break;
    case 'SET_SOUND':
      s.preferences={timerSound:c.enabled,volume:c.volume};break;
    default:throw Error('任務功能已暫停，或此操作不受支援。');
  }
  return s;
}
