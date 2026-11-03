import {parseSource} from '../media/sources.js?v=2.0-integration-IB.0';
export const OTHER_CATEGORY='category-other';
export function libraryDefaults(){return {
  categories:['國語','數學','英語','自然','社會','藝術','閱讀','晨間活動','其他'].map((name,i)=>({id:i===8?OTHER_CATEGORY:`category-${i}`,name})),
  items:[],preferences:{volume:.5,muted:false,rate:1,repeat:'none',shuffle:false},
  timerLink:{enabled:false,musicId:null,pauseWithTimer:false,musicEnd:'continue',pauseVideoOnEnd:false}
};}
const keys=(value,allowed)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>allowed.includes(key));
export function validateLibrary(library){
  const fail=text=>{throw Error(text||'影音網址庫資料不正確。');};
  if(!keys(library,['categories','items','preferences','timerLink']))fail();
  if(!Array.isArray(library.categories)||!library.categories.length||library.categories.length>50)fail('影音分類需有 1–50 個。');
  const ids=new Set(),names=new Set();
  for(const c of library.categories){if(!keys(c,['id','name'])||typeof c.id!=='string'||!c.id||c.id.length>100||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>40||names.has(c.name.trim().toLocaleLowerCase('zh-TW')))fail('分類名稱需為 1–40 字且不可重複。');ids.add(c.id);names.add(c.name.trim().toLocaleLowerCase('zh-TW'));}
  if(!ids.has(OTHER_CATEGORY))fail('網址庫缺少其他分類。');
  if(!Array.isArray(library.items)||library.items.length>500)fail('影音網址最多 500 筆。');
  const itemIds=new Set();
  for(const item of library.items){
    if(!keys(item,['id','name','kind','source','url','videoId','categoryId','favorite'])||typeof item.id!=='string'||!item.id||item.id.length>100||itemIds.has(item.id)||typeof item.name!=='string'||!item.name.trim()||item.name.length>200||!ids.has(item.categoryId)||typeof item.favorite!=='boolean'||item.source==='local')fail();
    const source=parseSource(item.url,item.kind);if(source.source!==item.source||source.url!==item.url||(source.videoId??null)!==(item.videoId??null))fail('影音網址來源或 YouTube ID 不一致。');itemIds.add(item.id);
  }
  const p=library.preferences;
  if(!keys(p,['volume','muted','rate','repeat','shuffle'])||typeof p.volume!=='number'||!Number.isFinite(p.volume)||p.volume<0||p.volume>1||typeof p.muted!=='boolean'||![.5,.75,1,1.25,1.5,2].includes(p.rate)||!['none','single','all'].includes(p.repeat)||typeof p.shuffle!=='boolean')fail('影音偏好格式不正確。');
  const link=library.timerLink;
  if(!keys(link,['enabled','musicId','pauseWithTimer','musicEnd','pauseVideoOnEnd'])||typeof link.enabled!=='boolean'||typeof link.pauseWithTimer!=='boolean'||typeof link.pauseVideoOnEnd!=='boolean'||!['continue','pause','stop'].includes(link.musicEnd)||(link.musicId!==null&&!library.items.some(item=>item.id===link.musicId&&item.kind==='music'))||(link.enabled&&link.musicId===null))fail('計時影音連動設定不正確，請選擇已保存音樂。');
}
