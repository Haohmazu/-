// All browser writers share one same-origin lock. Core dispatch remains synchronous
// for deterministic transaction tests; stale tabs are rejected inside the lock.
export function withBrowserLock(store, locks) {
 return {
  getState:store.getState, getDisplayState:store.getDisplayState, subscribe:store.subscribe, getRecoveryText:store.getRecoveryText,
  get loadError(){return store.loadError;},
  async dispatch(command){
   if(!locks?.request) throw new Error('此瀏覽器無法安全鎖定資料，請使用 HTTPS 網站及最新版 Chrome 或 Edge。');
   return locks.request('class-dashboard-v2-write',()=>store.dispatch(command));
  }
 };
}
