import {applyTaskCommand} from '../features/tasks.js';
import {createInitialState, STORAGE_KEY} from './model.js';
import {decodeState} from './migrations.js';
import {validateState} from './validation.js';
import {applyClassroomCommand} from '../features/classroom.js';
export function createStore({storage, newId = () => crypto.randomUUID(), now = () => new Date().toISOString()}) {
  let state, locked = false, loadError = null;
  const listeners = new Set();
  try { const raw = storage.getItem(STORAGE_KEY); state = raw === null ? createInitialState() : decodeState(raw); }
  catch (error) {state = createInitialState(); locked = true; loadError = error;}
  return {
    getState: () => structuredClone(state),
    get loadError() {return loadError;},
    subscribe(fn) {listeners.add(fn); return () => listeners.delete(fn);},
    dispatch(command) {
      if (locked) throw new Error('資料讀取異常，已停止寫入以保護原資料。請勿清除瀏覽器資料。');
      // Reject stale tabs before any write; synchronous localStorage commit is authoritative.
      let stored;
      try {stored = storage.getItem(STORAGE_KEY);} catch {throw new Error('無法讀取本機儲存，操作未保存。');}
      if (stored !== null && decodeState(stored).revision !== state.revision) throw new Error('其他分頁已更新資料，請重新整理後再操作。');
      if (stored === null && state.revision !== 0) throw new Error('本機資料已在其他地方移除，請重新整理。');
      const handler = ['SET_CLASS_NAME','ADD_STUDENT','UPDATE_STUDENT'].includes(command.type) ? applyClassroomCommand : applyTaskCommand;
      const next = handler(structuredClone(state), command, newId, now());
      next.revision++; next.savedAt = now(); validateState(next);
      try {storage.setItem(STORAGE_KEY, JSON.stringify(next));} catch {throw new Error('儲存失敗，操作未保存。請檢查瀏覽器儲存空間或隱私設定。');}
      state = next;
      for (const fn of listeners) {try {fn(structuredClone(state));} catch (error) {console.error('畫面更新失敗', error);}}
      return structuredClone(state);
    }
  };
}
