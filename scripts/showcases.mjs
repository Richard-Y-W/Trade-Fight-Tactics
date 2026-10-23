// Offline replay renderer, not a screen recorder. All values come from the game engine.
import { mkdir,writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import ffmpeg from 'ffmpeg-static';
import { createDay,step,equity,ASSETS } from '../src/engine.js';
import { createBattleObserver } from '../src/battle-readout.js';

const out=new URL('../docs/media/',import.meta.url);await mkdir(out,{recursive:true});
const specifications=[
  {name:'opening-bell',title:'Monday / The opening bell',seed:284,scenario:'calm',markets:3,left:['maker','router','analyst'],right:['manual','clerk','agency-clerk']},
  {name:'friday-stress',title:'Friday / Under pressure',seed:221,scenario:'shock',markets:5,left:['maker','research','hedge','execution','liquidity','router','clerk'],right:['manual','broker','macro','sizing','prime','analyst','agency-trader']},
];
const green='#8ee8ac',blue='#85beff',ink='#e8efdf',muted='#acbba9';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const cash=n=>`${n<0?'-':'+'}$${Math.abs(n).toFixed(2)}`;
const text=(x,y,s,size=16,color=ink,weight=400)=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(s)}</text>`;
function render(s,view,spec) {
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800"><rect width="1280" height="800" fill="#0e1713"/><g font-family="Arial">`;
  svg+=text(36,35,'TRADE FIGHT TACTICS / ENGINE REPLAY',13,'#c5f677',700)+text(36,75,spec.title,29,ink,700)+text(935,35,'SEEDED ENGINE EVENTS · 1× SPEED',12,muted)+text(935,76,`${s.done?'CLOSING BELL':`${(40-s.tick/2).toFixed(1)}s TO CLOSE`}`,23);
  const score=s.firms.map(f=>equity(f,s.prices)-10000);
  for(let side=0;side<2;side++) {
    const x=36+side*620,color=side?blue:green,f=view.firms[side];
    svg+=`<rect x="${x}" y="98" width="588" height="106" rx="6" fill="#1a2820" stroke="${color}" stroke-opacity=".4"/>`+text(x+18,122,side?'COBALT / RIVAL':'MINT / YOUR DESK',12,color,700)+text(x+18,162,cash(score[side]),34,color,700)+text(x+235,140,`Trades & costs ${cash(f.trades)}`,16)+text(x+235,167,`Holding moves ${cash(f.holding)}`,16)+text(x+18,190,`${s.firms[side].fills.reduce((n,v)=>n+v,0)} filled · ${f.pressure}% inventory pressure`,12,muted);
  }
  const active=s.active.flatMap((v,a)=>v?[a]:[]),width=1208/active.length;
  for(const [i,a] of active.entries()) {
    const x=36+i*width,h=s.history[a],lo=Math.min(...h)-.08,hi=Math.max(...h)+.08;
    svg+=`<rect x="${x}" y="223" width="${width-10}" height="219" rx="5" fill="#203029"/>`+text(x+15,248,ASSETS[a].ticker,12,muted,700)+text(x+15,275,ASSETS[a].name,active.length>3?19:25,ink,700)+text(x+15,300,`$${s.prices[a].toFixed(2)}`,16);
    const points=h.map((p,t)=>`${x+15+t/80*(width-40)},${365-(p-lo)/(hi-lo)*55}`).join(' ');
    svg+=`<polyline points="${points}" fill="none" stroke="#b5c8a2" stroke-width="2"/>`+text(x+15,397,cash(s.firms[0].pnl[a]),18,green,700)+text(x+15,425,cash(s.firms[1].pnl[a]),18,blue,700);
  }
  for(let side=0;side<2;side++) {
    const x=36+side*620,color=side?blue:green,f=view.firms[side];
    svg+=text(x,470,side?'RIVAL FLOOR':'YOUR FLOOR',12,color,700);
    f.rows.forEach((r,i)=>{
      const y=488+i*29,role=r.card.capability;
      const metric=role==='research'?`${r.activity.signals} estimates`:role==='hedge'?`${r.activity.hedged} trimmed / $${r.activity.cost.toFixed(2)} cost`:`${cash(r.net)} / ${r.activity.fills} filled`;
      svg+=text(x+5,y,r.card.name,14,ink)+text(x+290,y,metric,14,color);
    });
  }
  svg+=`<rect x="36" y="712" width="1208" height="64" rx="5" fill="#243323"/>`;
  const event=view.recent[0];
  const leader=score[0]>=score[1]?'Mint':'Cobalt';
  svg+=text(51,736,s.done?`${leader} takes the day · net marked P&L after costs`:'WHAT JUST HAPPENED',13,'#c5f677',700);
  svg+=text(51,760,(event?.text||'Orders compete in persistent price / time queues. Volume is not guaranteed profit.').slice(0,145),14,event?.side?blue:green);
  return svg+'</g></svg>';
}
async function encode(args) {
  const child=spawn(ffmpeg,args,{stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',b=>error+=b);
  const [code]=await once(child,'close');if(code)throw new Error(error);
}
const manifest=[];
for(const spec of specifications) {
  const units=(ids,offset)=>ids.map((id,i)=>({id,uid:offset+i,star:1}));
  const s=createDay(units(spec.left,1),spec.seed,units(spec.right,101),null,{scenario:spec.scenario,activeMarkets:spec.markets,autopilot:[true,true]});
  const observe=createBattleObserver();let view=observe(s),trace=[];
  const output=new URL(`${spec.name}.mp4`,out);
  const child=spawn(ffmpeg,['-y','-loglevel','error','-f','image2pipe','-framerate','2','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',fileURLToPath(output)],{stdio:['pipe','ignore','pipe']});
  let error='';child.stderr.on('data',b=>error+=b);child.stdin.on('error',()=>{});const completion=once(child,'close');
  for(let tick=0;tick<=88;tick++) {
    if(tick>0&&!s.done){step(s);view=observe(s);trace.push({tick:s.tick,prices:s.prices,scores:s.firms.map(f=>equity(f,s.prices)-10000),events:s.events});}
    const png=new Resvg(render(s,view,spec),{font:{loadSystemFonts:true}}).render().asPng();
    if(!child.stdin.write(png))await once(child.stdin,'drain');
    if(tick===40)await writeFile(new URL(`${spec.name}.png`,out),png);
  }
  child.stdin.end();const [code]=await completion;if(code)throw new Error(error);
  const file=fileURLToPath(output);
  await encode(['-y','-loglevel','error','-ss','5','-i',file,'-t','10','-vf','fps=4,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse','-loop','0',fileURLToPath(new URL(`${spec.name}.gif`,out))]);
  await encode(['-v','error','-i',file,'-f','null','-']);
  manifest.push({...spec,autopilot:[true,true],star:1,frames:89,durationSeconds:44.5,render:'Offline SVG engine replay; not an application screen recording',traceSha256:createHash('sha256').update(JSON.stringify(trace)).digest('hex'),scores:s.firms.map(f=>equity(f,s.prices)-10000)});
  console.log(`Rendered and decoded ${spec.name}.mp4`);
}
await writeFile(new URL('manifest.json',out),JSON.stringify(manifest,null,2)+'\n');
