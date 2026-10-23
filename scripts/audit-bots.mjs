import { writeFile,mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createPool,createCompany } from '../src/company.js';
import { makeLobby,prepareBots,botUnits } from '../src/league.js';
import { createDay,step,equity,ASSETS } from '../src/engine.js';
const runs=Number(process.env.BOT_AUDIT_RUNS||50),rows=[];
if(!Number.isInteger(runs)||runs<1)throw Error('BOT_AUDIT_RUNS must be positive');
const schedule=[['calm',3],['calm',3],['trend',4],['calm',5],['shock',5]];
for(let day=1;day<=5;day++)rows.push({day,duels:0,profitable:0,firmResults:0,sum:0,bothNonPositive:0,slots:0,markets:0});
for(let seed=1;seed<=runs;seed++) {
  const pool=createPool(),human=createCompany(seed,pool),lobby=makeLobby(pool,human,seed);
  for(let day=1;day<=5;day++) {
    if(day>1)prepareBots(lobby,1,true,day);
    const [scenario,activeMarkets]=schedule[day-1],r=rows[day-1];
    for(let index=1;index<8;index++) {
      const next=index===7?1:index+1,left=botUnits(lobby[index],1),right=botUnits(lobby[next],1);
      const s=createDay(left,seed*101+day,right,null,{scenario,activeMarkets,autopilot:[true,true]});
      for(let t=0;t<80;t++)step(s);
      const p=s.firms.map(f=>equity(f,s.prices)-10000);
      if(p.some(x=>!Number.isFinite(x)))throw Error('Invalid bot score');
      r.duels++;r.firmResults+=2;r.profitable+=p.filter(x=>x>0).length;r.sum+=p[0]+p[1];r.bothNonPositive+=p.every(x=>x<=0)?1:0;
      r.slots+=left.length+right.length;r.markets+=s.active?s.active.filter(Boolean).length:ASSETS.length;
    }
  }
}
const report={runs,method:'Actual shared-pool bot purchases, daily recruitment, star merging, each of seven bots versus its next neighbor. Same seeded five-day scenario schedule; no elimination, items, or human play. Matched seeds repeat across days and pairs.',rows:rows.map(r=>({day:r.day,duels:r.duels,profitablePct:+(r.profitable/r.firmResults*100).toFixed(1),meanPnL:+(r.sum/r.firmResults).toFixed(2),bothNonPositivePct:+(r.bothNonPositive/r.duels*100).toFixed(1),averageDeployed:+(r.slots/r.firmResults).toFixed(2),markets:r.markets/r.duels}))};
const output=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(output){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
