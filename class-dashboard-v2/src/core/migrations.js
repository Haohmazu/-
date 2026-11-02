import {validateState} from './validation.js?v=2.0-stage2.1';
// No speculative v1 aquarium conversion: preserve the original storage key.
export function decodeState(raw) {
  let state;
  try { state = JSON.parse(raw); } catch { throw new Error('本機資料無法解析；為保護資料，已停止寫入。'); }
  if (state?.schemaVersion === 1) state = {...state, schemaVersion:2, participation:{}, templates:[{id:'reading',name:'每日閱讀'}], rounds:[]};
  if (state?.schemaVersion === 2) state = {...state, schemaVersion:3, rosterImports:[], rounds:state.rounds.map(round=>({...round, settlement:{version:1,status:'UNSETTLED',result:null}}))};
  return validateState(state);
}
