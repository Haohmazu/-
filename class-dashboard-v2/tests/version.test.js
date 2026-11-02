import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
test('版本清單與 HTML/CSS/所有 JavaScript 完整性一致',async()=>{
 const manifest=JSON.parse(await readFile(new URL('version.json',root),'utf8'));assert.equal(manifest.version,'2.0-stage3.0');assert.equal(manifest.schemaVersion,4);
 for(const [file,hash] of Object.entries(manifest.assets)){assert.equal(createHash('sha256').update(await readFile(new URL(file,root))).digest('hex'),hash,file);}
 const html=await readFile(new URL('index.html',root),'utf8');assert.ok(html.includes('./src/app.js?v='+manifest.version));assert.ok(html.includes('./styles/main.css?v='+manifest.version));assert.ok(!/src="\//.test(html));
});
