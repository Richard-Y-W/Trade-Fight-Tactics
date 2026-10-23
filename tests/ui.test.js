import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';

test('company UI recruits, deploys, locks, trades, shows an inline result, and advances',async()=>{
  const window = new Window({url:'http://localhost:5173'});
  window.document.write(await readFile(new URL('../index.html',import.meta.url),'utf8'));
  const originals = {window:globalThis.window, document:globalThis.document,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,setTimeout:globalThis.setTimeout};
  let nextTick;
  globalThis.window=window; globalThis.document=window.document;
  globalThis.setInterval=fn=>{ nextTick=fn; return 1; };
  globalThis.clearInterval=()=>{};
  globalThis.setTimeout=fn=>{ fn(); return 1; };
  const originalNow=Date.now; Date.now=()=>1;
  try {
    await import('../src/app.js');
    const $=id=>window.document.getElementById(id);
    assert.equal($('start').disabled,true);
    assert.equal(window.document.querySelectorAll('.shop-card').length,5);
    assert.match($('shop').textContent,/Entry/);
    assert.equal(window.document.querySelectorAll('.trait-group').length,2);
    $('build-guide').click(); assert.equal($('build-guide-dialog').open,true);
    assert.match($('guide-traits').textContent,/Systematic/); $('close-build-guide').click();
    $('catalog-open').click();assert.equal($('catalog-dialog').open,true);
    assert.equal(window.document.querySelectorAll('.catalog-unit').length,32);
    $('catalog-style').value='Value';$('catalog-style').dispatchEvent(new window.Event('change'));
    assert.equal(window.document.querySelectorAll('.catalog-unit').length,4);
    window.document.querySelector('[data-catalog-tab="traits"]').click();assert.equal(window.document.querySelectorAll('.catalog-trait').length,13);
    assert.match($('catalog-content').textContent,/FIFO/);
    window.document.querySelector('[data-catalog-tab="roles"]').click();assert.equal(window.document.querySelectorAll('.catalog-trait').length,6);
    $('catalog-close').click();
    assert.equal(window.document.querySelectorAll('.lobby-player').length,8);
    assert.ok(window.document.querySelectorAll('#opponent-floor .scout-unit').length>0);
    assert.match($('opponent-slots').textContent,/BENCH/);
    assert.equal(window.document.querySelectorAll('.asset:not([hidden])').length,3);
    window.document.querySelector('[data-asset="1"]').click(); assert.equal($('focus-ticker').textContent,'VOLT');
    $('market-toggle').click();assert.equal($('market-toggle').getAttribute('aria-pressed'),'false');
    assert.equal(window.document.querySelector('[data-asset="1"]').classList.contains('market-paused'),true);
    $('market-toggle').click();assert.equal($('market-toggle').getAttribute('aria-pressed'),'true');
    window.document.querySelector('[data-asset="0"]').click();
    window.document.querySelector('[data-inspect="maker"]').click();
    assert.equal($('unit-dialog').open,true);assert.match($('unit-simple').textContent,/quotes|orders/);
    assert.equal($('unit-advanced').open,false);assert.match($('unit-risk').textContent,/lose/);$('close-unit').click();
    window.document.querySelector('[data-buy="0"]').click();
    assert.equal(window.document.querySelectorAll('#bench .company-unit').length,1);
    assert.equal(window.document.querySelectorAll('#desk .company-unit').length,0);
    window.document.querySelector('#bench [data-move]').click();
    assert.equal($('start').disabled,false);
    assert.match($('slots-label').textContent,/1 \/ 3/);
    for(const slot of [1,3]) { window.document.querySelector(`[data-buy="${slot}"]`).click(); window.document.querySelector('#bench [data-move]').click(); }
    assert.match($('slots-label').textContent,/3 \/ 3/);
    $('lock-shop').click(); assert.equal($('lock-shop').getAttribute('aria-pressed'),'true');
    const offers=()=>[...window.document.querySelectorAll('[data-offer-id]')].map(el=>el.dataset.offerId);
    const locked=offers();
    $('start').click(); assert.equal($('control-status').textContent,'CONNECTED');
    assert.equal(window.document.querySelectorAll('#desk .unit-stage').length,3);
    assert.equal(window.document.querySelectorAll('.match-row').length,3);
    $('pause').click(); const paused=$('timer').textContent; nextTick(); assert.equal($('timer').textContent,paused); $('pause').click();
    window.document.querySelector('[data-action="stance"]').click(); assert.match($('controls').textContent,/Defensive/);
    for(let i=0;i<80;i++)nextTick();
    assert.ok([...window.document.querySelectorAll('#desk .company-unit')].some(el=>Number(el.dataset.sequence)>0));
    assert.equal($('day-result').hidden,false); assert.equal(window.document.querySelector('#recap'),null);
    assert.match($('recap-title').textContent,/edge|day|finish|match|doors/);
    assert.notEqual($('your-score').textContent,'+$0.00');
    $('next').click(); assert.equal($('day-result').hidden,true); assert.match($('day-title').textContent,/Day 2/);
    assert.match($('slots-label').textContent,/3 \/ 4/);assert.equal(window.document.querySelectorAll('.asset:not([hidden])').length,3);
    assert.equal($('lock-shop').getAttribute('aria-pressed'),'true'); assert.deepEqual(offers(),locked);
    window.document.querySelector('[data-player="ivory"]').click(); assert.match($('lobby-inspect').textContent,/Ivory Research/);
    $('help').click(); assert.equal($('help-dialog').open,true); $('close-help').click();
    for(let day=2;day<=5;day++) {
      assert.equal(window.document.querySelectorAll('.asset:not([hidden])').length,[3,3,4,5,5][day-1]);
      $('start').click(); for(let tick=0;tick<80;tick++)nextTick(); assert.equal($('day-result').hidden,false); $('next').click();
    }
    assert.equal($('phase-label').textContent,'WEEKEND DRAFT');
    window.document.querySelector('[data-option="put"]').click();
    assert.match($('era').textContent,/WEEK 02/); assert.match($('slots-label').textContent,/3 \/ 7/);
    $('start').click(); assert.equal($('your-score').textContent,'−$8.00');
    for(let tick=0;tick<80;tick++)nextTick();
    assert.equal($('day-result').hidden,false);
    $('reset').click(); assert.equal($('credits').textContent.trim(),'10 ◎'); assert.equal($('start').disabled,true);
  } finally {
    Date.now=originalNow; Object.assign(globalThis,originals); await window.happyDOM.close();
  }
});
