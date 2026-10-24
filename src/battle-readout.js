import { equity } from './engine.js';
import { byId, TRAITS, traitLevel } from './roster.js';
import { unitMetrics } from './analytics.js';

const keyOf=u=>String(u.uid??u.id);
const money=n=>`${n<0?'−':'+'}$${Math.abs(n).toFixed(2)}`;
const marked=(account,prices,instruments)=>account?account.cash+account.inv.reduce((n,q,a)=>n+q*prices[a]*(instruments[a].multiplier||1),0):0;

// Presentation-only observer. Holding P&L uses inventory held BEFORE each price move.
// The residual includes executions, slippage and fees; it is not a causal alpha estimate.
export function createBattleObserver() {
  let current=null,previous=null,carry=[{},{}],recent=[];
  return function observe(s) {
    if(current!==s){current=s;previous=null;carry=[{},{}];recent=[];}
    if(previous&&s.tick!==previous.tick) {
      previous.accounts.forEach((accounts,side)=>{
        for(const [key,inv] of Object.entries(accounts))carry[side][key]=(carry[side][key]||0)+inv.reduce((n,q,a)=>n+q*(s.prices[a]-previous.prices[a])*(s.instruments[a].multiplier||1),0);
      });
      const candidates=s.events.filter(e=>['contest','hedge','limit'].includes(e.type)&&e.source);
      const rank={hedge:3,contest:2,limit:1};candidates.sort((a,b)=>rank[b.type]-rank[a.type]||(b.qty||0)-(a.qty||0));
      const e=candidates[0];
      if(e) {
        const who=byId(e.source.id).name,market=s.instruments[e.asset]?.ticker||'desk';
        const text=e.type==='contest'?`${who} beat ${byId(e.opponent.id).name} on ${e.reason==='price'?'price':'queue priority'} · ${e.qty} ${market} filled. Volume, not profit.`:e.type==='hedge'?`${who} trimmed ${e.qty} ${market} · paid $${e.cost.toFixed(2)}. Exposure reduced.`:`${who} cannot quote ${market}: inventory capacity is reserved or full.`;
        // Keep a readable four-second beat instead of replacing commentary every fill.
        if(!recent.length||s.tick-recent[0].tick>=8)recent.unshift({tick:s.tick,side:e.firm,text});
        recent=recent.slice(0,3);
      }
    }
    previous={tick:s.tick,prices:[...s.prices],accounts:s.firms.map(f=>Object.fromEntries(Object.entries(f.unitLedger).map(([k,a])=>[k,[...a.inv]])))};
    const firms=s.firms.map((f,side)=>{
      const rows=f.units.map(u=>{
        const key=keyOf(u),card=byId(u.id),account=f.unitLedger[key],activity=f.activity[key]||{},net=marked(account,s.prices,s.instruments),holding=carry[side][key]||0;
        const optionNet=account?.optionNet||0;
        return {key,unit:u,card,activity,net,holding,optionNet,trades:net-holding-optionNet,inventory:account?.inv||s.instruments.map(()=>0)};
      });
      const accounts=Object.keys(f.unitLedger),holding=Object.values(carry[side]).reduce((n,v)=>n+v,0),net=equity(f,s.prices)-10000;
      const ledger=accounts.reduce((n,k)=>n+marked(f.unitLedger[k],s.prices,s.instruments),0);
      const optionNet=Object.values(f.unitLedger).reduce((n,a)=>n+(a.optionNet||0),0);
      return {rows,net,holding,trades:ledger-holding-optionNet,other:net-ledger+optionNet,pressure:f.risk,noise:f.config.noise,counts:f.config.counts,links:f.supportLinks};
    });
    return {firms,recent};
  };
}

export function teamworkFor(row,firm) {
  const traders=firm.rows.filter(r=>!['research','hedge'].includes(r.card.capability));
  const partners=firm.rows.filter(r=>r.key!==row.key&&r.card.traits.some(t=>row.card.traits.includes(t)&&traitLevel(firm.counts[t]||0,t)>0));
  const traits=row.card.traits.filter(t=>traitLevel(firm.counts[t]||0,t)>0);
  const reachable=(kind,direction='target')=>(firm.links||[]).filter(e=>e.kind===kind&&String(e[direction].uid??e[direction].id)===row.key);
  const support=row.card.capability==='research'?`Prices offers for ${reachable('research','source').length} trading units in local range. Estimates can be wrong or late, not a forecast guarantee.`:row.card.capability==='hedge'?`${reachable('risk','source').length} monitored traders. ${row.activity.hedged||0} units reduced; $${(row.activity.cost||0).toFixed(2)} cost. No guaranteed losses avoided.`:`Owns these trades. ${reachable('research').length} connected research units; ${reachable('risk').length} local risk units. Inspect the recorded route for actual arrival timing.`;
  return {partners,traits,support};
}

export function createBattleReadout(root=document) {
  const observe=createBattleObserver();let focus=null,model=null,state=null;
  root.addEventListener('watch-unit',e=>{focus=e.detail;render();});
  root.addEventListener('click',e=>{
    const pick=e.target.closest?.('[data-watch-unit]');
    if(pick){focus={side:Number(pick.dataset.watchSide),key:pick.dataset.watchUnit};render();return;}
    const floor=e.target.closest?.('#desk [data-instance],#opponent-floor [data-instance]');
    if(floor){focus={side:floor.closest('#opponent-floor')?1:0,key:floor.dataset.instance};render();}
  });
  function render() {
    const el=root.getElementById('battle-readout');if(!el||!model)return;
    const inspectionOpen=!!el.querySelector('.inspection-advanced')?.open,momentsOpen=!!el.querySelector('.battle-moments')?.open;
    const {firms,recent}=model;
    if(!state.tick&&!focus){el.innerHTML='<div class="readout-intro"><b>Follow the edge.</b><span>Select a floor unit to inspect its local support, positions and accounting. Volume ≠ profit.</span></div>';return;}
    const side=focus?.side??0,firm=firms[side];
    const row=firm.rows.find(r=>r.key===focus?.key)||[...firm.rows].sort((a,b)=>Math.abs(b.net)-Math.abs(a.net))[0];
    if(!row)return;
    const team=teamworkFor(row,firm);
    const metrics=unitMetrics(state,side,row.unit);
    el.innerHTML=`<div class="readout-heading"><b>FOLLOW THE EDGE</b><span>Live attribution · select any floor unit</span></div><div class="driver-grid">${firms.map((f,i)=>`<section class="driver side-${i}"><b>${i?'COBALT':'MINT'} · ${money(f.net)}</b><div><span>Trades & costs <strong>${money(f.trades)}</strong></span><span>Holding moves <strong>${money(f.holding)}</strong></span>${Math.abs(f.other)>.005?`<span>Option / other <strong>${money(f.other)}</strong></span>`:''}</div><small>${f.pressure}% inventory pressure · fills can still lose</small></section>`).join('')}</div><div class="watch-unit side-${side}"><div class="watch-heading"><b>${row.card.name}</b><span>${row.card.combatRole}</span></div><p>${team.support}</p>${['research','hedge'].includes(row.card.capability)?'':`<div class="unit-drivers"><span>Net <b>${money(row.net)}</b></span><span>Trades & costs ${money(row.trades)}</span><span>Holding moves ${money(row.holding)}</span><span>${row.activity.fills||0} filled</span></div><small>Positions: ${row.inventory.map((q,a)=>q?`${state.instruments[a].ticker} ${q>0?'+':''}${q}`:'').filter(Boolean).join(' · ')||'flat'}</small>`}<div class="team-links">${team.traits.map(t=>`<span title="${TRAITS[t].effects[traitLevel(firm.counts[t],t)-1]}">${t} active</span>`).join('')}${team.partners.map(r=>`<button data-watch-side="${side}" data-watch-unit="${r.key}">↔ ${r.card.name}</button>`).join('')||'<small>No shared active trait partners.</small>'}</div></div><details class="battle-moments"><summary>What just happened · ${recent.length} moments</summary>${recent.map(e=>`<p class="side-${e.side}"><b>${(e.tick/2).toFixed(1)}s · ${e.side?'COBALT':'MINT'}</b> ${e.text}</p>`).join('')||'<p>Waiting for a contested order or risk event.</p>'}</details>`;
    const detail=root.createElement('details');detail.className='inspection-advanced';
    detail.open=inspectionOpen;
    detail.innerHTML=`<summary>${metrics.policy} · accounting & advice</summary><p>${metrics.advice}</p><div class="unit-drivers"><span>Realized ${money(metrics.realized)}</span><span>Open position ${money(metrics.unrealized)}</span><span>Fees $${metrics.fees.toFixed(2)}</span><span>Hedge cost included $${metrics.hedgeCost.toFixed(2)}</span><span>Gross $${metrics.gross.toFixed(0)}</span></div><small>Hedge cost is already reflected in net P&L; do not subtract it again. Equipment: not implemented. Assigned region only, except supported cross-market strategies.</small>`;
    el.querySelector('.watch-unit').append(detail);
    const route=root.createElement('p');route.textContent=`Base network ${metrics.networkMs}ms. ${metrics.lastRoute?`Last intent: created ${metrics.lastRoute.createdTick*500}ms, arrival ${metrics.lastRoute.arrivalTick*500}ms; effective latency ${metrics.lastRoute.latencyMs}ms.`:'No trading intent yet.'}`;detail.append(route);
    el.querySelector('.battle-moments').open=momentsOpen;
    root.querySelectorAll('.watch-focused,.watch-partner').forEach(n=>n.classList.remove('watch-focused','watch-partner'));
    for(const [r,cls] of [[row,'watch-focused'],...team.partners.map(r=>[r,'watch-partner'])]) {
      const selector=r.unit.uid==null?`[data-unit-id="${r.unit.id}"]`:`[data-instance="${r.unit.uid}"]`;
      root.querySelector(`${side?'#opponent-floor':'#desk'} ${selector}`)?.classList.add(cls);
    }
  }
  return {paint(s){if(state!==s)focus=null;state=s;model=observe(s);render();},get model(){return model;}};
}
