import { ASSETS } from './engine.js';
import { byId,traitLevel } from './roster.js';
import { policyFor } from './strategies.js';
export function unitMetrics(s,side,u) {
  const f=s.firms[side],a=f.unitLedger[u.uid??u.id],activity=f.activity[u.uid??u.id]||{},card=byId(u.id);
  const inventory=a?.inv||ASSETS.map(()=>0),realized=(a?.realized||[]).reduce((n,v)=>n+v,0),unrealized=inventory.reduce((n,q,i)=>n+q*(s.prices[i]-(a?.basis?.[i]||0)),0),fees=a?.fees||0;
  const net=a?a.cash+inventory.reduce((n,q,i)=>n+q*s.prices[i],0):0;
  const gross=inventory.reduce((n,q,i)=>n+Math.abs(q*s.prices[i]),0),common=inventory.reduce((n,q,i)=>n+q*ASSETS[i].beta,0);
  const contracts=f.contracts?.filter(c=>(c.source.uid??c.source.id)===(u.uid??u.id))||[];
  let advice=net<0&&activity.fills>0?'Fills are not profit. Review inventory direction and use Defensive stance to reduce new size.':activity.quotes>0&&!activity.fills?'Offers are not filling. Check competition and whether this strategy is too selective.':'Compare this unit across several days before changing the build.';
  if(card.capability==='research')advice=`${activity.signalCorrect||0}/${activity.signalChecked||0} estimates matched the next public move. This is a directional proxy, not causal profit.`;
  if(card.capability==='hedge')advice=u.id==='clerk'?'Blocks additional exposure above its threshold; emergency trimming still costs money.':`${activity.hedged||0} units trimmed for $${(activity.cost||0).toFixed(2)}. Lower exposure also sacrifices possible upside.`;
  if(contracts.length)advice='Pays both option premiums. Needs a large closing move in either direction; no intraday option valuation.';
  return {unit:u,card,policy:policyFor(card),net,realized,unrealized,fees,hedgeCost:a?.hedgeCost||0,inventory,gross,common,activity,contracts,optionNet:a?.optionNet||0,advice,traits:card.traits.filter(t=>traitLevel(f.config.counts[t]||0,t)>0)};
}
export function closingAnalysis(s,side=0) {
  const rows=s.firms[side].units.map(u=>unitMetrics(s,side,u)),traders=rows.filter(r=>!['research','hedge'].includes(r.card.capability)||r.contracts.length),support=rows.filter(r=>['research','hedge'].includes(r.card.capability));
  const top=[...traders].sort((a,b)=>b.net-a.net)[0],weak=[...traders].sort((a,b)=>a.net-b.net)[0],risk=[...rows].sort((a,b)=>b.gross-a.gross)[0];
  const helper=[...support].sort((a,b)=>(b.activity.hedged||0)-(a.activity.hedged||0)||(b.activity.guarded||0)-(a.activity.guarded||0)||(b.activity.signalChecked||0)-(a.activity.signalChecked||0))[0];
  const events=(s.replay||[]).filter(e=>e.firm===side&&['hedge','contest'].includes(e.type));
  const moment=[...events].sort((a,b)=>(b.qty||0)-(a.qty||0))[0];
  return {rows,top,weak,risk,helper,moment,advice:weak?.advice||'Deploy a trading unit to create an order stream.'};
}
export function buildSummary(s,side=0){const f=s.firms[side];return {strengths:[f.config.cadence===1?'Fast quote refresh':null,f.cards.includes('research')?'Private research':null,f.units.some(u=>u.id==='clerk')?'Inventory guard':null,f.cards.includes('hedge')?'Paid risk reduction':null].filter(Boolean),weaknesses:[!f.cards.includes('research')?'Public observations only':null,f.fees>5?'Costs accumulating':null,f.risk>70?'Little inventory room':null].filter(Boolean)};}
