(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ToenowHomesConfig=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Local catalogue: the home renderer translates these strings without modifying global i18n.
  const entries={};
  const text=(en,zh)=>(entries[en]=zh,en);
  const gameTitles={
    'number-pop':['Number Pop','數字泡泡'],'ball-track':['Target Track','目標追蹤'],
    'block-match':['Block Match','方塊配對'],'add-up':['Add Up','加總挑戰'],
    'space-scale':['Space Scale','太空天平'],'tap-match':['Tap Match','目標快點'],
    'spot-quick':['Spot Quick','快速辨識'],'shadow-match':['Shadow Match','剪影配對'],
    'flash-brain':['Flash Brain','閃光記憶'],'animal-rescue-train':['Animal Rescue Train','動物救援列車']
  };
  for(const pair of [
    ['Already part of our home.','已經是我們家的一部分了。'],
    ['This is where our next project will go.','下一個建築就蓋在這裡。'],
    ['Home activities','家園活動'],['Find materials','尋找材料'],['Chat','聊聊天']
  ])text(...pair);
  const HOMES={};
  const positions=['patch','greenhouse','stall','pergola'];
  function add(gameId,species,place,playLabel,starterDescription,projects,chat){
    const folder=species==='rabbit'?'assets/rabbit-home':`assets/animal-homes/${species}`;
    HOMES[gameId]={gameId,species,gameTitle:text(...gameTitles[gameId]),place: text(...place),playLabel:text(...playLabel),
      background:`${folder}/background.webp`,character:species==='rabbit'?'assets/rabbit-home/rabbit.webp':`assets/animal-island/${species}-character.webp`,atlas:`${folder}/buildings.webp`,
      starterDescription:text(...starterDescription),talkLabel:text(`Talk to ${species[0].toUpperCase()+species.slice(1)}`,`和${({rabbit:'兔子',otter:'水獺',beaver:'海狸',squirrel:'松鼠',fox:'狐狸',penguin:'企鵝',owl:'貓頭鷹',raccoon:'浣熊',elephant:'大象',panda:'熊貓'})[species]}聊天`),
      projects:projects.map(([id,en,zh],index)=>({id,name:text(en,zh),stage:index+2,sprite:index,position:positions[index]})),
      chat:Object.fromEntries(Object.entries(chat).map(([key,value])=>[key,key==='ambient'?value.map(pair=>text(...pair)):text(...value)]))};
  }
  add('number-pop','rabbit',['Rabbit Harvest Garden','兔子採收園'],['Harvest together','一起採收'],['A small cottage, a starter patch and room to grow.','一間小屋、一片菜地，還有慢慢成長的空間。'],[
    ['vegetable-patch','New vegetable patch','新菜圃'],['greenhouse','Little greenhouse','小溫室'],['harvest-stall','Harvest stall','採收攤位'],['pergola','Garden pergola','花園棚架']
  ],{
    welcome:['Let’s make our little garden beautiful!','一起把小花園變漂亮吧！'],returning:['Welcome back! Shall we grow our garden?','歡迎回來！一起照顧花園吧？'],ready:['Everything is ready. Shall we build together?','材料都準備好了，一起動手吧？'],complete:['Our home is full of little joys. Thank you!','家裡充滿了小小的快樂，謝謝你！'],gameTip:['Playing Number Pop brings carrots back to our garden.','玩數字採收，就能帶胡蘿蔔回花園。'],ambient:[['The seedlings grew a little today.','今天的小苗又長高了一點。'],['A basket of carrots smells like sunshine.','一籃胡蘿蔔，聞起來像陽光。'],['Shall we leave a shady spot for visitors?','留一處陰涼給來訪的朋友吧？'],['Slow mornings are my favorite.','我最喜歡悠閒的早晨。']]
  });
  add('ball-track','otter',['Otter River Shelter','水獺溪流小屋'],['Follow the leaves','追蹤浮葉'],['A riverside shelter and a quiet bank waiting for company.','溪畔的小屋和安靜的河岸，正等朋友來坐坐。'],[
    ['stepping-stones','Stepping stones','溪邊踏石'],['reed-shelter','Reed shelter','蘆葦小棚'],['river-raft-dock','River raft dock','木筏碼頭'],['riverside-gazebo','Riverside gazebo','溪畔涼亭']
  ],{
    welcome:['Come sit by the river. I saved you a smooth pebble!','來溪邊坐坐，我替你留了一顆光滑的小石頭！'],returning:['You’re back! The leaves have been drifting all morning.','你回來了！浮葉已經漂了一整個早晨。'],ready:['The supplies are here. Let’s make our riverbank cozy!','材料到齊了，讓河岸更舒服吧！'],complete:['A dock, a shady seat, and good company. Just right!','有碼頭、有陰涼的座位，還有朋友，剛剛好！'],gameTip:['Follow the floating leaves to find us and bring home shells.','追蹤浮葉找到我們，就能帶貝殼回家。'],ambient:[['That leaf is taking the scenic route.','那片葉子正繞路看風景呢。'],['I found a shell with tiny stripes.','我找到了一枚有細條紋的貝殼。'],['The reeds sound like a little rainstorm.','蘆葦沙沙響，好像下起了小雨。'],['There’s room on this riverbank for both of us.','這片河岸有我們兩個的位子。']]
  });
  add('block-match','beaver',['Beaver Timber Workshop','海狸木作工坊'],['Work with timber','一起做木工'],['A small workshop with fresh timber and space for new ideas.','小工坊裡有新木料，也有實現點子的空間。'],[
    ['work-table','Work table','工作桌'],['tool-shed','Tool shed','工具棚'],['lumber-store','Lumber store','木料倉庫'],['woodwork-pavilion','Woodwork pavilion','木作亭']
  ],{
    welcome:['Welcome to my workshop! What shall we make first?','歡迎來到我的工坊！先做點什麼好呢？'],returning:['Good to see you! I’ve kept our workspace clear.','很高興見到你！工作空間已經收好了。'],ready:['Timber checked, tools ready. Let’s build something sturdy!','木料檢查好了，工具也備齊了，動手蓋吧！'],complete:['Every joint fits. This workshop is ready for our next idea!','每個接合處都剛剛好，工坊準備好迎接新點子了！'],gameTip:['Match my timber blueprint to bring more wood home.','完成木板圖紙，就能帶更多木料回家。'],ambient:[['Measure twice, then take a snack break.','量兩次，再休息吃點心。'],['I like the smell of freshly cut wood.','我喜歡新木料的味道。'],['A good tool deserves its own place.','好工具值得有自己的位子。'],['Even a tiny offcut can become something useful.','小小的邊角木料，也能派上用場。']]
  });
  add('add-up','squirrel',['Squirrel Supply Depot','松鼠補給站'],['Pack nut orders','準備堅果訂單'],['A woodland depot with a little sorting spot and room for supplies.','林間補給站有小小的整理區，還能放更多物資。'],[
    ['sorting-table','Sorting table','分類桌'],['nut-storehouse','Nut storehouse','堅果倉庫'],['delivery-counter','Delivery counter','配送櫃台'],['treetop-canopy','Treetop canopy','樹頂遮棚']
  ],{
    welcome:['You found my depot! Help me keep every nut in order.','你找到補給站了！一起把堅果整理好吧。'],returning:['Back already? Wonderful! I have a fresh supply list.','你回來啦？太好了，我又有新的補給清單了。'],ready:['All accounted for! We can build our next supply stop.','材料全都清點好了！可以蓋下一座補給設施了。'],complete:['Shelves stocked, parcels ready. Everyone can share the harvest!','架子滿了，包裹也好了，大家都能分享收成！'],gameTip:['Add nut bags to match each order and bring nuts home.','湊出訂單需要的堅果總數，就能帶堅果回家。'],ambient:[['I wrote down where I put the emergency acorns.','我把備用橡果放哪裡都記下來了。'],['A tidy basket makes a busy day easier.','籃子整理好，忙起來也輕鬆。'],['One delivery for today, one stash for winter.','一份今天送，一份留過冬。'],['There’s always time to count one more hazelnut.','總有時間再數一顆榛果。']]
  });
  add('space-scale','fox',['Fox Parcel Weighhouse','狐狸秤重小屋'],['Weigh the parcels','一起秤包裹'],['A cozy parcel house with a small weighing corner.','溫馨的包裹小屋，有一個小小的秤重角落。'],[
    ['parcel-sorting-table','Parcel sorting table','包裹分類桌'],['scale-shed','Scale shed','天平小棚'],['parcel-counter','Parcel counter','包裹櫃台'],['ribbon-arch','Ribbon arch','緞帶拱門']
  ],{
    welcome:['Every parcel holds a little mystery. Come investigate!','每個包裹都有小謎題，一起來觀察吧！'],returning:['Welcome back, parcel detective! Let’s check the scales.','歡迎回來，包裹偵探！來看看天平吧。'],ready:['The delivery has arrived. Shall we set up our new parcel corner?','材料送到了，一起布置新的包裹角落吧？'],complete:['A place for every parcel, and a ribbon for every gift!','每個包裹都有位子，每份禮物都有緞帶！'],gameTip:['Read the scales and sort parcels to bring ribbons home.','觀察天平、排好包裹重量，就能帶緞帶回家。'],ambient:[['A big box can hold something very light.','大箱子也可能裝著很輕的東西。'],['This ribbon curls like my tail.','這條緞帶捲得像我的尾巴。'],['A balanced scale tells a useful story.','平衡的天平藏著有用的線索。'],['I wonder who will receive the next gift.','不知道下一份禮物會送給誰。']]
  });
  add('tap-match','penguin',['Penguin Matching Pool','企鵝配對池'],['Match by the pool','池邊玩配對'],['A little poolside home with room to splash and play.','池畔的小家，有玩水和遊戲的空間。'],[
    ['floating-platform','Floating platform','漂浮平台'],['ice-bridge','Ice bridge','冰橋'],['pool-hut','Pool hut','池邊小屋'],['pool-canopy','Pool canopy','池邊遮棚']
  ],{
    welcome:['Splash! You made it. Want to play by the pool?','噗通！你來了，要一起在池邊玩嗎？'],returning:['My favorite pool buddy is back! The water’s lovely.','我的玩水夥伴回來了！今天的水很舒服。'],ready:['Supplies on deck! Let’s give our pool a new play spot.','材料到位！給配對池蓋個新遊樂角吧。'],complete:['A bridge, a hut, and plenty of shade. Pool party time!','有橋、有小屋，還有遮蔭，開玩水派對吧！'],gameTip:['Find the matching pictures to bring fish back to the pool.','找出相配的圖卡，就能帶魚回配對池。'],ambient:[['I practice my best dive before breakfast.','早餐前，我會練習最拿手的跳水。'],['Two matching pictures make a lovely pair.','兩張相同的圖卡，真是好搭檔。'],['That ripple looks like a tiny umbrella.','那圈水波像一把小雨傘。'],['A shady seat is perfect after a swim.','游完泳，最適合坐在陰涼處。']]
  });
  add('spot-quick','owl',['Owl Observation Station','貓頭鷹觀察站'],['Observe together','一起觀察'],['A quiet woodland station with a journal and an open sky.','安靜的林間觀察站，有筆記本，也有開闊的天空。'],[
    ['journal-desk','Journal desk','觀察筆記桌'],['lookout-tower','Lookout tower','瞭望塔'],['stargazing-platform','Stargazing platform','觀星平台'],['woodland-gazebo','Woodland gazebo','林間涼亭']
  ],{
    welcome:['Welcome, fellow observer. What will we notice today?','歡迎，觀察夥伴。今天會發現什麼呢？'],returning:['You’re just in time. I’ve opened a fresh journal page.','你來得正好，我剛翻開新的一頁筆記。'],ready:['Our supplies are gathered. Let’s build a better view.','材料都收齊了，蓋個視野更好的地方吧。'],complete:['From tiny tracks to distant stars, we have a place to observe it all.','從小腳印到遠方星星，我們都有地方好好觀察了。'],gameTip:['Identify the blurry photos to bring feathers back to the station.','辨認模糊照片，就能帶羽毛回觀察站。'],ambient:[['A tiny detail can tell a whole story.','一個小細節，也能說出完整的故事。'],['I leave a blank line for tomorrow’s discoveries.','我留了一行空白，記錄明天的新發現。'],['Listen. Can you hear the leaves turning?','聽，你聽見葉子翻動的聲音了嗎？'],['The first star is easier to see when we pause.','停下來看看，更容易找到第一顆星。']]
  });
  add('shadow-match','raccoon',['Raccoon Shadow Theater','浣熊影子劇場'],['Play with shadows','一起玩影子'],['A woodland theater corner with paper shapes and a little lamp.','林間劇場角落裡，有剪紙和一盞小燈。'],[
    ['paper-work-table','Paper work table','剪紙工作桌'],['puppet-booth','Puppet booth','偶戲小亭'],['shadow-stage','Shadow stage','影子舞台'],['festival-arch','Festival arch','慶典拱門']
  ],{
    welcome:['Step right up! A little paper can become a whole adventure.','快來看！小小的紙片，也能變成一場冒險。'],returning:['My audience is back! I’ve been rehearsing a new shadow.','我的觀眾回來了！我正在排練新的影子戲。'],ready:['Paper, props, and supplies are ready. Let’s set the scene!','紙張、道具和材料都好了，來搭景吧！'],complete:['The stage is ready. There’s a front-row seat just for you!','舞台準備好了，第一排留了一個位子給你！'],gameTip:['Match my moving paper shapes to bring color paper home.','配對移動的剪紙形狀，就能帶色紙回家。'],ambient:[['Move the lamp and the shadow grows tall.','移動燈光，影子就會長高。'],['Today a paper triangle is a mountain.','今天，紙三角形是一座山。'],['Every good show needs a quiet moment too.','精彩的表演，也需要安靜的片刻。'],['Would a moon-shaped ticket be too much?','把票剪成月亮形狀，會不會太誇張？']]
  });
  add('flash-brain','elephant',['Elephant Memory Garden','大象記憶花園'],['Remember the flowerbeds','記住花圃'],['A peaceful garden with a starter flowerbed and familiar paths.','寧靜的花園裡，有小花圃和熟悉的小徑。'],[
    ['new-flowerbed','New flowerbed','新花圃'],['seed-greenhouse','Seed greenhouse','育苗溫室'],['memory-fountain','Memory fountain','回憶噴泉'],['garden-pergola','Garden pergola','花園棚架']
  ],{
    welcome:['Come walk with me. Every flowerbed holds a happy memory.','陪我走走吧，每片花圃都有快樂的回憶。'],returning:['I remember your footsteps. Welcome back to the garden!','我記得你的腳步聲，歡迎回到花園！'],ready:['We have what we need. Let’s plant a new memory here.','材料齊了，在這裡種下一段新回憶吧。'],complete:['Our garden has grown around so many lovely memories.','花園長大了，也收藏了好多美好的回憶。'],gameTip:['Remember the animal flowerbeds and avoid thorns to bring seeds home.','記住動物花圃、避開荊棘，就能帶種子回家。'],ambient:[['That flower opened on the day you first visited.','你第一次來的那天，那朵花剛好開了。'],['A familiar path can still hold a surprise.','熟悉的小路，也會藏著驚喜。'],['I water the smallest sprouts first.','我會先替最小的嫩芽澆水。'],['I dream of a fountain with a gentle lullaby.','想蓋一座噴泉，聽它唱輕柔的搖籃曲。']]
  });
  add('animal-rescue-train','panda',['Panda Rescue Station','熊貓救援車站'],['Help animals board','幫動物上車'],['A small woodland station waiting to welcome every passenger.','林間的小車站，正等著迎接每一位乘客。'],[
    ['waiting-bench','Waiting bench','候車長椅'],['ticket-shelter','Ticket shelter','售票小棚'],['rescue-storehouse','Rescue storehouse','救援倉庫'],['platform-canopy','Platform canopy','月台遮棚']
  ],{
    welcome:['Welcome to the station! Let’s help every animal travel safely.','歡迎來到車站！一起讓每隻動物安心出發吧。'],returning:['There you are! I saved you a spot beside the timetable.','你來啦！時刻表旁邊留了你的位子。'],ready:['The supplies have arrived. Let’s make this station more welcoming.','材料運到了，讓車站更溫馨吧。'],complete:['Comfy seats and a sheltered platform. All aboard when you’re ready!','座椅舒服，月台也有遮蔭，準備好就上車吧！'],gameTip:['Help every animal board safely to bring bamboo back to the station.','幫每隻動物安全上車，就能帶竹子回車站。'],ambient:[['A calm queue makes a happier journey.','好好排隊，旅程就更愉快。'],['I always check that no passenger is left behind.','我總會確認沒有乘客被留下。'],['The next train has room for a new story.','下一班列車，又會帶來新的故事。'],['Bamboo snacks make the wait feel shorter.','吃點竹子點心，等車也變快了。']]
  });
  function get(id){return Object.prototype.hasOwnProperty.call(HOMES,id)?HOMES[id]:null;}
  return {HOMES,get,entries};
});
