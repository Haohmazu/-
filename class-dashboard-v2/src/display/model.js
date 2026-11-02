export function displayDefaults(){return {focus:'home',privacy:false,layout:'standard',font:'medium',theme:'ocean'};}
export function validateDisplay(display){
  if(!display||typeof display!=='object'||Array.isArray(display)||!['home','clock','timer','schedule','picker'].includes(display.focus)||typeof display.privacy!=='boolean'||!['standard','clock','schedule'].includes(display.layout)||!['small','medium','large','xlarge'].includes(display.font)||!['ocean','light','contrast'].includes(display.theme))throw Error('展示設定格式不正確。');
  if(Object.keys(display).some(key=>!['focus','privacy','layout','font','theme'].includes(key)))throw Error('展示設定包含不支援的欄位。');
}
export function applyDisplayCommand(state,command){
  const patch=command.patch;
  if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(key=>!['focus','privacy','layout','font','theme'].includes(key)))throw Error('不支援的展示設定。');
  const next={...state.display,...patch};validateDisplay(next);state.display=next;return state;
}
