import { writeFile } from 'node:fs/promises';
import { createDay,step,equity } from '../src/engine.js';
import { byId } from '../src/roster.js';
const rosters={liquidity:['maker','router','sizing','clerk'],fast:['research','liquidity','maker'],momentum:['broker','manual','macro'],reversion:['value-clerk','value-analyst','value-lead'],relative:['agency-lead','agency-clerk','agency-trader'],volatility:['specialist','maker','clerk']};
const samples=30,rows=[],contributions={},regimes=['calm','trend','shock'];
for(const regime of regimes)for(const [name,ids] of Object.entries(rosters)) {
  const values=[],drawdowns=[],fees=[],exposure=[];let wins=0;
  for(let seed=1;seed<=samples;seed++)for(const seat of [0,1]) {
    const rival=rosters.liquidity,s=createDay(seat?rival:ids,seed,seat?ids:rival,null,{scenario:regime,activeMarkets:5,autopilot:[true,true]});let peak=equity(s.firms[seat],s.prices)-10000,worst=0;
    for(let tick=0;tick<80;tick++){step(s);const value=equity(s.firms[seat],s.prices)-10000;peak=Math.max(peak,value);worst=Math.max(worst,peak-value);}
    const f=s.firms[seat],value=equity(f,s.prices)-10000;values.push(value);fees.push(f.fees);drawdowns.push(worst);exposure.push(f.riskStats.gross);if(value>equity(s.firms[1-seat],s.prices)-10000)wins++;
    for(const [id,a] of Object.entries(f.unitLedger)){const key=a.source?.id;if(!key)continue;(contributions[key]??=[]).push(a.cash+a.inv.reduce((n,q,i)=>n+q*s.prices[i],0));}
  }
  const mean=xs=>xs.reduce((n,v)=>n+v,0)/xs.length;values.sort((a,b)=>a-b);
  rows.push({composition:name,regime,cost:ids.reduce((n,id)=>n+byId(id).cost,0),slots:ids.length,runs:values.length,winPct:wins/values.length*100,meanPnL:mean(values),p05PnL:values[Math.floor(values.length*.05)],meanDrawdown:mean(drawdowns),meanFees:mean(fees),meanClosingGross:mean(exposure)});
}
const report={method:'30 common seeds, both seats, identical opportunity-gated autonomous controls, all five markets; each roster versus the same liquidity benchmark. All rosters cost six credits, but use three or four slots. No shop progression or player skill. Descriptive paired diagnostics, not confidence intervals or causal unit ablations.',duels:rows.reduce((n,r)=>n+r.runs,0),rows,unitOrderStreams:Object.fromEntries(Object.entries(contributions).map(([id,xs])=>[id,{samples:xs.length,meanPnL:xs.reduce((n,v)=>n+v,0)/xs.length}]))};
await writeFile('docs/audits/compositions-overhaul.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
