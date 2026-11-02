const ID=/^[A-Za-z0-9_-]{11}$/;
const YOUTUBE=new Set(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','www.youtu.be','www.youtube-nocookie.com','youtube-nocookie.com']);
export function parseSource(value,kind){
  if(!['music','video'].includes(kind))throw Error('媒體類型不正確。');
  if(typeof value!=='string'||!value.trim()||value.length>4096)throw Error('請輸入有效的 HTTPS 媒體網址（最多 4096 字元）。');
  let url;try{url=new URL(value.trim());}catch{throw Error('網址格式不正確，請包含 https://。');}
  if(url.protocol!=='https:'||url.username||url.password)throw Error('線上來源只接受不含帳號密碼的 HTTPS 網址。');
  if(YOUTUBE.has(url.hostname)){
    if(kind!=='video')throw Error('YouTube 影片請切換到影片分頁，以官方播放器開啟；不提供音訊擷取。');
    let id;
    if(url.hostname.endsWith('youtu.be'))id=url.pathname.split('/')[1];
    else if(url.pathname==='/watch')id=url.searchParams.get('v');
    else if(/^\/(shorts|embed|live)\//.test(url.pathname))id=url.pathname.split('/')[2];
    if(!id||!ID.test(id)||url.port)throw Error('無法辨識 YouTube 影片 ID，請檢查網址。');
    return {kind,source:'youtube',videoId:id,url:`https://www.youtube.com/watch?v=${id}`};
  }
  return {kind,source:'direct',url:url.href};
}
export function youtubeEmbed(videoId){
  if(!ID.test(videoId))throw Error('YouTube 影片 ID 不正確。');
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&playsinline=1&rel=0`;
}
export function validateItem(item){
  if(!item||typeof item.id!=='string'||!item.id||typeof item.name!=='string'||!item.name.trim()||item.name.length>200)throw Error('媒體名稱或 ID 不正確。');
  if(item.source==='local'){
    if(!['music','video'].includes(item.kind)||typeof item.url!=='string'||!item.url.startsWith('blob:'))throw Error('本機檔案來源不正確。');return;
  }
  const parsed=parseSource(item.url,item.kind);
  if(parsed.source!==item.source||(parsed.source==='youtube'&&parsed.videoId!==item.videoId))throw Error('媒體來源不一致。');
}
export function mediaError(error){
  const code=error?.code;
  return ({1:'媒體載入已中止。',2:'媒體網路載入失敗。請檢查連線、網址及來源是否允許瀏覽器存取。',3:'無法解碼此檔案。請確認實際編碼受 Chrome／Edge 支援。',4:'無法載入來源：可能是網址失效、來源拒絕存取或格式不支援。'})[code]||'無法播放此媒體，請檢查檔案格式或來源網址。';
}
