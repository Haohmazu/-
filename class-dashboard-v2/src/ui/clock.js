const time = new Intl.DateTimeFormat('zh-TW', {timeZone:'Asia/Taipei', hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const date = new Intl.DateTimeFormat('zh-TW', {timeZone:'Asia/Taipei',year:'numeric',month:'long',day:'numeric',weekday:'long'});
export function startClock() {
  const tick = () => {const now = new Date(); document.querySelector('#clock').textContent = time.format(now); document.querySelector('#date').textContent = date.format(now);};
  tick(); const id = setInterval(tick,1000); document.addEventListener('visibilitychange',tick);
  return () => {clearInterval(id);document.removeEventListener('visibilitychange',tick);};
}
