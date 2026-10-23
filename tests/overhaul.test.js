import test from 'node:test';
import assert from 'node:assert/strict';
import { createDay,step,trade,command,equity,covariance1s,portfolioRisk,SCENARIOS } from '../src/engine.js';
import { decisionFor } from '../src/strategies.js';
import { byId } from '../src/roster.js';
import { unitMetrics,closingAnalysis } from '../src/analytics.js';
import { selectVisualEvents,advanceAnimation } from '../src/floor-model.js';
import { replayRecord } from '../src/combat-events.js';

test('events have stable replay IDs/times, delivered signals never read future values, and commands are retained',()=>{
  const s=createDay(['research','manual'],42);command(s,'press');
  for(let t=0;t<80;t++){step(s);for(const e of s.events.filter(e=>e.type==='signal'))assert.ok(e.observedTick<=s.tick);}
  const events=replayRecord(s).events;assert.equal(new Set(events.map(e=>e.eventId)).size,events.length);
  assert.ok(events.some(e=>e.type==='press'));assert.equal(events.at(-1).kind,'round_settled');
  assert.ok(events.every(e=>e.simTimeMs===e.tick*500&&e.schemaVersion===1));
  const a=createDay(['research'],7),b=createDay(['research'],7);b.fundamentalHistory=b.fundamentalHistory.map(h=>new Proxy(h,{get(target,key){if(/^\d+$/.test(String(key))&&Number(key)>b.tick)throw Error('Future data read');return Reflect.get(target,key);}}));step(a);step(b);assert.deepEqual(a.firms[0].beliefs,b.firms[0].beliefs);
});

test('public prices, hidden reference and beliefs are distinct; build changes preserve common reference paths',()=>{
  const a=createDay(['maker'],43),b=createDay(['research','execution'],43);
  for(let t=0;t<80;t++){step(a);step(b);assert.deepEqual(a.prices,b.prices);assert.deepEqual(a.fundamentals,b.fundamentals);}
  assert.notDeepEqual(a.prices,a.fundamentals);assert.notDeepEqual(b.prices,b.firms[0].beliefs);
});

test('momentum and reversion take opposite positions on the same public path; pairs specialize in two assets',()=>{
  const view={asset:0,prices:[101,75,50],history:[[99,99.5,100,100.5,101],[75],[50]],beliefs:[101,75,50],inventory:[0,0,0],capacity:30,lean:0,leanStrength:.2,trendTilt:0};
  assert.ok(decisionFor(byId('broker'),view).target>0);assert.ok(decisionFor(byId('value-clerk'),view).target<0);
  const s=createDay(['agency-lead'],12);for(let t=0;t<20;t++)step(s);
  assert.ok(s.replay.some(e=>e.type==='quote'&&e.source?.id==='agency-lead'&&e.pair===1));
  assert.ok(!s.replay.some(e=>e.type==='quote'&&e.source?.id==='agency-lead'&&e.asset>1));
});

test('straddle pays a premium once, settles exact two-sided payoff, and cannot create repeated money',()=>{
  const s=createDay([{id:'specialist',uid:1}],6,[]),f=s.firms[0],c=f.contracts[0];
  assert.equal(equity(f,s.prices),10000-c.premium);assert.equal(command(s,'press'),false);
  for(let t=0;t<80;t++)step(s);
  const m=unitMetrics(s,0,f.units[0]);assert.ok(Math.abs(m.optionNet-(c.qty*Math.abs(s.prices[0]-100)-c.premium))<1e-8);
  const end=f.cash;step(s);assert.equal(f.cash,end);
  assert.ok(!s.replay.some(e=>e.type==='quote'&&e.source?.id==='specialist'));
});

test('unit accounting reconciles shorts, realized/open P&L and fees; support analytics do not invent profits',()=>{
  const s=createDay([{id:'maker',uid:1},{id:'research',uid:2}],12),f=s.firms[0],source={id:'maker',uid:1};
  trade(f,0,-8,101,.2,source);trade(f,0,12,99,.3,source);
  const m=unitMetrics(s,0,f.units[0]);assert.equal(m.realized,16);assert.equal(m.unrealized,4);assert.equal(m.net,19.5);
  assert.ok(Math.abs(m.realized+m.unrealized-m.fees-m.net)<1e-8);
  const report=closingAnalysis(s);assert.equal(report.helper.net,0);assert.equal(report.top.unit.uid,1);
});

test('covariance is symmetric PSD by construction and matches the linear inventory risk estimate',()=>{
  for(const conditions of Object.values(SCENARIOS))for(let seed=1;seed<=20;seed++){
    const matrix=covariance1s(conditions),s=createDay(),f=s.firms[0];f.inv=f.inv.map((_,i)=>(seed*(i+3)%19)-9);
    const variance=f.inv.reduce((n,q,i)=>n+q*matrix[i].reduce((v,c,j)=>v+c*f.inv[j],0),0);
    assert.ok(variance>=0);assert.ok(Math.abs(variance-portfolioRisk(f,s.prices,conditions).sigma1s**2)<1e-8);
    matrix.forEach((row,i)=>row.forEach((v,j)=>assert.equal(v,matrix[j][i])));
  }
});

test('presentation effects are bounded, honor reduced motion, and animation states return to idle',()=>{
  const s=createDay(['maker','research','hedge'],42);step(s);const before=JSON.stringify(s);
  assert.ok(selectVisualEvents(s.events,{limit:2}).length<=2);assert.deepEqual(selectVisualEvents(s.events,{reduced:true}),[]);
  assert.equal(advanceAnimation({name:'success',until:100},101).name,'idle');assert.equal(JSON.stringify(s),before);
});

test('inventory guard blocks new exposure-increasing offers and quotes name actual delivered research',()=>{
  const s=createDay([{id:'maker',uid:1},{id:'clerk',uid:2},{id:'research',uid:3}],18),f=s.firms[0];
  trade(f,0,22,100,0,{id:'maker',uid:1});step(s);
  assert.ok(s.events.some(e=>e.type==='guard'&&e.source.uid===2&&e.target.uid===1));
  assert.ok(!s.books[0].orders.some(o=>o.owner===0&&o.source?.uid===1&&o.side==='buy'));
  const quotes=s.events.filter(e=>e.type==='quote'&&e.source?.uid===1);
  assert.ok(quotes.length>0&&quotes.every(e=>e.support.some(u=>u.uid===3)));
  assert.ok(f.activity[2].guarded>0);assert.equal(f.activity[2].hedged,0);
});
