import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifecycle,DURATIONS } from '../src/lifecycle.js';
import { createDay,step,equity } from '../src/engine.js';
import { createCompany,refreshDay,deployed } from '../src/company.js';
import { enableRegionalCompany } from '../src/board.js';
import { dayDamage } from '../src/league.js';
test('automatic lifecycle retains a full 80-tick day and a settled three-second freeze',()=>{
  const entries=[],ticks=[];let settlements=0,income=0;
  const life=createLifecycle({onEnter:p=>{entries.push(p);if(p==='closing')settlements++;if(p==='prep')income++;},onTradeTick:s=>ticks.push(s.steps)});
  life.start();assert.equal(life.can('buy'),true);life.advance(29999);assert.equal(life.phase,'prep');life.advance(1);assert.equal(life.phase,'opening');assert.equal(life.can('deploy'),false);
  life.advance(1200);assert.equal(life.phase,'live');assert.equal(life.can('operate'),true);life.advance(39999);assert.equal(ticks.length,79);life.advance(1);
  assert.equal(life.phase,'closing');assert.equal(settlements,1);assert.equal(ticks.length,80);
  life.advance(750);assert.equal(life.phase,'results');life.advance(2999);assert.equal(life.phase,'results');assert.equal(ticks.length,80);assert.equal(settlements,1);
  life.advance(1);assert.equal(life.phase,'advance');life.advance(750);assert.equal(life.phase,'prep');assert.equal(income,2);assert.equal(life.roundId,2);
  assert.deepEqual(entries,['prep','opening','live','closing','results','advance','prep']);
});
test('pause, skip, illegal commands and reset cannot bypass settlement or leak time',()=>{
  let settlements=0;const life=createLifecycle({onEnter:p=>{if(p==='closing')settlements++;}});life.start();
  assert.equal(life.skipResults(),false);assert.equal(life.chooseWeekend(),false);life.setPaused(true);life.advance(999999);assert.equal(life.snapshot().elapsed,0);assert.equal(life.ready(),false);
  life.setPaused(false);life.ready();assert.equal(life.ready(),false);life.advance(41200);assert.equal(settlements,1);assert.equal(life.skipResults(),false);life.advance(750);
  assert.equal(life.skipResults(),true);assert.equal(life.skipResults(),false);assert.equal(settlements,1);life.reset();assert.equal(life.phase,'prep');assert.equal(life.snapshot().elapsed,0);assert.equal(life.roundId,1);
});
test('weekend waits for selection and completed matches stop all automatic progression',()=>{
  let complete=false;const life=createLifecycle({nextRound:()=>complete?'complete':'weekend'});life.start();life.ready();life.advance(45700);assert.equal(life.phase,'weekend');
  life.advance(999999);assert.equal(life.phase,'weekend');assert.equal(life.can('buy'),false);assert.equal(life.chooseWeekend(),true);assert.equal(life.chooseWeekend(),false);
  complete=true;life.ready();life.advance(45700);assert.equal(life.phase,'complete');life.advance(999999);assert.equal(life.phase,'complete');assert.equal(life.ready(),false);
});
test('reduced motion removes presentation delays, never financial ticks or results hold',()=>{
  let ticks=0;const life=createLifecycle({reducedMotion:()=>true,onTradeTick:()=>ticks++});life.start();life.ready();life.advance(40000);assert.equal(life.phase,'results');assert.equal(ticks,80);life.advance(2999);assert.equal(life.phase,'results');life.advance(1);assert.equal(life.phase,'prep');
  assert.throws(()=>createLifecycle({durations:{live:20000}}),/Combat/);assert.throws(()=>life.advance(NaN),/finite/);assert.equal(DURATIONS.prep,30000);
});
test('real financial state freezes, HP settles once, and income/deployment advance once',()=>{
  const company=enableRegionalCompany(createCompany(1));company.units=[{id:'maker',uid:1,star:1,deployed:true,position:{col:0,row:0}}];company.locked=true;
  let s,health=[100,100],settlements=0,incomes=0;
  const life=createLifecycle({onEnter:p=>{
    if(p==='opening')s=createDay(deployed(company),1,['maker'],null,{marketModel:'regional',activeRegions:['equities'],roundId:'test/1'});
    if(p==='closing'){const scores=s.firms.map(f=>equity(f,s.prices)-10000);health[scores[0]<scores[1]?0:1]-=dayDamage(...scores);settlements++;}
    if(p==='prep'&&s){refreshDay(company,1,2);incomes++;}
  },onTradeTick:()=>step(s)});
  const credits=company.credits,position={...company.units[0].position},offers=[...company.offers];life.start();life.ready();life.advance(41200);assert.equal(s.done,true);assert.equal(s.tick,80);assert.equal(settlements,1);
  const frozen=JSON.stringify(s),hp=[...health];life.advance(750);life.advance(2500);assert.equal(life.phase,'results');assert.equal(JSON.stringify(s),frozen);assert.deepEqual(health,hp);assert.equal(life.can('buy'),false);
  life.skipResults();life.advance(750);assert.equal(incomes,1);assert.equal(settlements,1);assert.equal(company.credits,credits+4+Math.floor(credits/10));assert.deepEqual(company.units[0].position,position);assert.deepEqual(company.offers,offers);
  life.advance(1000);assert.equal(incomes,1);assert.equal(life.can('buy'),true);
});
test('a configurable 35-second presentation still runs all 80 financial steps',()=>{
  let ticks=0;const life=createLifecycle({durations:{prep:1000,live:35000},onTradeTick:()=>ticks++});life.start();life.advance(1000+1200+35000);assert.equal(life.phase,'closing');assert.equal(ticks,80);
});
