import { writeFile } from 'node:fs/promises';
import { createDay,step,equity } from '../src/engine.js';
const rosters={HFT:['execution','liquidity','maker','router','agency-pm'],Research:['execution','research','analyst','adaptive','router'],Defensive:['maker','clerk','hedge','treasury','value-pm'],Managers:['maker','treasury','treasury','treasury','treasury']};
const cluster=[{col:3,row:0},{col:4,row:1},{col:2,row:1},{col:3,row:2},{col:4,row:0}],spread=[{col:0,row:3},{col:7,row:3},{col:0,row:0},{col:7,row:0},{col:4,row:2}];
const samples=20,rows=[];
for(const scenario of ['calm','trend','shock'])for(const [name,ids] of Object.entries(rosters))for(const formation of ['cluster','dispersed']){
  const scores=[],fees=[],latencies=[],quotes=[],fills=[],drawdowns=[];let wins=0,support=0;
  for(let seed=1;seed<=samples;seed++)for(const seat of [0,1]){
    const make=(list,positions)=>list.map((id,i)=>({id,uid:i+1,star:1,position:{...positions[i]}})),own=make(ids,formation==='cluster'?cluster:spread),rival=make(rosters.HFT,cluster),s=createDay(seat?rival:own,seed,seat?own:rival,null,{scenario,autopilot:[true,true],activeMarkets:5});let high=0,dd=0;
    for(let t=0;t<80;t++){step(s);const p=equity(s.firms[seat],s.prices)-10000;high=Math.max(high,p);dd=Math.max(dd,high-p);}
    const f=s.firms[seat],p=equity(f,s.prices)-10000,events=s.replay.filter(e=>e.firm===seat);scores.push(p);fees.push(f.fees);fills.push(f.fills.reduce((n,v)=>n+v,0));quotes.push(events.filter(e=>e.type==='quote').length);drawdowns.push(dd);support+=events.filter(e=>e.type==='support_applied').length;
    const routes=events.filter(e=>e.type==='order_routed');latencies.push(routes.reduce((n,e)=>n+e.latencyMs,0)/Math.max(1,routes.length));if(p>equity(s.firms[1-seat],s.prices)-10000)wins++;
  }
  const mean=a=>a.reduce((n,v)=>n+v,0)/a.length;rows.push({composition:name,formation,scenario,duels:scores.length,meanPnL:mean(scores),winPct:wins/scores.length*100,meanFees:mean(fees),meanDrawdown:mean(drawdowns),meanFills:mean(fills),meanQuoteUpdates:mean(quotes),meanRoutingMs:mean(latencies),supportEvents:support});
}
const report={method:'Four five-unit reference compositions, clustered/dispersed positions, 20 common seeds, both seats, three authored regimes, identical autonomous controls, all markets, versus clustered HFT. Costs differ; these are formation/behavior diagnostics, not an equal-cost meta or independent statistical trial. Manager composition deliberately duplicates manager identities. No human skill or fun is measured.',duels:rows.reduce((n,r)=>n+r.duels,0),rosters,cluster,dispersed:spread,rows};
await writeFile('docs/audits/battlefield-formations.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({duels:report.duels,rows},null,2));
