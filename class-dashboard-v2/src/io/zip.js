// Bounded ZIP subset for XLSX: no encryption, ZIP64, multi-disk or arbitrary extraction.
const encoder=new TextEncoder(),decoder=new TextDecoder();
export function crc32(data){let crc=0xffffffff;for(const b of data){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
const concat=parts=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
export function zipStore(files){
 const locals=[],central=[];let offset=0;
 for(const [name,text] of Object.entries(files)){
  const path=encoder.encode(name),data=encoder.encode(text),crc=crc32(data),local=new Uint8Array(30),lv=new DataView(local.buffer);
  lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,path.length,true);
  locals.push(local,path,data);const entry=new Uint8Array(46),v=new DataView(entry.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,path.length,true);v.setUint32(42,offset,true);central.push(entry,path);offset+=30+path.length+data.length;
 }
 const directory=concat(central),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,Object.keys(files).length,true);v.setUint16(10,Object.keys(files).length,true);v.setUint32(12,directory.length,true);v.setUint32(16,offset,true);return concat([...locals,directory,end]);
}
export async function unzipXlsx(input){
 const bytes=new Uint8Array(input);if(bytes.length>2*1024*1024||bytes.length<22)throw Error('XLSX 檔案大小不合法（上限 2 MB）。');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===bytes.length){end=i;break;}
 if(end<0||v.getUint16(end+4,true)||v.getUint16(end+6,true))throw Error('不支援的 XLSX ZIP 格式。');
 const count=v.getUint16(end+10,true),directorySize=v.getUint32(end+12,true);let pos=v.getUint32(end+16,true),total=0;
 if(count>128||pos+directorySize!==end)throw Error('XLSX 結構超出限制。');
 const directoryEnd=end,files={};
 for(let i=0;i<count;i++){
  if(pos+46>directoryEnd||v.getUint32(pos,true)!==0x02014b50)throw Error('XLSX ZIP 目錄損壞。');
  const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),crc=v.getUint32(pos+16,true),packed=v.getUint32(pos+20,true),size=v.getUint32(pos+24,true),n=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),offset=v.getUint32(pos+42,true);
  if(pos+46+n+extra+comment>directoryEnd)throw Error('XLSX 目錄損壞。');
  const name=decoder.decode(bytes.subarray(pos+46,pos+46+n));pos+=46+n+extra+comment;total+=size;
  if(flags&1||![0,8].includes(method)||total>8*1024*1024||size>2*1024*1024||name.includes('..')||name.startsWith('/')||Object.hasOwn(files,name))throw Error('XLSX 包含不支援或超限內容。');
  if(offset+30>directoryEnd||v.getUint32(offset,true)!==0x04034b50)throw Error('XLSX 區塊損壞。');
  const start=offset+30+v.getUint16(offset+26,true)+v.getUint16(offset+28,true);if(start+packed>directoryEnd)throw Error('XLSX 區塊超出範圍。');
  if(/vbaProject|externalLinks/i.test(name))throw Error('不支援巨集或外部連結工作簿。');
  const data=bytes.subarray(start,start+packed);let out=data;
  if(method===8){
   if(typeof DecompressionStream==='undefined')throw Error('此瀏覽器不支援 XLSX 解壓縮，請更新 Chrome/Edge 或改用 CSV。');
   const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),chunks=[];let length=0;
   try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>size||length>2*1024*1024){await reader.cancel();throw Error('XLSX 解壓縮超出限制。');}chunks.push(value);}}finally{reader.releaseLock();}
   out=concat(chunks);
  }
  if(out.length!==size||crc32(out)!==crc)throw Error('XLSX 檔案校驗失敗。');files[name]=decoder.decode(out);
 }
 if(pos!==directoryEnd)throw Error('XLSX 目錄長度不正確。');return files;
}
