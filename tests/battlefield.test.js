import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD,boardConfig,assignPositions,placeUnit,boardTile,localTile,scoutSnapshot } from '../src/board.js';
import { supportGraph,routingFor,previewPosition } from '../src/positioning.js';
import { createDay,step,trade,equity,hedge } from '../src/engine.js';
import { createCompany } from '../src/company.js';
import { overlayData } from '../src/board-overlays.js';
const u=(id,uid,col=0,row=0)=>({id,uid,star:1,deployed:true,position:{col,row}});

test('configurable board mirrors local positions without sector or role restrictions',()=>{
  for(const b of [BOARD,boardConfig({cols:9,rows:8})])for(let row=0;row<b.half;row++)for(let col=0;col<b.cols;col++)for(const side of [0,1])assert.deepEqual(localTile(col,boardTile({col,row},side,b).row,side,b),{col,row});
  const managers=assignPositions(Array.from({length:8},(_,i)=>u('treasury',i)));assert.equal(new Set(managers.map(u=>JSON.stringify(u.position))).size,8);
  assert.throws(()=>boardConfig({rows:7}));
});
test('placement atomically swaps tiles and bench reserves, enforces capacity and rejects opponent rows',()=>{
  const c=createCompany(1);c.units=[u('maker',1),{id:'research',uid:2,star:1,deployed:false}];c.floorLimit=1;
  const initial=JSON.stringify(c);assert.equal(placeUnit(c,2,{col:2,row:0}),false);assert.equal(JSON.stringify(c),initial);
  assert.equal(placeUnit(c,2,{col:0,row:0}),true);assert.equal(c.units[0].deployed,false);assert.equal(c.units[1].deployed,true);
  assert.equal(placeUnit(c,2,{col:4,row:3}),true);assert.equal(placeUnit(c,2,{col:4,row:4}),false);
  assert.equal(placeUnit(c,2,null),true);c.floorLimit=2;placeUnit(c,1,{col:0,row:0});placeUnit(c,2,{col:1,row:1});placeUnit(c,1,{col:1,row:1});assert.deepEqual(c.units[1].position,{col:0,row:0});
});
test('scouting is an owned snapshot and preserves formation after the source changes',()=>{
  const player={id:'rival',name:'Rival',company:{units:[u('maker',1,5,2)]}},ghost=scoutSnapshot(player,{day:3});player.company.units[0].position.col=0;player.company.units[0].star=3;
  assert.equal(ghost.units[0].position.col,5);assert.equal(ghost.units[0].star,1);assert.equal(ghost.day,3);
});
test('local links have visible finite range/capacity; distant support cannot price a trader',()=>{
  const units=[u('research',1,1,1),u('maker',2,1,0),u('manual',3,2,0),u('router',4,0,1),u('liquidity',5,7,3)];
  const links=supportGraph(units).filter(e=>e.kind==='research');assert.equal(links.length,2);assert.ok(links.every(e=>e.distance<=2));assert.ok(!links.some(e=>e.target.uid===5));
  const s=createDay(units,7);step(s);assert.equal(s.events.find(e=>e.type==='quote'&&e.source?.uid===5)?.support.length,undefined);step(s); // back-row quotes arrive later
  for(let t=0;t<5;t++)step(s);assert.ok(s.replay.filter(e=>e.type==='quote'&&e.source?.uid===5).every(e=>e.support.length===0));
});
test('position causes real delayed arrival, preserves decision timestamps and leaves price paths unchanged',()=>{
  const front=createDay([u('maker',1,0,0)],23,[]),back=createDay([u('maker',1,0,3)],23,[]);
  step(front);step(back);assert.ok(front.events.some(e=>e.type==='quote'));assert.ok(!back.events.some(e=>e.type==='quote'));
  for(let i=1;i<80;i++){step(front);step(back);}
  const q=back.replay.find(e=>e.type==='quote');assert.equal(q.arrivalTick-q.createdTick,3);assert.equal(q.latencyMs,1500);assert.deepEqual(front.history,back.history);assert.notEqual(equity(front.firms[0],front.prices),equity(back.firms[0],back.prices));
});
test('execution infrastructure and multiple managers have bounded, local routing effects',()=>{
  const units=[u('maker',1,1,2),u('router',2,1,1),u('prime',3,2,2),u('treasury',4,2,3)];
  const f={supportLinks:supportGraph(units)};assert.equal(routingFor(f,units[0]).delayTicks,1);
  for(let n=0;n<4;n++)assert.equal(routingFor(f,units[0],{slot:5,tick:2}).processingTicks,0);
  assert.equal(routingFor(f,units[0],{slot:5,tick:2}).processingTicks,1);
  assert.ok(previewPosition(units,1,{col:7,row:3}).links.length===0);
});
test('support-only firms are legal and do not receive phantom trading units',()=>{
  const units=Array.from({length:8},(_,i)=>u('treasury',i,i,2)),s=createDay(units,12,[]);
  for(let i=0;i<80;i++)step(s);assert.equal(s.firms[0].fills.reduce((n,v)=>n+v,0),0);assert.equal(s.firms[0].units.length,8);assert.equal(equity(s.firms[0],s.prices),10000);
});
test('local automatic hedging cannot liquidate an unreachable unit, while manual emergency action stays explicit',()=>{
  const s=createDay([u('maker',1,7,3),u('hedge',2,0,0)],9,[]),f=s.firms[0];trade(f,0,25,100,0,{id:'maker',uid:1});hedge(s,0,false);assert.equal(f.inv[0],25);hedge(s,0,true);assert.equal(f.inv[0],0);assert.ok(f.fees>0);
});
test('heatmaps are ledger/event metrics at real unit tiles, not arbitrary winning-side colors',()=>{
  const s=createDay([u('maker',1,5,2)],3,[]);trade(s.firms[0],0,3,99,0,{id:'maker',uid:1});
  const pnl=overlayData(s,'pnl')[0],risk=overlayData(s,'risk')[0];assert.equal(pnl.value,3);assert.equal(risk.value,300);assert.deepEqual(pnl.position,{col:5,row:6});assert.equal(overlayData(s,'activity')[0].value,0);
});
