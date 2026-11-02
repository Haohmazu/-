const formatter = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function taiwanParts(at = Date.now()) {
  const p=Object.fromEntries(formatter.formatToParts(new Date(at)).map(p=>[p.type,p.value]));
  return {date:`${p.year}-${p.month}-${p.day}`, weekday:new Date(Date.UTC(+p.year,+p.month-1,+p.day)).getUTCDay(), milliseconds:((+p.hour*60 + +p.minute)*60 + +p.second)*1000};
}
export function validDate(date) {return typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date+'T00:00:00Z')) && new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;}
export function dateWeekday(date) {if(!validDate(date))throw Error('日期格式不正確。');return new Date(date+'T00:00:00Z').getUTCDay();}
export function timeMinutes(time) {if(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('時間請使用 00:00–23:59。');return +time.slice(0,2)*60 + +time.slice(3);}
export function durationText(ms) {const seconds=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
