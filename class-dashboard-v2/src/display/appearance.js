// Only predefined IDs are persisted. Colors and CSS are never accepted from backups.
export const STYLES=[
 {id:'playful',name:'低年級童趣',icon:'✿',description:'雲朵草地、原創人物貼紙與彩色膠囊卡片',palettes:[['candy','彩虹糖果','#d9efff','#ffffff','#18345b','#506782','#315b9a'],['ocean','海洋冒險','#e8f7ff','#ffffff','#163e53','#426b7f','#126c90'],['forest','森林樂園','#edf8df','#ffffff','#294322','#526b43','#38731f']]},
 {id:'study',name:'中年級活潑學習',icon:'✎',description:'教室窗景、書架、紙張標籤與閱讀人物',palettes:[['sun','陽光校園','#edf8ff','#ffffff','#213d55','#526d7d','#a52e62'],['mint','薄荷創意','#e5faf2','#ffffff','#1c463c','#486f64','#14725c'],['berry','莓果活力','#fbeaf4','#ffffff','#4b2946','#76516e','#99376f']]},
 {id:'fresh',name:'高年級清新資訊',icon:'◈',description:'校園山丘、四欄資訊網格與書本文具',palettes:[['sky','天空青綠','#eaf5f8','#ffffff','#1b3c4a','#496b79','#126d7a'],['cream','奶油暖橘','#fff4e8','#ffffff','#4c3726','#79604b','#9c5017'],['sage','鼠尾草綠','#edf3e8','#ffffff','#30422d','#5c7055','#466a34']]},
 {id:'tech',name:'青少年科技',icon:'⌘',description:'側邊捷徑、儀表弧鐘、幾何地形與數學工具',palettes:[['electric','霓虹電光','#071322','#101f32','#e7faff','#a5cad5','#5de0ff'],['cyber','賽博紫夜','#170e2a','#271b3c','#f4ecff','#d0b9e8','#d7a0ff'],['aurora','極光綠黑','#061b16','#102e25','#e5fff4','#a2d3be','#65edb0']]},
 {id:'minimal',name:'極簡專業',icon:'▤',description:'單色線圖、四欄資訊與平靜工具列',palettes:[['warm','暖白灰階','#f4f2ed','#ffffff','#33312c','#68645c','#615b4d'],['cool','冷白藍灰','#edf1f6','#ffffff','#28394b','#56687b','#425f80'],['graphite','深灰極簡','#202326','#2d3135','#f6f7f8','#c0c8cf','#bfcedc']]},
 {id:'elegant',name:'華麗展示',icon:'✧',description:'拱窗櫻花、金色弧鐘、書本燈籠與琉璃卡片',palettes:[['royal-purple','紫金星夜','#21152f','#332440','#fff5dc','#d9c6e4','#f1ce88'],['royal-blue','皇家藍金','#0c213c','#193553','#fff7e5','#bdcde0','#f0cb7c'],['sakura','櫻花琉璃','#fff0f4','#fffafb','#542c47','#7e5971','#a43870']]}
];
export function appearanceDefaults(){return {style:'legacy',palette:'default'};}
export function validateAppearance(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['style','palette'].includes(k))||!(value.style==='legacy'&&value.palette==='default'||STYLES.some(s=>s.id===value.style&&s.palettes.some(p=>p[0]===value.palette))))throw Error('外觀風格與配色組合不正確。');return value;
}
export function applyAppearanceCommand(state,c){state.appearance=structuredClone(validateAppearance(c.appearance));return state;}
export function contrast(a,b){const lum=c=>{const v=c.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function darken(color){return '#'+color.slice(1).match(/../g).map(v=>Math.floor(parseInt(v,16)*.8).toString(16).padStart(2,'0')).join('');}
export function appearanceTokens(choice,theme){
 validateAppearance(choice);if(choice.style==='legacy')return null;
 let [, ,page,card,text,muted,accent]=STYLES.find(s=>s.id===choice.style).palettes.find(p=>p[0]===choice.palette);
 if(theme==='contrast')return {page:'#000000',card:'#000000',text:'#ffffff',muted:'#ffffff',border:'#ffffff',surface:'#111111',clock:'#000000',accent:'#ffe600',error:'#ffbaba',feedback:'#ffe600','button-text':'#000000'};
 if(theme==='light'&&contrast(text,'#ffffff')<4.5){page='#edf3f6';card='#ffffff';text='#173746';muted='#506675';while(contrast(accent,card)<4.5)accent=darken(accent);}
 const buttonText=contrast(accent,'#ffffff')>=contrast(accent,'#000000')?'#ffffff':'#000000';
 return {page,card,text,muted,border:muted,surface:card,clock:card,accent,error:contrast('#ab2424',card)>=4.5?'#ab2424':'#ffbaba',feedback:accent,'button-text':buttonText};
}
