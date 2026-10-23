import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';
import { createDay,step } from '../src/engine.js';
const roster=['maker','router','sizing','manual','research','clerk','execution'].map((id,i)=>({id,star:i%3===0?2:1})),samples=[];
for(let n=0;n<100;n++) {
  const states=Array.from({length:4},(_,i)=>createDay(roster,n*4+i,roster,null,{activeMarkets:5,autopilot:[true,true]}));
  for(let t=0;t<80;t++) {const start=performance.now();states.forEach(step);const ms=performance.now()-start;if(n>=10)samples.push(ms);}
}
samples.sort((a,b)=>a-b);
const result={scope:'Simulation only: four simultaneous duels, seven units per side, five active markets. First ten groups excluded for warm-up; no rendering, audio, or DOM effects.',samples:samples.length,meanMs:samples.reduce((a,b)=>a+b)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)],p99Ms:samples[Math.floor(samples.length*.99)],gameTickMs:500};
await writeFile('docs/audits/performance-daily-ramp.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
