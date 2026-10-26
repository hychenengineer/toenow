const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { LOCATIONS } = require('../shared/toenow-island.js');
const values = {};
const journey = require('../shared/toenow-exploration.js').create({
  storage: { getItem: k => values[k] ?? null, setItem: (k,v) => values[k] = String(v) },
  levels: require('../shared/toenow-levels.js'), gameIds: LOCATIONS.map(l => l.gameId)
});
journey.chooseGuest();
for (const id of journey.snapshot().order.slice(0,-1)) journey.complete({gameId:id,wave:6});
journey.dismissDiscovery();
const base = 'http://127.0.0.1:55639';
(async () => {
  console.log('Launching UI verification browser');
  const browser = await chromium.launch({channel:'msedge',headless:true});
  let standalone=0, embedded=0;
  try {
    for (const width of [1100,390]) {
      const context = await browser.newContext({viewport:{width,height:900}});
      await context.route('https://**', route => route.abort());
      await context.addInitScript(state => {
        localStorage.setItem('toenow_exploration_v3',JSON.stringify(state));
        localStorage.setItem('toenow_language_v1','zh-Hant');
      }, journey.snapshot());
      const page = await context.newPage();
      const errors=[];
      page.on('pageerror', e => errors.push(e.message));
      for (const {gameId:id} of LOCATIONS) {
        console.log(`Checking standalone ${width}px ${id}`);
        await page.goto(`${base}/games/${id}/`,{waitUntil:'domcontentloaded'});
        console.log(await page.evaluate(() => ({lang:document.documentElement.lang,api:!!window.ToenowI18n,saved:localStorage.getItem('toenow_language_v1')})));
        await page.waitForFunction(() => window.ToenowI18n && document.documentElement.lang==='zh-Hant',null,{timeout:10000});
        assert.equal(await page.locator('.toenow-language-switch').count(),0,id+' standalone switch');
        await page.evaluate(() => ToenowI18n.setLanguage('en',false));
        assert.equal(await page.locator('html').getAttribute('lang'),'en');
        assert.equal(await page.locator('.toenow-language-switch').count(),0);
        standalone++;
      }
      console.log(`Checking Hub ${width}px`);
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.locator('.island-location').first().waitFor();
      assert.equal(await page.locator('.toenow-language-switch').count(),1,'Hub keeps selector');
      assert.equal(await page.locator('#theaterUrl,.theater-game-url').count(),0,'No path badge');
      for (const {gameId:id} of LOCATIONS) {
        await page.locator('#islandLocationSelect').selectOption(id);
        await page.locator('.island-play-button').click();
        await page.locator('#theaterModal.open').waitFor();
        const frame = page.locator('#gameViewer').contentFrame();
        await frame.locator('html[lang="zh-Hant"]').waitFor({state:'attached'});
        assert.equal(await frame.locator('.toenow-language-switch').count(),0,id+' embedded switch');
        assert.equal(await page.locator('#theaterModal').innerText().then(t=>t.includes('index.html')),false);
        await page.evaluate(() => ToenowI18n.setLanguage('en',false));
        // A persisted Hub selection broadcasts to its running iframe.
        await page.evaluate(() => ToenowI18n.setLanguage('zh-Hant'));
        await page.evaluate(() => ToenowI18n.setLanguage('en'));
        await frame.locator('html[lang="en"]').waitFor({state:'attached'});
        await page.evaluate(() => ToenowI18n.setLanguage('zh-Hant'));
        await frame.locator('html[lang="zh-Hant"]').waitFor({state:'attached'});
        if(width===390 && id==='number-pop') await page.screenshot({path:'artifacts/game-ui-cleanup-number-pop-mobile.png'});
        await page.locator('#closeTheaterBtn').click();
        embedded++;
        console.log(`PASS ${width}px ${id}: standalone/iframe without switch, no URL badge, language inheritance/sync`);
      }
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log(JSON.stringify({standalone,embedded,errors:0}));
  } finally { await browser.close(); }
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1)});
