import {decodeState} from '../core/migrations.js?v=2.0-integration-IB.0';
export function makeBackup(state,at=new Date().toISOString()) {return JSON.stringify({app:'class-dashboard-v2',formatVersion:1,exportedAt:at,data:state},null,2);}
export function parseBackup(text) {
  if(typeof text!=='string'||new TextEncoder().encode(text).length>8*1024*1024)throw Error('備份檔案上限 8 MB。');
  let value;try{value=JSON.parse(text);}catch{throw Error('備份不是有效的 JSON。');}
  if(value?.app!=='class-dashboard-v2'||value.formatVersion!==1||typeof value.exportedAt!=='string'||!Number.isFinite(Date.parse(value.exportedAt))||!value.data)throw Error('不是本系統支援的完整備份。');
  return {state:decodeState(JSON.stringify(value.data)),exportedAt:value.exportedAt};
}
