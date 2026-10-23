import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompany,buy,move,sell,sellValue,reroll,refreshDay,oddsFor,floorLimitFor,deployed,reserves,releaseOffers } from '../src/company.js';
import { byId,buildConfig,traitCounts } from '../src/roster.js';
import { createDay,step,equity } from '../src/engine.js';
import { makeLobby,startExhibition,stepExhibition,settleExhibition } from '../src/league.js';
const offer=(c,id)=>{releaseOffers(c);assert.ok(c.pool.remaining[id]>0);c.pool.remaining[id]--;c.offers=[id];};
const recruit = (c,id) => {offer(c,id);return buy(c,0);};
test('recruiting buys reserves, not deployed capabilities; transactions are atomic',()=>{
  const c=createCompany(42);offer(c,'research');c.credits=1;
  const before=JSON.stringify(c); assert.equal(buy(c,0).ok,false); assert.equal(JSON.stringify(c),before);
  c.credits=10; assert.equal(buy(c,0).ok,true); assert.equal(reserves(c).length,1); assert.equal(deployed(c).length,0);
  assert.deepEqual(buildConfig(deployed(c)).capabilities,[]);
  assert.ok(move(c,c.units[0].uid)); assert.ok(buildConfig(deployed(c)).capabilities.includes('research'));
  assert.equal(buy(c,0).ok,false);
});
test('three copies merge across floor and bench; nine merge recursively to three stars',()=>{
  const c=createCompany(42); c.credits=100;
  recruit(c,'maker'); move(c,c.units[0].uid);
  for(let i=0;i<8;i++) assert.ok(recruit(c,'maker').ok);
  assert.equal(c.units.length,1); assert.equal(c.units[0].star,3); assert.equal(c.units[0].deployed,true);
  assert.equal(sellValue(c.units[0]),9); const credits=c.credits;
  sell(c,c.units[0].uid); assert.equal(c.credits,credits+9);
});
test('full bench rejects purchases without charging but allows a completed triple',()=>{
  const c=createCompany(7); c.credits=100;
  for(const id of ['maker','maker','manual','analyst','clerk','research','broker','router']) recruit(c,id);
  assert.equal(reserves(c).length,8);
  offer(c,'sizing'); const balance=c.credits; assert.equal(buy(c,0).ok,false); assert.equal(c.credits,balance); assert.equal(c.units.length,8);
  assert.ok(recruit(c,'maker').ok); assert.equal(reserves(c).length,7); assert.equal(c.units.find(u=>u.id==='maker').star,2);
});
test('daily capacity permits floor/bench swaps without exceeding either limit',()=>{
  const c=createCompany(1); c.credits=100;
  for(const id of ['maker','manual','analyst','clerk']) recruit(c,id);
  for(const u of c.units.slice(0,3)) assert.ok(move(c,u.uid));
  assert.equal(move(c,c.units[3].uid),false);
  assert.ok(move(c,c.units[3].uid,c.units[0].uid)); assert.equal(deployed(c).length,3); assert.equal(reserves(c).length,1);
  assert.deepEqual([1,2,3,4,5].map(day=>floorLimitFor(1,day)),[3,4,5,6,7]); refreshDay(c,1,2); assert.equal(c.floorLimit,4);
});
test('shop odds exclude unavailable tiers, charge for rerolls and preserve locks across days',()=>{
  const c=createCompany(17);
  for(let i=0;i<200;i++) { reroll(c,1,true); assert.ok(c.offers.every(id=>byId(id).tier<=3)); }
  assert.deepEqual(oddsFor(1),[70,25,5,0,0]); assert.equal(oddsFor(99).reduce((a,b)=>a+b,0),100);
  const before=c.credits; assert.ok(reroll(c,3)); assert.equal(c.credits,before-2);
  c.locked=true; const offers=[...c.offers]; refreshDay(c,1,3); assert.deepEqual(c.offers,offers); assert.equal(c.floorLimit,5);
  c.credits=1; const snapshot=JSON.stringify(c); assert.equal(reroll(c,1),false); assert.equal(JSON.stringify(c),snapshot);
});
test('traits count distinct deployed identities, and star upgrades improve actual execution settings',()=>{
  const c=createCompany(1); c.credits=100;
  for(const id of ['maker','maker','router']) recruit(c,id);
  c.units.forEach(u=>move(c,u.uid)); assert.equal(traitCounts(deployed(c)).Liquidity,2);
  assert.equal(buildConfig(deployed(c)).cadence,2);
  const one=buildConfig([{id:'research',star:1}]), two=buildConfig([{id:'research',star:2}]);
  assert.ok(two.noise<one.noise);
  const passive=buildConfig(['maker','router']); assert.ok(passive.fee<buildConfig(['maker']).fee);
  const s=createDay(deployed(c),14); for(let i=0;i<80;i++)step(s);
  assert.ok(Number.isFinite(equity(s.firms[0],s.prices)));
});
test('lobby pairings execute real days and settle health from their results',()=>{
  const lobby=makeLobby(), matches=startExhibition(lobby,1,123);
  assert.equal(matches.length,3);
  for(let i=0;i<80;i++)stepExhibition(matches);
  assert.ok(matches.every(m=>m.state.done)); settleExhibition(lobby,matches);
  assert.ok(lobby.slice(2).some(p=>p.health<100)); assert.equal(lobby[0].health,100);
});
