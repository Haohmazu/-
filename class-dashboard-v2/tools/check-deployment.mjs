import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile(new URL('../version.json',import.meta.url),'utf8'));
const base=new URL(process.argv[2]||'https://haohmazu.github.io/-/class-dashboard-v2/');
let mismatch=false;
try {
 for(const [file,expected] of Object.entries(manifest.assets)){
  const url=new URL(file,base);url.searchParams.set('verify',String(Date.now()));
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok){console.log(`${file}: HTTP ${response.status}，不一致`);mismatch=true;continue;}
  const actual=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
  console.log(`${file}: ${actual===expected?'一致':'不一致'} (${actual})`);if(actual!==expected)mismatch=true;
 }
 console.log(mismatch?'部署內容與此開發版不一致。':`所有 HTML/CSS/JS 均與 ${manifest.version} 一致。`);
 process.exitCode=mismatch?1:0;
}catch(error){console.error(`部署版本未能確認：${error.message}。這不是部署成功或失敗的證據。`);process.exitCode=2;}
