import {applyAppearanceCommand} from '../display/appearance.js?v=2.0-IC.0';
import {applyLibraryCommand} from '../library/commands.js?v=2.0-IC.0';
import {applyDisplayCommand} from '../display/model.js?v=2.0-IC.0';
import {importRoster} from '../io/roster.js?v=2.0-IC.0';
import {parseBackup} from '../io/backup.js?v=2.0-IC.0';
import {applySchoolCommand} from '../school/commands.js?v=2.0-IC.0';
import {createInitialState, STORAGE_KEY} from './model.js?v=2.0-IC.0';
import {decodeState} from './migrations.js?v=2.0-IC.0';
import {validateState} from './validation.js?v=2.0-IC.0';
import {applyClassroomCommand} from '../features/classroom.js?v=2.0-IC.0';
const secureRandom=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
export function createStore({storage,newId=()=>crypto.randomUUID(),now=()=>new Date().toISOString(),random=secureRandom}) {
  let state,locked=false,loadError=null,baseline;
  const listeners=new Set();
  try {baseline=storage.getItem(STORAGE_KEY);state=baseline===null?createInitialState():decodeState(baseline);}
  catch(error){state=createInitialState();locked=true;loadError=error;}
  return {
    getState:()=>structuredClone(state),
    getDisplayState:()=>{const {rounds,templates,rosterImports,...display}=state;return structuredClone(display);},
    get loadError(){return loadError;},
    getRecoveryText:()=>baseline,
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    dispatch(command){
      const restoring=command?.type==='RESTORE_BACKUP'&&command.confirmed===true;
      if(locked&&!restoring)throw Error('資料讀取異常，已停止寫入。請保留原始資料，並使用已驗證備份還原。');
      let stored;try{stored=storage.getItem(STORAGE_KEY);}catch{throw Error('無法讀取本機儲存，操作未保存。');}
      // Compare complete raw state, so same-revision manual edits and old-version writes cannot slip through.
      if(baseline===undefined||stored!==baseline)throw Error('其他分頁已更新資料或資料來源已改變，請重新整理後操作。');
      let next;const at=now();
      if(command?.type==='RESTORE_BACKUP'){
        if(!restoring)throw Error('還原前請先預覽並確認覆蓋資料。');
        if(command.expectedRevision!==state.revision)throw Error('預覽後資料已變更，請重新預覽。');
        next=parseBackup(command.text).state;
      }else{
        const handler=command?.type==='SET_APPEARANCE'?applyAppearanceCommand:['SAVE_MEDIA_ITEM','DELETE_MEDIA_ITEM','FAVORITE_MEDIA_ITEM','MOVE_MEDIA_ITEM','SAVE_MEDIA_CATEGORY','DELETE_MEDIA_CATEGORY','SET_MEDIA_PREFERENCES','SET_TIMER_MEDIA_LINK'].includes(command?.type)?applyLibraryCommand:command?.type==='SET_DISPLAY'?applyDisplayCommand:command?.type==='IMPORT_STUDENTS'?importRoster:['SET_CLASS_NAME','ADD_STUDENT','UPDATE_STUDENT'].includes(command?.type)?applyClassroomCommand:applySchoolCommand;
        next=handler(structuredClone(state),command,newId,at,random);
      }
      next.revision=state.revision+1;next.savedAt=at;validateState(next);
      const raw=JSON.stringify(next);try{storage.setItem(STORAGE_KEY,raw);}catch{throw Error('儲存失敗，操作未保存。請檢查瀏覽器儲存空間或隱私設定。');}
      const event={type:command.type,previousTimer:structuredClone(state.timer)};
      state=next;baseline=raw;locked=false;loadError=null;
      for(const fn of listeners){try{fn(structuredClone(state),event);}catch(error){console.error('畫面更新失敗',error);}}
      return structuredClone(state);
    }
  };
}
