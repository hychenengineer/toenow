const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8770';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1100, 390]) for (const lang of ['en', 'zh-Hant']) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        localStorage.setItem('toenow_tutorial_space-scale_v2', 'completed');
        window.__scaleDrawing = { labels: [], offCenter: 0, checked: 0 };
        const proto = CanvasRenderingContext2D.prototype;
        const move = proto.moveTo, line = proto.lineTo, arc = proto.arc, text = proto.fillText;
        proto.moveTo = function(x, y) { if (this.strokeStyle === '#94a3b8') this.__beam = [x, y]; return move.call(this, x, y); };
        proto.lineTo = function(x, y) { if (this.strokeStyle === '#94a3b8' && this.__beam) this.__beamEnd = [x, y]; return line.call(this, x, y); };
        proto.arc = function(x, y, r, start, end, ...rest) {
          if (this.strokeStyle === '#38bdf8' && start === 0 && end === Math.PI * 2 && this.__beamEnd) {
            __scaleDrawing.checked++;
            if (Math.abs(x - (this.__beam[0] + this.__beamEnd[0]) / 2) > .01 || Math.abs(y - (this.__beam[1] + this.__beamEnd[1]) / 2) > .01) __scaleDrawing.offCenter++;
          }
          return arc.call(this, x, y, r, start, end, ...rest);
        };
        proto.fillText = function(value, ...args) { if (/ARM|力臂|1×|2×/.test(String(value))) __scaleDrawing.labels.push(value); return text.call(this, value, ...args); };
      });
      let js = fs.readFileSync(path.join(__dirname, '../games/space-scale/main.js'), 'utf8');
      const end = js.lastIndexOf('})();');
      js = js.slice(0, end) + `window.__equalScales={start:w=>startNewGame(w,true),state:()=>({score,puzzle:currentPuzzle})};` + js.slice(end);
      await page.route('**/games/space-scale/main.js*', r => r.fulfill({ contentType: 'application/javascript', body: js }));
      await page.goto(base + '/games/space-scale/');
      await page.evaluate(lang => ToenowI18n.setLanguage(lang), lang);
      for (const wave of [1, 6, 11, 16, 21]) {
        await page.evaluate(wave => __equalScales.start(wave), wave);
        await page.waitForTimeout(250);
        const { puzzle } = await page.evaluate(() => __equalScales.state());
        assert.ok(puzzle.scales.every(s => s.leftDistance === 1 && s.rightDistance === 1 && s.type === 'simple'));
        const drawing = await page.evaluate(() => __scaleDrawing);
        assert.ok(drawing.checked > 0, 'actual canvas beam geometry checked');
        assert.equal(drawing.offCenter, 0, 'pivot always bisects the beam');
        assert.deepEqual(drawing.labels, [], 'no arm multipliers drawn');
        if (wave === 6 || wave === 21) {
          fs.mkdirSync(path.join(__dirname, '../artifacts/equal-scales'), { recursive: true });
          await page.screenshot({ path: path.join(__dirname, `../artifacts/equal-scales/${width}-${lang}-${wave}.png`) });
        }
        await page.keyboard.press(String(puzzle.bodies.find(b => b.id === puzzle.targetBodyId).keyIndex));
        assert.ok((await page.evaluate(() => __equalScales.state())).score > 0, 'correct deduction scores');
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${width} ${lang}: all 5 tiers, equal canvas arms, no multipliers, correct answers`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
