import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS,TRAITS,SENIORITY,buildConfig,traitCounts,traitLevel } from '../src/roster.js';
import { createDay,step,command,trade,equity } from '../src/engine.js';

test('each unit has one style, one specialty and the correct independent career tier',()=>{
  assert.deepEqual(SENIORITY,['Entry','Mid','Lead','PM','Firm Owner']);
  assert.equal(new Set(CARDS.map(c=>c.id)).size,32);
  for(const c of CARDS) {
    assert.equal(TRAITS[c.style].category,'Style'); assert.equal(TRAITS[c.specialty].category,'Specialty');
    assert.equal(c.seniority,SENIORITY[c.cost-1]);
  }
  for(const [name,t] of Object.entries(TRAITS)) assert.ok(CARDS.filter(c=>c.traits.includes(name)).length>=t.thresholds.at(-1),`${name} has enough distinct identities for its final threshold`);
});
test('style and specialty thresholds permit mixed teams without duplicate trait farming',()=>{
  assert.equal(traitLevel(3,'HFT'),1); assert.equal(traitLevel(3,'Trading'),2);
  const hybrid=['research','liquidity','manual']; const counts=traitCounts(hybrid);
  assert.equal(counts.HFT,2); assert.equal(counts.Trading,2);
  const config=buildConfig(hybrid); assert.equal(config.cadence,2); assert.equal(config.pressTicks,12);
  assert.equal(traitCounts([...hybrid,'manual']).Trading,2);
  const threeTrading=buildConfig(['maker','manual','sizing']); assert.equal(threeTrading.pressTicks,14);
});
test('Macro unlocks a direction control without a research unit, and a wrong view is not guaranteed income',()=>{
  const s=createDay(['manual','broker'],54); const f=s.firms[0];
  assert.ok(!f.cards.includes('research')); assert.ok(f.cards.includes('directional'));
  assert.equal(command(s,'lean'),true); assert.equal(f.lean,1); assert.equal(f.config.leanStrength,.28);
  step(s); assert.ok(f.quotes.every(q=>q.bid<q.ask));
});
test('HFT charges refresh costs and preserves accounting; Systematic adds a bounded trend response',()=>{
  const s=createDay(['research','liquidity'],91); step(s);
  assert.equal(s.firms[0].config.quoteFee,.002); assert.ok(s.firms[0].fees>=.006);
  const f=s.firms[0]; assert.ok(Math.abs(f.pnl.reduce((a,b)=>a+b,0)-f.fees-(equity(f,s.prices)-10000))<1e-8);
  assert.equal(buildConfig(['analyst','hedge']).trendTilt,.25);
  assert.equal(buildConfig(['analyst','hedge','adaptive','quantum']).trendTilt,.5);
});
test('Asset Management actually rebalances at the scheduled tick and pays execution costs',()=>{
  const s=createDay(['sizing','prime'],314); const f=s.firms[0];
  for(let i=0;i<7;i++)step(s);
  trade(f,0,40-f.inv[0],s.prices[0]); const fees=f.fees;
  step(s);
  const event=s.events.find(e=>e.type==='rebalance' && e.firm===0 && e.asset===0);
  assert.equal(event.after,8);assert.equal(event.qty,event.before-event.after); assert.ok(f.fees>fees);
  assert.ok(Math.abs(f.pnl.reduce((a,b)=>a+b,0)-f.fees-(equity(f,s.prices)-10000))<1e-8);
});
