import {parseSource} from '../media/sources.js?v=2.0-three-columns.0';
import {OTHER_CATEGORY,validateLibrary} from './model.js?v=2.0-three-columns.0';
export function applyLibraryCommand(state,c,newId){
  const lib=state.mediaLibrary;
  const item=()=>{const found=lib.items.find(item=>item.id===c.id);if(!found)throw Error('找不到已保存的影音，請重新整理。');return found;};
  const patch=(value,allowed)=>{if(!value||typeof value!=='object'||Array.isArray(value)||!Object.keys(value).length||Object.keys(value).some(key=>!allowed.includes(key)))throw Error('不支援的影音設定。');return value;};
  switch(c.type){
    case 'SAVE_MEDIA_ITEM': {
      const source=parseSource(c.url,c.kind),name=typeof c.name==='string'?c.name.trim():'';
      if(!name||name.length>200)throw Error('影音名稱需為 1–200 字。');
      const existing=c.id!=null?item():null;
      const saved={id:existing?.id??newId(),name,...source,categoryId:c.categoryId,favorite:existing?.favorite??false};
      if(existing)lib.items[lib.items.indexOf(existing)]=saved;else lib.items.push(saved);
      if(lib.timerLink.musicId===saved.id&&saved.kind!=='music'){lib.timerLink.enabled=false;lib.timerLink.musicId=null;}
      break;
    }
    case 'DELETE_MEDIA_ITEM':
      item();if(c.confirmed!==true)throw Error('請先確認刪除網址。');lib.items=lib.items.filter(item=>item.id!==c.id);
      if(lib.timerLink.musicId===c.id){lib.timerLink.enabled=false;lib.timerLink.musicId=null;}break;
    case 'FAVORITE_MEDIA_ITEM':
      if(typeof c.favorite!=='boolean')throw Error('最愛設定不正確。');item().favorite=c.favorite;break;
    case 'MOVE_MEDIA_ITEM': {
      const moving=item(),anchor=lib.items.find(item=>item.id===c.anchorId);if(!anchor||anchor===moving||!['before','after'].includes(c.placement))throw Error('排序目標不正確。');
      lib.items=lib.items.filter(item=>item!==moving);lib.items.splice(lib.items.indexOf(anchor)+(c.placement==='after'?1:0),0,moving);break;
    }
    case 'SAVE_MEDIA_CATEGORY': {
      const name=typeof c.name==='string'?c.name.trim():'';
      if(c.id!=null){const category=lib.categories.find(category=>category.id===c.id);if(!category)throw Error('找不到分類。');category.name=name;}
      else lib.categories.push({id:newId(),name});break;
    }
    case 'DELETE_MEDIA_CATEGORY':
      if(c.id===OTHER_CATEGORY)throw Error('其他分類必須保留，供刪除分類後的項目使用。');
      if(!lib.categories.some(category=>category.id===c.id)||c.confirmed!==true)throw Error('請確認刪除分類，原項目會移至其他。');
      lib.categories=lib.categories.filter(category=>category.id!==c.id);for(const entry of lib.items)if(entry.categoryId===c.id)entry.categoryId=OTHER_CATEGORY;break;
    case 'SET_MEDIA_PREFERENCES':Object.assign(lib.preferences,patch(c.patch,['volume','muted','rate','repeat','shuffle']));break;
    case 'SET_TIMER_MEDIA_LINK':Object.assign(lib.timerLink,patch(c.patch,['enabled','musicId','pauseWithTimer','musicEnd','pauseVideoOnEnd']));break;
    default:throw Error('不支援的網址庫操作。');
  }
  validateLibrary(lib);return state;
}
