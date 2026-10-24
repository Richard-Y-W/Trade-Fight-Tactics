import test from 'node:test';
import assert from 'node:assert/strict';
import { progression } from '../src/progression.js';
import { createDay,step,command,trade,hedge,ASSETS } from '../src/engine.js';
import { CARDS,unitGrade,buildConfig } from '../src/roster.js';
import { createCompany } from '../src/company.js';
import { makeLobby,prepareBots,selectBotFloor,dayDamage,startExhibition } from '../src/league.js';
import { snapshot,markedChanges,createMarketFeel } from '../src/feel.js';
import { Window } from 'happy-dom';

test('beta daily ramp opens the specified slots, markets and shop tiers without regressing later',()=>{
  assert.deepEqual([1,2,3,4,5].map(d=>progression(1,d).slots),[3,4,5,6,7]);
  assert.deepEqual([1,2,3,4,5].map(d=>progression(1,d).markets),[1,2,4,5,6]);
  assert.equal(progression(2,1).slots,7);assert.equal(progression(2,1).markets,6);
  assert.ok(100-5*dayDamage(0,1000)>0,'a firm can experience the full first-week ramp');
});
test('unopened markets cannot quote, match, receive customer flow or be toggled on',()=>{
  const s=createDay(['maker','research'],12,['router'],null,{activeMarkets:3});
  assert.equal(command(s,'market',3),false);
  for(let t=0;t<80;t++)step(s);
  for(let a=3;a<ASSETS.length;a++){
    assert.equal(s.books[a].orders.length,0);
    for(const f of s.firms){assert.equal(f.quotes[a],null);assert.equal(f.inv[a],0);assert.equal(f.fills[a],0);}
  }
});
test('bot floors use real daily capacity and avoid filling the floor with only support when traders exist',()=>{
  const c=createCompany(13),lobby=makeLobby(c.pool,c,13);
  for(let day=2;day<=5;day++){prepareBots(lobby,1,true,day);for(const p of lobby.slice(1))assert.ok(p.company.units.filter(u=>u.deployed).length<=day+2);}
  const company={floorLimit:3,units:['maker','router','analyst','clerk','hedge','treasury'].map((id,uid)=>({id,uid,star:1,deployed:false}))};
  selectBotFloor(company,['clerk','hedge','treasury']);
  assert.ok(company.units.filter(u=>u.deployed&&['maker','router'].includes(u.id)).length>=1);
});
test('both exhibition sides have active AI and do not blindly Press an empty opportunity set',()=>{
  const c=createCompany(4),lobby=makeLobby(c.pool,c,4),matches=startExhibition(lobby,1,4,1);
  for(const match of matches){assert.ok(match.state.firms.every(f=>f.autopilot));assert.equal(match.state.active.filter(Boolean).length,1);}
  const s=createDay(['manual'],4,['manual'],null,{autopilot:[true,true]});step(s);
  assert.ok(!s.events.some(e=>e.type==='press'),'new passive quotes alone are not an edge worth crossing');
});
test('stars improve every capability family and each protector uses its own upgrade efficiency',()=>{
  for(const c of CARDS){assert.ok(unitGrade({id:c.id,star:2})>unitGrade({id:c.id,star:1}));assert.ok(unitGrade({id:c.id,star:3})>unitGrade({id:c.id,star:2}));}
  const config=(id,star)=>buildConfig([{id,star}]);
  assert.ok(config('analyst',2).noise<config('analyst',1).noise);
  assert.ok(config('sizing',2).capacity>config('sizing',1).capacity);
  assert.ok(config('maker',2).fee<config('maker',1).fee);
  assert.ok(config('execution',2).priority>config('execution',1).priority);
  const costs=[];
  for(const star of [1,2,3]){
    const s=createDay([{id:'clerk',uid:1,star},{id:'sentinel',uid:2,star:3}],14);trade(s.firms[0],0,15,100);hedge(s,0,true);
    costs.push(s.events.find(e=>e.source?.uid===1).cost);
    const m=createDay([{id:'manual',uid:1,star}],14,[],null,{autopilot:[false,false]});step(m);const q=m.events.find(e=>e.firm===0&&e.type==='quote');assert.ok(q.qty>=4);
  }
  assert.ok(costs[2]<costs[1]&&costs[1]<costs[0]);
});
test('P&L bursts and unit clashes report actual outcomes without changing simulation state',async()=>{
  const window=new Window(),doc=window.document;
  doc.body.innerHTML='<div id="desk"><article data-instance="1"></article></div><div id="opponent-floor"><article data-instance="2"></article></div><button data-asset="0"><span id="mine-0"></span><span id="theirs-0"></span></button>';
  const s=createDay([{id:'maker',uid:1,star:1}],8,[{id:'router',uid:2,star:1}]),before=snapshot(s),saved=globalThis.setTimeout;globalThis.setTimeout=()=>1;
  try {
    const feel=createMarketFeel(doc,()=>'' );feel.reset(s);s.tick=1;s.firms[0].pnl[0]=3;
    s.events=[{type:'contest',asset:0,firm:0,qty:2,source:{id:'maker',uid:1},opponent:{id:'router',uid:2},reason:'price'}];
    assert.equal(markedChanges(s,before)[0].delta,3);
    const original=JSON.stringify(s);feel.tick(s);assert.equal(JSON.stringify(s),original);
    assert.equal(doc.querySelectorAll('.pnl-burst').length,1);assert.equal(doc.querySelectorAll('.unit-clash').length,1);
    assert.equal(doc.querySelector('#desk article').classList.contains('edge-won'),true);
    assert.equal(doc.querySelector('#opponent-floor article').classList.contains('outplayed'),true);
    feel.tick(s);assert.equal(doc.querySelectorAll('.pnl-burst').length,1,'same tick is not replayed');
  } finally {globalThis.setTimeout=saved;await window.happyDOM.close();}
});
