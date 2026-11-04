import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const version='2.0-ID.0';
async function walk(folder){const files=[];for(const entry of await readdir(path.join(root,folder),{withFileTypes:true})){const name=path.posix.join(folder,entry.name);if(entry.isDirectory())files.push(...await walk(name));else files.push(name);}return files;}
const sources=(await walk('src')).filter(name=>name.endsWith('.js')).sort();
for(const file of sources){let text=await readFile(path.join(root,file),'utf8');text=text.replace(/(from\s+['"]\.{1,2}\/[^'"?]+\.js)(?:\?v=[^'"]+)?(['"])/g,`$1?v=${version}$2`);await writeFile(path.join(root,file),text);}
let html=await readFile(path.join(root,'index.html'),'utf8');html=html.replace(/(\.\/styles\/[a-z-]+\.css|\.\/src\/app.js)(?:\?v=[^"\s]+)?/g,`$1?v=${version}`);await writeFile(path.join(root,'index.html'),html);
const assets={};for(const file of ['index.html',...(await walk('styles')).filter(name=>name.endsWith('.css')).sort(),...sources,...(await walk('assets/visual')).filter(name=>name.endsWith('.svg')).sort()])assets[file]=createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
await writeFile(path.join(root,'version.json'),JSON.stringify({version,schemaVersion:8,assets},null,2)+'\n');
console.log(`Version manifest: ${version}, ${Object.keys(assets).length} assets`);
