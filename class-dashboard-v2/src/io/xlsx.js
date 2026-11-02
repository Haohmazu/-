import {zipStore,unzipXlsx} from './zip.js?v=2.0-stage2.1';
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function writeXlsx(rows){
 const worksheet=`<worksheet xmlns="${NS}"><sheetData>${rows.map((row,i)=>`<row r="${i+1}">${row.map((value,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
 return zipStore({
 '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
 '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':`<workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="學生名單" sheetId="1" r:id="rId1"/></sheets></workbook>`,
 'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/worksheets/sheet1.xml':worksheet});
}
function xml(text){if(typeof text!=='string'||/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XLSX XML 格式不安全或缺少必要檔案。');const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('XLSX XML 損壞。');return doc;}
const elements=(node,name)=>[...node.getElementsByTagNameNS('*',name)];
export async function readXlsx(buffer){
 const files=await unzipXlsx(buffer),workbook=xml(files['xl/workbook.xml']),rels=xml(files['xl/_rels/workbook.xml.rels']);
 const sheet=elements(workbook,'sheet')[0];if(!sheet)throw Error('找不到工作表。');
 const id=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
 const rel=elements(rels,'Relationship').find(r=>r.getAttribute('Id')===id);
 if(!rel||rel.getAttribute('TargetMode')==='External')throw Error('工作表連結不合法。');
 const target=rel.getAttribute('Target'),path=target?.startsWith('/xl/')?target.slice(1):`xl/${target}`;
 if(!path||path.includes('..'))throw Error('工作表路徑不合法。');
 const doc=xml(files[path]),shared=files['xl/sharedStrings.xml']?elements(xml(files['xl/sharedStrings.xml']),'si').map(si=>elements(si,'t').map(t=>t.textContent).join('')):[];
 if(elements(doc,'mergeCell').length)throw Error('不支援合併儲存格，請使用下載的標準範本。');
 const rows=[];
 for(const row of elements(doc,'row')){
  if(rows.length>51)throw Error('學生不可超過 50 位。');const values=[];
  for(const c of elements(row,'c')){
   const ref=/^([A-Z]+)([1-9]\d*)$/.exec(c.getAttribute('r')||'');if(!ref)throw Error('儲存格位置錯誤。');
   if(elements(c,'f').length)throw Error('名單不可包含公式，請先貼上為值。');
   const type=c.getAttribute('t');if(type==='e'||type==='b')throw Error('名單包含錯誤值或布林值。');
   let value=elements(c,'v')[0]?.textContent??'';
   if(type==='s'){if(!/^\d+$/.test(value)||shared[Number(value)]===undefined)throw Error('XLSX 共用字串錯誤。');value=shared[Number(value)];}
   if(type==='inlineStr')value=elements(c,'t').map(t=>t.textContent).join('');
   if(ref[1]!=='A'&&ref[1]!=='B'){if(value.trim())throw Error('工作表只能包含座號及姓名兩欄。');continue;}
   values[ref[1]==='A'?0:1]=value;
  }
  if(values.some(v=>String(v).trim()))rows.push([values[0]??'',values[1]??'']);
 }
 return rows;
}
