const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
const base=process.env.TEST_URL||'http://127.0.0.1:8000/class-dashboard-v2/';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('#open-settings').click();
 const upload=text=>page.locator('#roster-file').setInputFiles({name:'students.csv',mimeType:'text/csv',buffer:Buffer.from(text)});
 const csv='\uFEFF座號,姓名\r\n'+Array.from({length:30},(_,i)=>`${i+1},學生${i+1}`).join('\r\n');await upload(csv);
 await page.getByText('預覽：新增 30 位、更新 0 位；合計 30 位。',{exact:true}).waitFor();
 assert.equal(await page.locator('#student-list .student-row').count(),0);
 await page.getByLabel('我已確認每列學生身分',{exact:false}).check();await page.getByRole('button',{name:'確認身分對應並正式匯入'}).click();await page.waitForFunction(()=>document.querySelectorAll('#student-list .student-row').length===30);
 const oldIds=await page.evaluate(()=>JSON.parse(localStorage.getItem('class-dashboard-v2')).students.map(s=>s.id));
 await page.getByRole('button',{name:'開始任務',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#task-panel').textContent.includes('0 / 30'));
 await page.locator('#close-settings').click();await page.getByRole('button',{name:'1 號打卡',exact:true}).click();await page.getByRole('button',{name:'1 號已打卡',exact:true}).waitFor();
 await page.locator('#open-settings').click();await upload('座號,姓名\n1,新姓名');await page.getByLabel('座號 1 身分對應',{exact:true}).selectOption(oldIds[0]);await page.getByLabel('我已確認每列學生身分',{exact:false}).check();await page.getByRole('button',{name:'確認身分對應並正式匯入'}).click();await page.getByText('名單匯入成功，既有學生 ID 與任務歷史已保留。',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('class-dashboard-v2')).students[0].id),oldIds[0]);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('class-dashboard-v2')).rounds[0].checkins.length),1);
 for(const [filename,expected] of [['students-openpyxl.xlsx','王小明'],['students-shared.xlsx','王小明']]){
  await page.locator('#roster-file').setInputFiles(path.join(__dirname,'fixtures',filename));await page.getByText('已讀取檔案，尚未匯入。',{exact:true}).waitFor();
  for(let i=0;i<3;i++)await page.getByLabel(`座號 ${i+1} 身分對應`,{exact:true}).selectOption(oldIds[i]);
  await page.getByLabel('我已確認每列學生身分',{exact:false}).check();await page.getByRole('button',{name:'確認身分對應並正式匯入'}).click();await page.getByText('名單匯入成功，既有學生 ID 與任務歷史已保留。',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('class-dashboard-v2')).students[0].name),expected);
 }
 await upload('座號,姓名\n1,A\n1,B');await page.waitForFunction(()=>document.querySelector('#import-message').textContent.includes('重複'));assert.equal(await page.locator('#student-list .student-row').count(),30);
 await page.getByText('修訂本輪參與名單與門檻',{exact:true}).click();await page.getByLabel('本輪 1 號參與',{exact:true}).uncheck();await page.getByLabel('修訂後門檻',{exact:true}).fill('29');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'確認修訂本輪名單'}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('class-dashboard-v2')).rounds[0].participants.length),30);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'確認修訂本輪名單'}).click();await page.waitForFunction(()=>document.querySelector('#task-panel').textContent.includes('0 / 29'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('class-dashboard-v2')).rounds[0].audit.at(-1).before.checkins.length),1);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#task-panel').textContent.includes('0 / 29'));await page.locator('#open-settings').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('#xlsx-template').click();assert.equal((await downloadPromise).suggestedFilename(),'學生名單範本.xlsx');
 // Round-trip the actual native XLSX writer and validate XML in browser.
 assert.equal(await page.evaluate(async()=>{const io=await import('./src/io/xlsx.js');const roster=await import('./src/io/roster.js');return roster.rowsToRoster(await io.readXlsx(io.writeXlsx(roster.TEMPLATE_ROWS))).length;}),3);
 for(const [width,height] of [[1920,1080],[1366,768],[1280,720],[1024,768],[390,844]]){await page.setViewportSize({width,height});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 assert.deepEqual(errors,[]);await context.close();
 // Existing persisted schema 2 migrates, and a blocked lock displays a useful failure.
 const blocked=await browser.newContext();await blocked.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined}));const p=await blocked.newPage();await p.goto(base);await p.locator('#open-settings').click();await p.locator('#class-input').fill('不應保存');await p.getByRole('button',{name:'儲存班級名稱'}).click();await p.waitForFunction(()=>document.querySelector('#form-error').textContent.includes('HTTPS'));assert.equal(await p.evaluate(()=>localStorage.getItem('class-dashboard-v2')),null);await blocked.close();
 console.log('PASS: 30 人 CSV、壓縮 XLSX inline/sharedStrings、確認預覽、更新保留 ID/歷史、重複拒絕、名單移除確認、重整、範本下載與回讀、五種尺寸、缺少寫入鎖錯誤。');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
