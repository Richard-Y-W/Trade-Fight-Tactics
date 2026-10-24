import test from 'node:test';
import assert from 'node:assert/strict';
import { MARKETS,REGION_MAP,INSTRUMENTS,marketCells,regionAt,unlockedMarkets,callValue,migrateInstrumentId } from '../src/markets.js';
import { boardConfig,placeUnit,enableRegionalCompany,boardTile } from '../src/board.js';
import { createCompany,refreshDay } from '../src/company.js';
import { createDay,step,trade,equity,hedge,portfolioRisk } from '../src/engine.js';
import { unitMetrics } from '../src/analytics.js';
import { overlayData } from '../src/board-overlays.js';
import { createBattleObserver } from '../src/battle-readout.js';
import { animationFor } from '../src/floor-model.js';
const regional={marketModel:'regional',activeRegions:MARKETS.map(m=>m.id)};
const unit=(id,uid,col,row)=>({id,uid,star:1,position:{col,row}});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('exact 64-cell patchwork has contiguous markets, correct areas and safe anchors',()=>{
  assert.equal(REGION_MAP.flat().length,64);assert.ok(REGION_MAP.flat().every(id=>MARKETS.some(m=>m.id===id)));
  for(const m of MARKETS){const cells=marketCells(m.id);assert.equal(cells.length,m.tiles);assert.equal(regionAt(m.anchor),m.id);
    const queue=[cells[0]],seen=new Set();while(queue.length){const p=queue.pop(),key=`${p.col}:${p.row}`;if(seen.has(key))continue;seen.add(key);for(const [dc,dr] of [[0,1],[0,-1],[1,0],[-1,0]]){const q={col:p.col+dc,row:p.row+dr};if(regionAt(q)===m.id&&!seen.has(`${q.col}:${q.row}`))queue.push(q);}}assert.equal(seen.size,m.tiles);
  }
});
test('unlocks preserve positions and prevent locked or incompatible deployments and swaps',()=>{
  const c=enableRegionalCompany(createCompany(4));c.units=[{...unit('maker',1,0,0),deployed:true},unit('specialist',2,4,0)];
  assert.deepEqual(c.activeRegions,['equities']);assert.equal(placeUnit(c,1,{col:4,row:0}),false);assert.equal(placeUnit(c,2,{col:1,row:0}),false);
  const original={...c.units[0].position};refreshDay(c,1,2);assert.deepEqual(c.units[0].position,original);assert.equal(placeUnit(c,2,{col:4,row:0}),true);
  assert.equal(placeUnit(c,1,{col:4,row:0}),false,'cannot swap an option-only desk into equities');
  assert.deepEqual([1,2,3,4,5].map(d=>unlockedMarkets(1,d).length),[1,2,4,5,6]);
  assert.deepEqual(boardTile(original,0,c.board),boardTile(original,1,c.board));
});
test('semantic migration never relabels energy as a derivative or rates product',()=>{
  assert.equal(migrateInstrumentId('VOLT'),'commodity-basket');assert.equal(migrateInstrumentId('ORE'),'commodity-basket');assert.equal(migrateInstrumentId('NOVA'),'equity-etf');
  assert.equal(INSTRUMENTS[4].priceScale,10000);assert.equal(INSTRUMENTS[1].kind,'option');
});
test('real products use premium/convexity, duration, FX pip and credit spread mechanics',()=>{
  close(callValue(90,100,.22,0).price,0);close(callValue(110,100,.22,0).price,10);
  assert.ok(callValue(100,100,.4,1/252).price>callValue(100,100,.1,1/252).price);
  const s=createDay([],22,[],null,regional);for(let n=0;n<20;n++)step(s);
  close(s.fundamentals[2],100*Math.exp(-5*(s.drivers.yield-.04)));
  close(s.fundamentals[5],100*Math.exp(-4*(s.drivers.yield-.04+s.drivers.spread-.015))*s.drivers.creditRecovery);
  close(s.prices[1],s.optionGreeks.price);assert.ok(s.prices[4]>.9&&s.prices[4]<1.3);
});
test('contract-aware cash and short reversals reconcile without manufacturing equity',()=>{
  const s=createDay([],7,[],null,regional),f=s.firms[0];
  trade(f,4,2,1.1,.02);close(f.cash,7799.98);close(equity(f,s.prices),9999.98);
  trade(f,4,-3,1.101,.03);close(f.realized[4],2);close(f.inv[4],-1);close(f.basis[4],1.101);
  trade(f,4,1,1.1,.01);close(f.cash,10002.94);
  trade(f,1,2,.5,.02);close(f.cash,9992.92);trade(f,1,-2,0,0);close(f.realized[1],-10);
});
test('assigned regions route to real instruments with shared books and ledger-backed effects',()=>{
  const units=[unit('maker',1,0,0),unit('specialist',2,4,0),unit('maker',3,7,2),unit('maker',4,0,4),unit('router',5,3,6),unit('maker',6,0,7)];
  const s=createDay(units,12,units.map(u=>({...u,uid:u.uid+20})),null,regional),observe=createBattleObserver();observe(s);
  for(let n=0;n<80;n++){step(s);const report=observe(s);for(const [side,f] of s.firms.entries()){
    close(equity(f,s.prices)-10000,f.pnl.reduce((n,p)=>n+p,0));
    close(f.units.reduce((n,u)=>n+unitMetrics(s,side,u).net,0),equity(f,s.prices)-10000);
    close(report.firms[side].rows.reduce((n,r)=>n+r.net,0),equity(f,s.prices)-10000);
    assert.ok(f.inv.every(Number.isFinite));assert.ok(Number.isFinite(portfolioRisk(f,s.prices,s.conditions).sigma1s));
  }}
  const quotes=s.replay.filter(e=>e.type==='quote');assert.ok(quotes.length>0);
  for(const e of quotes){const u=s.firms[e.firm].units.find(u=>u.uid===e.source.uid);assert.equal(INSTRUMENTS[e.asset].market,regionAt(u.position));}
  assert.equal(s.firms[0].inv[1],0);assert.ok(s.replay.some(e=>e.type==='option_expiry'));
  const heat=overlayData(s,'pnl');close(heat.filter(h=>h.side===0).reduce((n,h)=>n+h.value,0),equity(s.firms[0],s.prices)-10000);
});
test('Day 1 is a true equities-only duel; geometry never weights price paths or order flow',()=>{
  const options={marketModel:'regional',activeRegions:['equities']};
  const a=createDay([unit('maker',1,0,0)],33,[unit('maker',2,0,0)],null,options),b=createDay([unit('maker',1,3,3)],33,[],null,options);
  for(let n=0;n<80;n++){step(a);step(b);assert.deepEqual(a.prices,b.prices);}
  assert.ok(a.replay.some(e=>e.type==='fill'));assert.ok(a.replay.filter(e=>['quote','fill','signal'].includes(e.type)).every(e=>e.asset===0));
  assert.ok(a.books.slice(1).every(b=>b.orders.length===0));
});
test('regional seeds replay exactly; hedge costs use contract units and scale',()=>{
  const units=[unit('maker',1,3,6),unit('treasury',2,4,6)],a=createDay(units,70,[],null,regional),b=createDay(units,70,[],null,regional);
  for(let n=0;n<80;n++){step(a);step(b);}assert.deepEqual(a.replay,b.replay);
  const s=createDay(units,2,[],null,regional),f=s.firms[0];trade(f,4,4,1.1,0,{id:'maker',uid:1});const before=equity(f,s.prices);hedge(s,0,true);
  const event=s.events.find(e=>e.type==='hedge');close(before-equity(f,s.prices),event.cost);assert.equal(f.inv[4],0);assert.ok(event.cost<10);
  assert.throws(()=>boardConfig({shared:true,cols:9}),/8 by 8/);
});
test('regional research stays product-scoped and inspection cannot mutate financial state',()=>{
  const s=createDay([unit('research',1,4,0),unit('maker',2,3,0)],5,[],null,regional);
  const before=JSON.stringify(s);unitMetrics(s,0,s.firms[0].units[0]);overlayData(s);createBattleObserver()(s);assert.equal(JSON.stringify(s),before);
  for(let n=0;n<12;n++){step(s);for(const e of s.events.filter(e=>e.type==='signal')){assert.equal(e.asset,1);assert.ok(e.observedTick<=s.tick);assert.ok(Number.isFinite(e.estimate));}
    for(const e of s.events.filter(e=>e.type==='quote'&&e.source?.uid===2))assert.equal(e.support.length,0,'nearby options research does not price equities');
  }
  assert.equal(s.firms[0].quotes[2],null,'no indicative firm quote in an unassigned product');
});
test('fill feedback uses total marked execution edge once, not quantity twice',()=>{
  assert.equal(animationFor({type:'fill',edge:.02,qty:100,fee:.03}),'stress');
  assert.equal(animationFor({type:'fill',edge:.04,qty:100,fee:.03}),'success');
});
