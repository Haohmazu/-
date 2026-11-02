import {validateState} from './validation.js';
// No speculative v1 aquarium conversion: preserve the original storage key.
export function decodeState(raw) {
  let state;
  try { state = JSON.parse(raw); } catch { throw new Error('本機資料無法解析；為保護資料，已停止寫入。'); }
  if (state?.schemaVersion === 1) state = {...state, schemaVersion:2, participation:{}, templates:[{id:'reading',name:'每日閱讀'}], rounds:[]};
  return validateState(state);
}
