import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';
import { createDay,step,equity } from '../src/engine.js';
import { MARKETS,marketCells,unlockedMarkets } from '../src/markets.js';
import { replayRecord } from '../src/combat-events.js';
import { createCompany,refreshDay,deployed } from '../src/company.js';
import { enableRegionalCompany } from '../src/board.js';
import { makeLobby,prepareBots,dayDamage } from '../src/league.js';
import { progression } from '../src/progression.js';
const u=(id,uid,market,slot=0)=>({id,uid,star:1,position:marketCells(market)[slot]});
const compositions={
  hft:[u('maker',1,'equities'),u('router',2,'equities',1),u('analyst',3,'equities',2)],
  options:[u('specialist',1,'options'),u('research',2,'options',1),u('clerk',3,'options',2)],
  diversified:[u('maker',1,'equities'),u('maker',2,'options'),u('maker',3,'rates'),u('maker',4,'commodities'),u('maker',5,'fx'),u('maker',6,'credit')],
  relativeValue:[u('agency-lead',1,'rates'),u('research',2,'rates',1),u('research',3,'credit'),u('treasury',4,'rates',2)],
};
const rows=[],timings=[];let replay;
for(const [name,units] of Object.entries(compositions))for(const scenario of ['calm','trend','shock'])for(let seed=1;seed<=24;seed++)for(let seat=0;seat<2;seat++){
  const rival=compositions.diversified,s=createDay(seat?rival:units,seed,seat?units:rival,null,{marketModel:'regional',activeRegions:MARKETS.map(m=>m.id),scenario,autopilot:[true,true]});
  for(let tick=0;tick<80;tick++){
    const begin=performance.now();step(s);timings.push(performance.now()-begin);
    for(const f of s.firms){const total=equity(f,s.prices)-10000,regional=f.pnl.reduce((n,v)=>n+v,0);if(!Number.isFinite(total)||Math.abs(total-regional)>1e-6)throw Error(`Accounting failure ${name}, seed ${seed}, tick ${tick}`);}
  }
  const f=s.firms[seat],score=equity(f,s.prices)-10000,rivalScore=equity(s.firms[1-seat],s.prices)-10000;
  rows.push({name,scenario,seed,seat,score,rivalScore,fees:f.fees,fills:f.fills.reduce((n,v)=>n+v,0),regional:f.pnl});
  if(name==='diversified'&&scenario==='calm'&&seed===1&&!seat)replay=replayRecord(s);
}
const groups=Object.fromEntries(Object.keys(compositions).map(name=>[name,Object.fromEntries(['calm','trend','shock'].map(scenario=>{
  const values=rows.filter(r=>r.name===name&&r.scenario===scenario),scores=values.map(r=>r.score).sort((a,b)=>a-b),mean=key=>values.reduce((n,r)=>n+r[key],0)/values.length;
  return [scenario,{duels:values.length,meanPnl:mean('score'),profitable:scores.filter(v=>v>0).length/values.length,winRate:values.filter(r=>r.score>r.rivalScore).length/values.length,p05:scores[Math.floor(scores.length*.05)],meanFees:mean('fees'),meanFills:mean('fills')}];
}))]));
timings.sort((a,b)=>a-b);
const day1=createDay([u('maker',1,'equities'),u('research',2,'equities',1)],1,[u('maker',10,'equities'),u('router',11,'equities',1)],null,{marketModel:'regional',activeRegions:unlockedMarkets(1,1)});for(let t=0;t<80;t++)step(day1);
await writeFile('docs/audits/regional-markets.json',JSON.stringify({scope:'576 paired-seat seeded regional duels; unequal cost/floor compositions. Common market paths, not a balanced tournament or proof of fun. Headless tick timings exclude rendering; no margin/financing/market impact calibration.',groups,timing:{ticks:timings.length,meanMs:timings.reduce((n,v)=>n+v,0)/timings.length,p95Ms:timings[Math.floor(timings.length*.95)]}},null,2));
await writeFile('docs/media/regional-multi-replay.json',JSON.stringify(replay));
await writeFile('docs/media/regional-day1-replay.json',JSON.stringify(replayRecord(day1)));
const drafted=[];
for(let seed=1;seed<=24;seed++){
  const company=enableRegionalCompany(createCompany(seed)),lobby=makeLobby(company.pool,company,seed);
  for(let day=1;day<=5;day++){
    if(day>1){refreshDay(company,1,day);prepareBots(lobby,1,true,day);}const p=progression(1,day);
    for(const [a,b] of [[1,2],[3,4],[5,6]]){
      const s=createDay(deployed(lobby[a].company),seed+day*31,deployed(lobby[b].company),null,{marketModel:'regional',activeRegions:p.marketIds,scenario:p.scenario,autopilot:[true,true]});
      for(let t=0;t<80;t++)step(s);const scores=s.firms.map(f=>equity(f,s.prices)-10000);
      for(const [i,f] of s.firms.entries())if(Math.abs(scores[i]-f.pnl.reduce((n,v)=>n+v,0))>1e-6)throw Error('Drafted bot reconciliation failed');
      lobby[scores[0]<scores[1]?a:b].health-=dayDamage(...scores);drafted.push({day,scores});
    }
  }
}
const draftedByDay=[1,2,3,4,5].map(day=>{const ds=drafted.filter(d=>d.day===day),scores=ds.flatMap(d=>d.scores);return {day,duels:ds.length,meanPnl:scores.reduce((n,v)=>n+v,0)/scores.length,profitable:scores.filter(v=>v>0).length/scores.length,bothNonPositive:ds.filter(d=>d.scores.every(v=>v<=0)).length/ds.length};});
await writeFile('docs/audits/regional-bots.json',JSON.stringify({scope:'360 actual drafted-bot duels through the full regional week; real shared pool, income and upgrades. 24 seeds, three pairings/day, no human player. Checks final regional accounting; not a seat-balanced tournament.',byDay:draftedByDay},null,2));
console.log(JSON.stringify({groups,ticks:timings.length,meanTickMs:timings.reduce((n,v)=>n+v,0)/timings.length},null,2));
