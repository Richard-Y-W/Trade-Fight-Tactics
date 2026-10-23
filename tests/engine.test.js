import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS,SCENARIOS,portfolioRisk,createDay,step,route,trade,firm,equity,command,hedge,matchFirms } from '../src/engine.js';
test('customer liquidity routes to the better quote and respects displayed size', () => {
  const s = createDay();
  s.firms[0].quotes[0] = { bid: 99, ask: 101, bidSize: 4, askSize: 4 };
  s.firms[1].quotes[0] = { bid: 99.5, ask: 100.5, bidSize: 2, askSize: 2 };
  route(s, 0, 'buy', 3,102);
  assert.equal(s.firms[1].inv[0], -2); assert.equal(s.firms[0].inv[0], -1);
});
test('ledger handles closing and reversing inventory without manufacturing equity', () => {
  const f = firm(); trade(f, 0, 10, 100); trade(f, 0, -15, 102);
  assert.equal(f.realized[0], 20); assert.equal(f.basis[0], 102); assert.equal(equity(f, ASSETS.map((a,i)=>i===0?102:a.price)), 10020);
});
test('customers reject prices outside their budget rather than gifting unlimited spread',()=>{
  const s=createDay();
  s.firms[0].quotes[0]={bid:1,ask:1000,bidSize:30,askSize:30};
  assert.equal(route(s,0,'buy',4),4);assert.equal(route(s,0,'sell',4),4);
  assert.equal(s.firms[0].inv[0],0);assert.equal(s.firms[0].cash,10000);
});
test('crossed firm quotes transfer cash and inventory without creating wealth',()=>{
  const s=createDay();
  s.firms[0].quotes[0]={bid:100.3,ask:100.5,bidSize:3,askSize:3,updatedAt:1};
  s.firms[1].quotes[0]={bid:99.7,ask:100.1,bidSize:3,askSize:3,updatedAt:1};
  matchFirms(s,0);
  assert.equal(s.firms[0].inv[0],3);assert.equal(s.firms[1].inv[0],-3);
  const fees=s.firms.reduce((n,f)=>n+f.fees,0);
  assert.ok(Math.abs(s.firms[0].cash+s.firms[1].cash-(20000-fees))<1e-8);
  assert.ok(Math.abs(equity(s.firms[0],s.prices)+equity(s.firms[1],s.prices)-(20000-fees))<1e-8);
  assert.ok(Math.abs(s.events[0].price-100.3)<1e-10);
});
test('zero-sized trades are safe and invalid accounting inputs are rejected',()=>{
  const f=firm();trade(f,0,0,100);assert.equal(f.basis[0],0);assert.equal(equity(f,ASSETS.map(a=>a.price)),10000);
  assert.throws(()=>trade(f,0,NaN,100),TypeError);assert.throws(()=>trade(f,0,1,-1),TypeError);
});
test('pausing one market stops new quotes without deleting existing inventory',()=>{
  const s=createDay(['sizing']);trade(s.firms[0],3,5,100);
  assert.ok(command(s,'market',3));step(s);
  assert.equal(s.firms[0].quotes[3],null);assert.equal(s.firms[0].inv[3],5);
  assert.equal(s.firms[0].fills[3],0);assert.ok(s.firms[1].quotes[3]);
  assert.equal(command(s,'market',ASSETS.length),false);
});
test('Press remains active for its advertised number of simulation ticks',()=>{
  const s=createDay(['manual'],7);command(s,'press');
  for(let i=0;i<10;i++) {
    step(s);
    assert.equal(s.firms[0].press,9-i);
    const posts=s.events.filter(e=>e.type==='quote'&&e.firm===0);for(const q of posts)assert.ok(q.ask-q.bid>=.11-1e-9&&q.ask-q.bid<=.13+1e-9);
  }
  assert.equal(s.firms[0].press,0);step(s);
  const post=s.events.find(e=>e.type==='quote'&&e.firm===0);assert.ok(post);assert.ok(post.ask-post.bid>=.26-1e-9&&post.ask-post.bid<=.28+1e-9);
});
test('risk math recognizes partially offsetting common-factor exposures',()=>{
  const f=firm(),prices=ASSETS.map(a=>a.price);trade(f,0,10,100);
  const unhedged=portfolioRisk(f,prices,SCENARIOS.trend);
  trade(f,3,8,100);const hedged=portfolioRisk(f,prices,SCENARIOS.trend);
  assert.ok(hedged.sigma1s<unhedged.sigma1s);assert.ok(hedged.gross>unhedged.gross);
  assert.ok(Math.abs(hedged.commonExposure-7.2)<1e-8);
});
test('capabilities gate commands; hedging reduces exposure and pays a cost', () => {
  const s = createDay(['hedge']); assert.equal(command(s, 'press'), false);
  trade(s.firms[0], 0, 20, 100); const before = equity(s.firms[0], s.prices);
  hedge(s, 0, true); assert.equal(s.firms[0].inv[0], 0); assert.ok(equity(s.firms[0], s.prices) < before);
});
test('seeded days replay exactly, end at 40 seconds and enforce inventory limits', () => {
  const a = createDay(['manual', 'sizing'], 42), b = createDay(['manual', 'sizing'], 42);
  command(a, 'press'); command(b, 'press');
  for (let i = 0; i < 80; i++) { step(a); step(b); for (const f of a.firms) assert.ok(f.inv.every(q => Math.abs(q) <= f.config.capacity)); }
  assert.deepEqual(a.prices, b.prices); assert.equal(a.done, true); assert.equal(a.tick, 80);
  assert.equal(equity(a.firms[0], a.prices), equity(b.firms[0], b.prices));
});
test('changing build or interventions does not change the external price path', () => {
  const a = createDay(['execution', 'hedge'], 884), b = createDay(['manual', 'research'], 884);
  for (let i = 0; i < 80; i++) { if (i % 16 === 0) command(b, 'press'); if (i % 9 === 0) command(b, 'lean'); step(a); step(b); }
  assert.deepEqual(a.history, b.history);
});
test('options charge premium, settle exact payoff once and cannot replay settlement', () => {
  const s = createDay([], 17, [], 'put');
  assert.equal(s.firms[0].cash, 9992);
  for (let i = 0; i < 79; i++) step(s);
  step(s);
  const event = s.events.find(e => e.type === 'option');
  assert.equal(event.payoff, Math.max(0, 100 - s.prices[0]) * 12);
  const final = equity(s.firms[0], s.prices); step(s); assert.equal(equity(s.firms[0], s.prices), final);
  assert.equal(command(s, 'stance'), false);
});
test('portfolio P&L reconciles with the cash ledger across multiple seeds', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const s = createDay(['execution', 'hedge', 'sizing'], seed);
    for (let t = 0; t < 80; t++) step(s);
    for (const f of s.firms) assert.ok(Math.abs(f.pnl.reduce((a, b) => a + b, 0) - f.fees - (equity(f, s.prices) - 10000)) < 1e-8);
  }
});
