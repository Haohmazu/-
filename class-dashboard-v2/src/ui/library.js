import {$,el,button,option} from './dom.js?v=2.0-home-layout.0';
import {OTHER_CATEGORY} from '../library/model.js?v=2.0-home-layout.0';
import {connectTimerMedia} from '../media/timer-link.js?v=2.0-home-layout.0';
export function mountLibrary({store,engine,playSaved,message}){
  let editId=null,itemsSignature,categoriesSignature,linkSignature,listSignature;
  const info=(text,error=false)=>{$('#library-message').textContent=text;$('#library-message').classList.toggle('error',error);};
  async function command(c,text='影音資料已儲存。'){try{await store.dispatch(c);info(text);return true;}catch(e){info(`未保存：${e.message}`,true);return false;}}
  function applyPreferences(p){
    const s=engine.getState();
    if(s.volume!==p.volume)engine.setVolume(p.volume);if(s.muted!==p.muted)engine.setMuted(p.muted);if(s.rate!==p.rate)engine.setRate(p.rate);if(s.repeat!==p.repeat)engine.setRepeat(p.repeat);if(s.shuffle!==p.shuffle)engine.setShuffle(p.shuffle);
  }
  async function setPreferences(patch){
    const ok=await command({type:'SET_MEDIA_PREFERENCES',patch},'播放器偏好已儲存。');
    if(!ok){applyPreferences(store.getDisplayState().mediaLibrary.preferences);message('播放器偏好儲存失敗，已恢復原設定；教室資料未變更。',true);}return ok;
  }
  const reset=()=>{editId=null;$('#library-item-form').reset();$('#library-category').value=OTHER_CATEGORY;$('#library-save').textContent='儲存影音網址';$('#library-cancel-edit').hidden=true;};
  function renderList(lib){
    const query=$('#library-search').value.trim().toLocaleLowerCase('zh-TW'),view=$('#library-view').value,category=$('#library-filter-category').value;
    const visible=lib.items.filter(item=>(view==='all'||view==='favorites'&&item.favorite||view===item.kind)&&(!category||item.categoryId===category)&&(!query||`${item.name} ${item.url} ${lib.categories.find(c=>c.id===item.categoryId)?.name}`.toLocaleLowerCase('zh-TW').includes(query)));
    const signature=JSON.stringify([visible,lib.categories,view,category,query]);if(signature===listSignature)return;listSignature=signature;
    $('#library-count').textContent=`顯示 ${visible.length} / ${lib.items.length} 筆；順序即保存順序。搜尋與篩選不改變播放順序。`;
    const list=$('#library-list'),focused=document.activeElement,oldRow=focused?.closest('#library-list .library-row');
    const focusId=oldRow?.dataset.id,focusAction=focused?.dataset.libraryAction,oldIndex=oldRow?[...list.children].indexOf(oldRow):0;
    list.replaceChildren();
    for(const [index,item] of visible.entries()){
      const row=el('li');row.className='library-row';row.dataset.id=item.id;row.append(el('strong',item.name),el('span',`${item.kind==='music'?'音樂':'影片'} · ${lib.categories.find(c=>c.id===item.categoryId).name}${item.favorite?' · 最愛':''}`));
      const actions=el('div');actions.className='library-actions';
      const play=button('播放',async()=>{try{await playSaved(item);}catch(e){message(e.message,true);}});play.setAttribute('aria-label',`播放已儲存 ${item.name}`);
      const edit=button('編輯',()=>{editId=item.id;$('#library-name').value=item.name;$('#library-kind').value=item.kind;$('#library-url').value=item.url;$('#library-category').value=item.categoryId;$('#library-edit-details').open=true;$('#library-save').textContent='儲存影音修改';$('#library-cancel-edit').hidden=false;$('#library-name').focus();});
      const favorite=button(item.favorite?'移除最愛':'加入最愛',()=>command({type:'FAVORITE_MEDIA_ITEM',id:item.id,favorite:!item.favorite}));
      const up=button('上移',()=>command({type:'MOVE_MEDIA_ITEM',id:item.id,anchorId:visible[index-1].id,placement:'before'}));up.disabled=index===0;
      const down=button('下移',()=>command({type:'MOVE_MEDIA_ITEM',id:item.id,anchorId:visible[index+1].id,placement:'after'}));down.disabled=index===visible.length-1;
      const remove=button('刪除',async()=>{if(!confirm(`刪除「${item.name}」？目前播放此項會停止，若它是計時連動音樂，也會取消連動選擇。`))return;if(await command({type:'DELETE_MEDIA_ITEM',id:item.id,confirmed:true})&&editId===item.id)reset();});
      for(const [control,name] of [[play,'play'],[edit,'edit'],[favorite,'favorite'],[up,'up'],[down,'down'],[remove,'remove']])control.dataset.libraryAction=name;
      actions.append(play,edit,favorite,up,down,remove);row.append(actions);
      const source=el('details');source.append(el('summary','查看來源網址'),el('p',item.url));const link=el('a','開啟原始來源（新分頁）');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.onclick=()=>engine.stop();source.append(link);row.append(source);list.append(row);
    }
    if(!visible.length)list.append(el('li','沒有符合條件的已儲存影音。'));
    if(focusId){const rows=[...list.querySelectorAll('.library-row')],row=rows.find(r=>r.dataset.id===focusId)??rows[Math.min(oldIndex,rows.length-1)];
      const match=row&&[...row.querySelectorAll('button')].find(b=>b.dataset.libraryAction===focusAction&&!b.disabled);
      (match??row?.querySelector('button')??$('#library-view')).focus({preventScroll:true});}

  }
  function render(state){
    const lib=state.mediaLibrary,categories=JSON.stringify(lib.categories),items=JSON.stringify(lib.items);
    if(categories!==categoriesSignature){categoriesSignature=categories;
      for(const selector of ['#library-category','#library-filter-category']){const previous=$(selector).value;$(selector).replaceChildren(...(selector.includes('filter')?[option('','全部分類')]:[]),...lib.categories.map(c=>option(c.id,c.name)));if([...$(selector).options].some(o=>o.value===previous))$(selector).value=previous;else $(selector).value=selector.includes('filter')?'':OTHER_CATEGORY;}
      $('#library-category-list').replaceChildren();for(const c of lib.categories){const row=el('div');row.className='student-row';const field=el('input');field.value=c.name;field.maxLength=40;field.setAttribute('aria-label',`分類 ${c.name}`);const remove=button('刪除分類',()=>{if(confirm(`刪除「${c.name}」？其影音會保留並移到其他分類。`))command({type:'DELETE_MEDIA_CATEGORY',id:c.id,confirmed:true});});remove.disabled=c.id===OTHER_CATEGORY;row.append(field,button('修改分類',()=>command({type:'SAVE_MEDIA_CATEGORY',id:c.id,name:field.value})),remove);$('#library-category-list').append(row);}
    }
    if(items!==itemsSignature){itemsSignature=items;engine.syncLibrary(lib.items);const selected=$('#timer-link-music').value;$('#timer-link-music').replaceChildren(option('','不選擇'),...lib.items.filter(item=>item.kind==='music').map(item=>option(item.id,item.name)));if(lib.items.some(item=>item.id===selected&&item.kind==='music'))$('#timer-link-music').value=selected;}
    const link=JSON.stringify(lib.timerLink);if(link!==linkSignature){linkSignature=link;$('#timer-link-enabled').checked=lib.timerLink.enabled;$('#timer-link-music').value=lib.timerLink.musicId??'';$('#timer-link-pause').checked=lib.timerLink.pauseWithTimer;$('#timer-link-end').value=lib.timerLink.musicEnd;$('#timer-link-video').checked=lib.timerLink.pauseVideoOnEnd;}
    applyPreferences(lib.preferences);renderList(lib);
  }
  for(const selector of ['#library-search','#library-view','#library-filter-category'])$(selector).addEventListener(selector==='#library-search'?'input':'change',()=>renderList(store.getDisplayState().mediaLibrary));
  $('#library-item-form').onsubmit=async e=>{e.preventDefault();if(await command({type:'SAVE_MEDIA_ITEM',id:editId??undefined,name:$('#library-name').value,kind:$('#library-kind').value,url:$('#library-url').value,categoryId:$('#library-category').value}))reset();};
  $('#library-cancel-edit').onclick=reset;
  $('#library-category-form').onsubmit=async e=>{e.preventDefault();if(await command({type:'SAVE_MEDIA_CATEGORY',name:$('#library-category-name').value}))$('#library-category-name').value='';};
  $('#timer-link-form').onsubmit=e=>{e.preventDefault();command({type:'SET_TIMER_MEDIA_LINK',patch:{enabled:$('#timer-link-enabled').checked,musicId:$('#timer-link-music').value||null,pauseWithTimer:$('#timer-link-pause').checked,musicEnd:$('#timer-link-end').value,pauseVideoOnEnd:$('#timer-link-video').checked}},'計時影音連動已儲存；不會因保存設定而立即播放。');};
  store.subscribe(render);render(store.getDisplayState());reset();
  engine.subscribe((s,event)=>{
    if(event!=='native-preference')return;
    const p=store.getDisplayState().mediaLibrary.preferences,patch={};for(const key of ['volume','muted','rate'])if(s[key]!==p[key])patch[key]=s[key];
    if(Object.keys(patch).length)setPreferences(patch);
  });
  connectTimerMedia({store,engine,playSaved:item=>playSaved(item,{background:true}),onError:text=>message(text,true)});
  return {setPreferences};
}
