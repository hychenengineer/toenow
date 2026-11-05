// Idempotent source integration for the approved animal-island catalogue.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const themes=require('../shared/toenow-animals.js').THEMES;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s.replace(/\r\n/g,'\n'));
const extra={
 'Supply order':'補給訂單',
 'PICK THE LOWEST BASKET':'先選最小數值的籃子',
 'Choose the parcel with the MOST weight':'選擇最重的包裹',
 'Choose the parcel with the LEAST weight':'選擇最輕的包裹',
 'Choose the MIDDLE parcel (not heaviest, not lightest)':'選擇重量居中的包裹（不是最重或最輕）',
 'FILED ✓':'已歸檔 ✓',
 'Violet striped parcel':'紫色條紋包裹','Blue dotted parcel':'藍色圓點包裹','Green checked parcel':'綠色格紋包裹',
 'Amber striped parcel':'琥珀條紋包裹','Amber checked parcel':'琥珀格紋包裹','Rose dotted parcel':'玫瑰圓點包裹','Sealed mystery parcel':'密封神祕包裹',
 'Remember the otters, follow the floating leaves, then find their hiding places.':'記住水獺，追蹤漂流葉片，再找出牠們躲藏的位置。',
 'Help the beaver carve timber to match the blueprint. Remove only extra pieces; watch for mirrored plans.':'幫海狸依圖紙排列木板。只移除多餘木塊，留意翻轉的圖紙。',
 'Help the raccoon choose the puppets making the moving shadows. Match every shape, including tricky overlaps.':'幫浣熊找出形成移動影子的剪紙，辨認每種形狀與重疊輪廓。',
 'Animal island':'動物小島','ANIMAL FRIENDS / NEW DISCOVERIES':'動物夥伴 / 全新發現',
 'An island of animals. A world to discover.':'一座動物小島，一起探索新發現。',
 'Meet your animal friends. Help with their challenges and watch their homes grow.':'認識動物夥伴，完成牠們的挑戰，看著家園慢慢成長。',
 'Animal homes grow with your highest level reached in normal play. Practice runs do not advance the island.':'動物家園依一般遊玩的最高等級成長，練習模式不會提升家園等級。',
 'Size does not reveal weight. Use the scales to compare the parcels.':'包裹大小不代表重量，請依天平線索比較。',
 'Follow the hidden otters. Their leaves look identical until they are revealed.':'追蹤躲藏的水獺，揭曉前每片浮葉外觀都相同。',
 'Remember animal flowerbeds. Tap priority beds first and avoid thorn beds.':'記住動物花圃，優先點選提示花圃，避開荊棘花圃。'
};
for(const t of Object.values(themes)){extra[t.place]=t.placeZh;extra[t.task]=t.taskZh;}
write('shared/toenow-i18n-animals.js',`(function(root){'use strict';const entries=${JSON.stringify(extra,null,2)};const patterns=[[/^(\\d+) BASKETS? LEFT$/,n=>\`剩餘 \${n} 個採收籃\`]];if(typeof module==='object'&&module.exports)module.exports={entries,patterns};else(root.ToenowI18nCatalogs||=[]).push({entries,patterns});})(globalThis);\n`);
for(const p of ['index.html',...Object.keys(themes).map(id=>`games/${id}/index.html`)]){
 let html=read(p),prefix=p==='index.html'?'':'../../';
 if(!html.includes('toenow-i18n-animals.js'))html=html.replace(`<script src="${prefix}shared/toenow-i18n.js"></script>`,`<script src="${prefix}shared/toenow-i18n-animals.js"></script>\n<script src="${prefix}shared/toenow-i18n.js"></script>`);
 if(!html.includes('toenow-animals.js'))html=html.replace(`<script src="${prefix}shared/toenow-i18n.js"></script>`,`<script src="${prefix}shared/toenow-i18n.js"></script>\n<script src="${prefix}shared/toenow-animals.js"></script>`);
 if(!html.includes('toenow-animals.css'))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}assets/toenow-animals.css">\n</head>`);
 if(p==='games/flash-brain/index.html'&&!html.includes('src="./garden.js"'))html=html.replace('<script type="module"','<script src="./garden.js"></script>\n    <script type="module"');
 write(p,html);
}
const catalog=require('../shared/toenow-screen-config.js');
for(const [id,c] of Object.entries(catalog)){
 c.description=themes[id].task;c.icon=themes[id].icon;c.animalSpecies=themes[id].species;c.rules[0].text=themes[id].task;
 if(id==='space-scale')c.rules[1].text='Size does not reveal weight. Use the scales to compare the parcels.';
 if(id==='ball-track')c.rules[1].text='Follow the hidden otters. Their leaves look identical until they are revealed.';
 if(id==='flash-brain')c.rules[1].text='Remember animal flowerbeds. Tap priority beds first and avoid thorn beds.';
}
write('shared/toenow-screen-config.js',`// Data only. The shared renderer owns every title and result template.\n(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ToenowScreenConfig=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){return ${JSON.stringify(catalog,null,2)};});\n`);
let hub=read('index.html');
for(const [id,t] of Object.entries(themes)){
 const start=hub.indexOf(`id: '${id}'`,hub.indexOf('const GAMES_CONFIG'));
 const end=hub.indexOf('\n      }',start);
 const old=hub.slice(start,end);
 const updated=old.replace(/description: '[^\n]*'/,`description: ${JSON.stringify(t.task)}`);
 hub=hub.slice(0,start)+updated+hub.slice(end);
}
write('index.html',hub);
const pkg=JSON.parse(read('package.json'));
for(const name of ['toenow-animals','animal-numeric-theme','animal-spatial','animal-recognition','animal-island-art']){
 const f=`tests/${name}.test.cjs`;if(!pkg.scripts.test.includes(f))pkg.scripts.test+=' '+f;
}
write('package.json',JSON.stringify(pkg,null,2)+'\n');
console.log('Integrated ten animal themes, shared includes, catalogues and test registration.');
