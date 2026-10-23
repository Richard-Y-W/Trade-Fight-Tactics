import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS,createDay,step,command,trade } from '../src/engine.js';
import { CARDS } from '../src/roster.js';
import { feedbackFor } from '../src/unit-feedback.js';
import { showUnitFeedback } from '../src/unit-view.js';
import { showMarketActions } from '../src/combat-view.js';
import { Window } from 'happy-dom';

test('all unit families have an intuitive description, visual instruction and explicit tradeoff',()=>{
  for(const c of CARDS) {
    assert.ok(c.simple.length>10);assert.ok(c.watch.length>10);assert.ok(c.risk.length>10);
    assert.equal(c.tags.length,2);assert.ok(!c.tags.includes('Safe'));
  }
});
test('every deployed trading unit owns its quote events; research emits separate support events',()=>{
  const units=[{id:'maker',uid:10,star:1},{id:'router',uid:11,star:1},{id:'analyst',uid:12,star:1}];
  const s=createDay(units,99);step(s);
  const quotes=s.events.filter(e=>e.type==='quote' && e.firm===0), signals=s.events.filter(e=>e.type==='signal' && e.firm===0);
  assert.equal(quotes.length,ASSETS.length*2);assert.ok(quotes.some(e=>e.source.uid===10));assert.ok(quotes.some(e=>e.source.uid===11));
  assert.equal(signals.length,ASSETS.length);assert.ok(signals.every(e=>e.source.uid===12));
  const view=feedbackFor(s.events);assert.ok(view.units.some(e=>e.source.uid===10));
  assert.ok(view.units.some(e=>e.type==='signal' && e.source.uid===12));
});
test('a hedge cue reports the inventory reduced and exact cost; an empty hedge has no protection effect',()=>{
  const s=createDay([{id:'clerk',uid:5,star:1}],8);assert.equal(command(s,'hedge'),true);assert.equal(s.events.filter(e=>e.type==='hedge').length,0);assert.ok(s.events.every(e=>e.type==='command'));
  s.firms[0].cooldown=0;trade(s.firms[0],0,15,100);
  const before=s.firms[0].cash;command(s,'hedge');
  const e=s.events.find(e=>e.type==='hedge');assert.equal(e.source.uid,5);assert.equal(e.before,15);assert.equal(e.after,0);
  assert.equal(e.cost,15*(s.firms[0].config.hedgeCost+.01));
  assert.ok(Math.abs(s.firms[0].cash-before-(1500-e.cost))<1e-8);
});
test('feedback aggregates actual actions without mutating ledger events or inventing unit profit',()=>{
  const source={id:'maker',uid:1};
  const events=[{type:'quote',firm:0,asset:0,qty:4,source},{type:'fill',firm:0,asset:0,qty:2,edge:.1,source},{type:'fill',firm:0,asset:1,qty:3,edge:-.2,source}];
  const snapshot=JSON.stringify(events), cue=feedbackFor(events).units[0];
  assert.equal(cue.type,'fill');assert.equal(cue.qty,5);assert.equal(cue.edge,-.1);assert.equal(JSON.stringify(events),snapshot);
  assert.equal(feedbackFor([{type:'rebalance',firm:0,trait:'Asset Management',qty:2,cost:.18}]).units.length,0);
});
test('DOM feedback animates the actual contributor, never a benched duplicate',async()=>{
  const window=new Window(); const doc=window.document;
  doc.body.innerHTML='<div id="desk"><article data-instance="1"><span class="unit-cue"></span></article></div><div id="bench"><article data-instance="2"><span class="unit-cue">ON BENCH</span></article></div><button data-asset="0"></button>';
  const saved=globalThis.setTimeout;globalThis.setTimeout=()=>1;
  try {
    showUnitFeedback([{type:'quote',firm:0,source:{id:'maker',uid:2},asset:0,qty:4}],()=>'',doc);
    assert.equal(doc.querySelector('#bench article').classList.contains('performing'),false);
    showUnitFeedback([{type:'quote',firm:0,source:{id:'maker',uid:1},asset:0,qty:4}],()=>'',doc);
    assert.equal(doc.querySelector('#desk article').dataset.cue,'quote');
    assert.equal(doc.querySelector('#desk .unit-cue').textContent,'QUOTES UPDATED');
    assert.equal(doc.querySelectorAll('.unit-market-cue').length,1);
  } finally {globalThis.setTimeout=saved;await window.happyDOM.close();}
});

test('market travel comes from the correct floor on both sides and never from a reserve',async()=>{
  const window=new Window(),doc=window.document;
  doc.body.innerHTML='<div id="desk"><article data-instance="1"></article></div><div id="opponent-floor"><article data-instance="1"></article></div><div id="bench"><article data-instance="2"></article></div><button data-asset="0"></button>';
  const saved=globalThis.setTimeout;globalThis.setTimeout=()=>1;
  try {
    showMarketActions([{type:'fill',firm:0,asset:0,qty:2,source:{id:'maker',uid:1},direct:true,opponent:{id:'router',uid:1}},{type:'fill',firm:1,asset:0,qty:2,source:{id:'router',uid:1},direct:true,opponent:{id:'maker',uid:1}},{type:'quote',firm:0,asset:0,qty:4,source:{id:'maker',uid:2}}],()=>'',doc);
    assert.equal(doc.querySelectorAll('.market-flight').length,2);
    assert.equal(doc.querySelectorAll('.market-flight.side-0').length,1);
    assert.equal(doc.querySelectorAll('.market-flight.side-1').length,1);
    assert.match(doc.querySelector('.market-flight.side-0').title,/Junior Market Maker: DUEL/);
  } finally {globalThis.setTimeout=saved;await window.happyDOM.close();}
});
