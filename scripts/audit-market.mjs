import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ASSETS,SCENARIOS,createDay,step,equity,command } from '../src/engine.js';
import { byId } from '../src/roster.js';

const trials=Number(process.env.AUDIT_TRIALS||100);
if(!Number.isInteger(trials)||trials<1)throw Error('AUDIT_TRIALS must be a positive integer');
const builds={
  'Systematic research':['analyst','hedge','research'],
  'HFT active':['research','liquidity','manual'],
  'Macro active':['manual','broker','macro'],
  'Portfolio risk':['clerk','sizing','hedge'],
  'Systematic balanced':['analyst','hedge','router'],
  'Liquidity research':['maker','router','macro'],
};
function operate(s,policy) {
  const f=s.firms[0];
  if(policy==='idle')return;
  if(f.cards.includes('manual')&&!f.cooldown&&f.risk<60)command(s,'press');
  if(policy==='trend tilt' && s.tick%8===0 && (f.cards.includes('research')||f.cards.includes('directional'))) {
    const history=s.history[0],move=history.at(-1)-history[Math.max(0,history.length-9)];
    const target=Math.abs(move)<.1?0:Math.sign(move);
    for(let i=0;i<3 && f.lean!==target;i++)command(s,'lean');
  }
}
function play(left,right,seed,scenario,policy='press') {
  const s=createDay(left,seed,right,null,scenario?{scenario}:{});
  let maxDrawdown=0,peak=10000;
  for(let t=0;t<80;t++) {
    operate(s,policy);step(s);
    for(const f of s.firms) {
      if(f.inv.some(q=>Math.abs(q)>f.config.capacity+1e-8))throw Error('Inventory bound violation');
      const p=equity(f,s.prices)-10000,ledger=f.pnl.reduce((a,b)=>a+b,0)-f.fees;
      if(!Number.isFinite(p)||Math.abs(ledger-p)>1e-7)throw Error('Ledger reconciliation failure');
    }
    const value=equity(s.firms[0],s.prices);peak=Math.max(peak,value);maxDrawdown=Math.max(maxDrawdown,peak-value);
  }
  return {scores:s.firms.map(f=>equity(f,s.prices)-10000),maxDrawdown,unfilled:s.firms[0].stats.unfilled,requested:s.firms[0].stats.requests};
}
const rows=[],scenarioRows=[],names=Object.keys(builds);
let simulatedDays=0;
function compare(i,j,scenario) {
  let wins=0,draws=0,gap=0,first=0,second=0,unfilled=0,requested=0,profitable=0,opponentProfitable=0,bothProfitable=0,neitherProfitable=0;
  for(let seed=1;seed<=trials;seed++)for(const mirrored of [false,true]) {
    const a=builds[names[i]],b=builds[names[j]],r=play(mirrored?b:a,mirrored?a:b,seed,scenario);simulatedDays++;
    const scores=mirrored?[r.scores[1],r.scores[0]]:r.scores,delta=scores[0]-scores[1];
    if(Math.abs(delta)<.005)draws++;else if(delta>0)wins++;
    gap+=delta;first+=scores[0];second+=scores[1];unfilled+=r.unfilled;requested+=r.requested;
    if(scores[0]>0)profitable++;if(scores[1]>0)opponentProfitable++;
    if(scores.every(p=>p>0))bothProfitable++;if(scores.every(p=>p<=0))neitherProfitable++;
  }
  const games=trials*2,pct=n=>+(n/games*100).toFixed(1);
  return {build:names[i],opponent:names[j],scenario:scenario||'seed-mixed',games,winRate:+(wins/games*100).toFixed(1),draws,meanGap:+(gap/games).toFixed(2),meanPnL:+(first/games).toFixed(2),opponentMeanPnL:+(second/games).toFixed(2),profitablePct:pct(profitable),opponentProfitablePct:pct(opponentProfitable),bothProfitablePct:pct(bothProfitable),neitherProfitablePct:pct(neitherProfitable),unfilledRequestPct:+(unfilled/requested*100).toFixed(1)};
}
for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++) {
  rows.push(compare(i,j));
  for(const scenario of Object.keys(SCENARIOS))scenarioRows.push(compare(i,j,scenario));
}
const policyComparisons=[];
for(const name of ['HFT active','Macro active']) {
  const roster=builds[name],baseline=builds['Systematic research'];
  for(const policy of ['press','trend tilt']) {
    let delta=0,improved=0;
    for(let seed=1;seed<=trials;seed++) {
      const idle=play(roster,baseline,seed,undefined,'idle'),active=play(roster,baseline,seed,undefined,policy);simulatedDays+=2;
      const change=active.scores[0]-idle.scores[0];delta+=change;if(change>.005)improved++;
    }
    policyComparisons.push({build:name,policy,pairedSeeds:trials,meanPnLChange:+(delta/trials).toFixed(2),improvedPct:+(improved/trials*100).toFixed(1)});
  }
}
const report={
  version:'five-market model, explicit AI controls and modest star grades',trialsPerSeat:trials,simulatedDays,
  method:'All rosters cost 6 credits and occupy 3 slots, with all five markets active. Same seeds and both seat assignments per matchup. Left policy presses whenever cooldown and inventory allow; right AI uses opportunity-gated Press and observed-history inventory targets when capable. Seat mirroring mixes these policies; this does not isolate build effects. Policy comparisons additionally test idle and lagged trend tilt. Synthetic scenarios, not real-market calibration. No shop, daily ramp, adaptation, items, or human skill is modeled; use audit:bots for actual drafted AI rosters.',
  rosters:Object.fromEntries(names.map(name=>[name,builds[name].map(id=>({id,name:byId(id).name,cost:byId(id).cost}))])),
  assets:ASSETS.map(({ticker,beta,vol,customerWidth,flow})=>({ticker,beta,vol,customerWidth,flow})),rows,scenarioRows,policyComparisons,
};
const output=process.argv.find(arg=>arg.startsWith('--out='))?.slice(6);
if(output){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({simulatedDays,rows,policyComparisons,output:output||null},null,2));
