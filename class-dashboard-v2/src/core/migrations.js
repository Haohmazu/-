import {appearanceDefaults} from '../display/appearance.js?v=2.0-integration-IB.0';
import {libraryDefaults} from '../library/model.js?v=2.0-integration-IB.0';
import {displayDefaults} from '../display/model.js?v=2.0-integration-IB.0';
import {schoolDefaults,toolDefaults} from '../school/model.js?v=2.0-integration-IB.0';
import {validateState} from './validation.js?v=2.0-integration-IB.0';
// No speculative v1 aquarium conversion: preserve the original storage key.
export function decodeState(raw) {
  let state;
  try { state = JSON.parse(raw); } catch { throw new Error('本機資料無法解析；為保護資料，已停止寫入。'); }
  if (state?.schemaVersion === 1) state = {...state, schemaVersion:2, participation:{}, templates:[{id:'reading',name:'每日閱讀'}], rounds:[]};
  if (state?.schemaVersion === 2) state = {...state, schemaVersion:3, rosterImports:[], rounds:state.rounds.map(round=>({...round, settlement:{version:1,status:'UNSETTLED',result:null}}))};
  if (state?.schemaVersion === 3) state = {...state,schemaVersion:4,school:schoolDefaults(),...toolDefaults()};
  if(state?.schemaVersion===4)state={...state,schemaVersion:5,display:displayDefaults()};
  if(state?.schemaVersion===5)state={...state,schemaVersion:6,mediaLibrary:libraryDefaults()};
  if(state?.schemaVersion===6)state={...state,schemaVersion:7,appearance:appearanceDefaults()};
  return validateState(state);
}
