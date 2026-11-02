export function createTimerSound(){
  let context;
  const unlock=()=>{try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){context??=new Audio();if(context.state==='suspended')context.resume().catch(()=>{});}}catch{/* Visual countdown remains authoritative. */}};
  window.addEventListener('pointerdown',unlock,{once:true});window.addEventListener('keydown',unlock,{once:true});
  return preferences=>{if(!preferences.timerSound||preferences.volume===0)return;try{if(!context||context.state!=='running')return;for(let i=0;i<3;i++){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.frequency.value=784;gain.gain.value=preferences.volume*0.15;oscillator.connect(gain);gain.connect(context.destination);oscillator.start(context.currentTime+i*0.3);oscillator.stop(context.currentTime+i*0.3+0.16);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}}catch{/* Audio errors never modify persisted data. */}};
}
