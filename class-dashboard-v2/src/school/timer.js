export function remainingTime(timer,at=Date.now()) {return timer.status==='RUNNING'?Math.max(0,timer.endAt-at):timer.remainingMs;}
export function applyTimerCommand(s,c,at) {
  const t=s.timer,now=Date.parse(at),remaining=remainingTime(t,now);
  switch(c.type){
    case 'TIMER_SET':
      if(!Number.isInteger(c.milliseconds)||c.milliseconds<1000||c.milliseconds>86400000)throw Error('倒數時間需介於 1 秒至 24 小時。');
      Object.assign(t,{durationMs:c.milliseconds,remainingMs:c.milliseconds,status:'IDLE',endAt:null});break;
    case 'TIMER_START':
      if(!['IDLE','PAUSED'].includes(t.status)||remaining<=0)throw Error('請先設定或重設時間。');
      t.status='RUNNING';t.endAt=now+remaining;break;
    case 'TIMER_PAUSE':
      if(t.status!=='RUNNING')throw Error('計時器尚未運行。');
      t.remainingMs=remaining;t.status=remaining?'PAUSED':'FINISHED';t.endAt=null;break;
    case 'TIMER_RESET':t.remainingMs=t.durationMs;t.status='IDLE';t.endAt=null;break;
    case 'TIMER_ADJUST': {
      if(!Number.isInteger(c.milliseconds)||Math.abs(c.milliseconds)>86400000)throw Error('調整時間不正確。');
      const value=Math.max(0,Math.min(86400000,remaining+c.milliseconds));t.remainingMs=value;
      if(value===0){t.status='FINISHED';t.endAt=null;}
      else if(t.status==='RUNNING')t.endAt=now+value;
      else if(t.status==='FINISHED')t.status='PAUSED';break;
    }
    case 'TIMER_FINISH':
      if(t.status!=='RUNNING'||t.generation!==c.generation||t.endAt>now)throw Error('計時狀態已變更。');
      t.remainingMs=0;t.endAt=null;t.status='FINISHED';break;
    default:throw Error('不支援的計時操作。');
  }
  t.generation++;return s;
}
