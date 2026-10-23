import { byId } from './roster.js';
import { depth } from './orderbook.js';

export function paintUnitActivity(state,root=document) {
  state.firms.forEach((f,side)=>{
    for(const u of f.units) {
      const key=u.uid??u.id,selector=u.uid==null?`[data-unit-id="${u.id}"]`:`[data-instance="${u.uid}"]`;
      const el=root.querySelector(`${side?'#opponent-floor':'#desk'} ${selector}`);if(!el)continue;
      const target=el.querySelector('.unit-metrics');if(!target)continue;
      const a=f.activity[key],c=byId(u.id),ledger=f.unitLedger[key];if(!a)continue;
      if(c.capability==='research')target.textContent=`${a.signals} estimates`;
      else if(c.capability==='hedge')target.textContent=u.id==='clerk'?`${a.guarded||0} quote guards · ${a.hedged} emergency trim`:`${a.hedged} trimmed · $${a.cost.toFixed(2)} cost`;
      else {
        const pnl=ledger?ledger.cash+ledger.inv.reduce((n,q,i)=>n+q*state.prices[i],0):0;
        target.textContent=`Net ${pnl<0?'−':'+'}$${Math.abs(pnl).toFixed(2)} · ${a.fills} filled`;
        target.classList.toggle('losing-stream',pnl<-.005);
        target.title='Marked P&L of this unit’s actual order stream, including allocated closing trades and fees. Not a counterfactual measure of its contribution.';
      }
    }
  });
}
export function paintBook(state,asset,root=document) {
  const el=root.getElementById('book-depth');if(!el)return;
  const d=depth(state.books[asset]);
  el.innerHTML=`<div class="depth-heading"><span>BID / SIZE</span><span>ASK / SIZE</span></div>`+Array.from({length:3},(_,i)=>`<div class="depth-row"><span>${d.bids[i]?`$${d.bids[i].price.toFixed(2)} <b>${d.bids[i].qty}</b>`:'—'}</span><span>${d.asks[i]?`$${d.asks[i].price.toFixed(2)} <b>${d.asks[i].qty}</b>`:'—'}</span></div>`).join('');
}
export function showMarketActions(events,icon,root=document) {
  if(root.querySelectorAll('.market-flight').length>8)return;
  for(const side of [0,1]) {
    // Show the important action for up to two real units on each side per tick.
    const actions=new Map(),priority={quote:1,signal:2,capacity:2,fill:4,hedge:5,contest:6};
    for(const e of events)if(e.firm===side&&e.source&&priority[e.type]) {
      const key=e.source.uid??e.source.id,old=actions.get(key);if(!old||priority[e.type]>priority[old.type])actions.set(key,e);
    }
    const candidates=[...actions.values()].sort((a,b)=>priority[b.type]-priority[a.type]);
    // Rotate equally important sources so a prolific unit does not hide all others.
    if(candidates.length>2){const shift=Math.floor((events[0]?.qty||0)+events.length)%candidates.length;candidates.push(...candidates.splice(0,shift));}
    for(const e of candidates.slice(0,2)) {
      const key=e.source.uid==null?`[data-unit-id="${e.source.id}"]`:`[data-instance="${e.source.uid}"]`;
      const source=root.querySelector(`${side?'#opponent-floor':'#desk'} ${key}`),tile=root.querySelector(`[data-asset="${e.asset}"]`),c=byId(e.source.id);
      if(!source||!tile||!c)continue;
      const start=source.getBoundingClientRect(),end=tile.getBoundingClientRect(),token=root.createElement('span');
      const verb={quote:'POST',signal:'SCAN',capacity:'DEPTH',fill:e.direct?'DUEL':'FILL',hedge:'TRIM',contest:e.reason==='price'?'PRICE EDGE':'QUEUE EDGE'}[e.type];
      token.className=`market-flight side-${side} action-${e.type}`;token.innerHTML=`${icon(c.icon)}<b>${verb}</b>`;
      token.title=`${c.name}: ${verb}${e.qty?` ${e.qty} units`:''}${e.opponent?` against ${byId(e.opponent.id)?.name||'rival'}`:''}`;
      token.style.setProperty('--from-x',`${start.x+start.width/2}px`);token.style.setProperty('--from-y',`${start.y+start.height/2}px`);
      token.style.setProperty('--to-x',`${end.x+end.width*(side?.68:.32)}px`);token.style.setProperty('--to-y',`${end.y+end.height*.55}px`);
      root.body.append(token);setTimeout(()=>token.remove(),1050);
    }
  }
}
export function paintContests(events,icon,root=document) {
  const latest=new Map();for(const e of events)if(e.type==='contest')latest.set(e.asset,e);
  for(const [asset,e] of latest) {
    const tile=root.querySelector(`[data-asset="${asset}"]`),winner=byId(e.source.id),loser=byId(e.opponent.id);if(!tile||!winner||!loser)continue;
    const ribbon=tile.querySelector('.contest-ribbon')||root.createElement('span');ribbon.className=`contest-ribbon winner-${e.firm}`;
    ribbon.innerHTML=`${icon(winner.icon)}<span class="contest-names"><b>${winner.name}</b><small>ahead of ${loser.name}</small></span><span class="contest-outcome">${e.reason==='price'?'PRICE':'QUEUE'}<br>+${e.qty} flow</span>`;
    ribbon.title=`${winner.name} won ${e.qty} customer units ahead of ${loser.name} by ${e.reason==='price'?'offering a better price':'holding an older order at the same price'}. This is volume won, not guaranteed profit.`;
    ribbon.dataset.tooltipContest=ribbon.title;
    tile.append(ribbon);const sequence=Number(ribbon.dataset.sequence||0)+1;ribbon.dataset.sequence=sequence;
    setTimeout(()=>{if(Number(ribbon.dataset.sequence)===sequence)ribbon.remove();},1600);
  }
}
