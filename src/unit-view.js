import { byId } from './roster.js';
import { feedbackFor } from './unit-feedback.js';

export function sceneMarkup(card, icon, active = false, live = false) {
  const props = {
    maker:'<span class="quote-ticket buy-ticket">BUY</span><span class="quote-ticket sell-ticket">SELL</span>',
    manual:'<span class="scene-lever"></span><span class="scene-pressure"></span>',
    research:'<span class="scene-scan"></span><span class="scene-target"></span>',
    hedge:'<span class="scene-shield"></span><span class="scene-exposure"><i></i></span>',
    sizing:'<span class="scene-stack stack-one"></span><span class="scene-stack stack-two"></span><span class="scene-stack stack-three"></span>',
    execution:'<span class="scene-route route-one"></span><span class="scene-route route-two"></span><span class="scene-route route-three"></span>',
  };
  return `<span class="unit-stage role-${card.capability}" aria-hidden="true">${props[card.capability]}${icon(card.icon)}</span><span class="unit-cue">${!active?'ON BENCH':live?'READY':'READY TO TRADE'}</span>`;
}

export function cueLabel(event) {
  if(event.type==='limit')return 'WAITING FOR RISK ROOM';
  if(event.type==='hedge')return `EXPOSURE −${event.qty} · COST $${event.cost.toFixed(2)}`;
  if(event.type==='fill')return `${event.qty} UNITS FILLED`;
  if(event.type==='signal')return 'ESTIMATE UPDATED';
  if(event.type==='capacity')return `OFFERS ×${event.qty}`;
  if(event.type==='press')return 'PRESS ACTIVATED';
  return 'QUOTES UPDATED';
}

export function showUnitFeedback(events, icon, root = document) {
  for(const side of [0,1]) {
  const {units,traits} = feedbackFor(events,side);
  for(const event of units) {
    const key=event.source.uid, selector=key==null?`[data-unit-id="${event.source.id}"]`:`[data-instance="${key}"]`;
    const el=root.querySelector(`${side?'#opponent-floor':'#desk'} ${selector}`);
    if(!el)continue; // A reserve or an absent capability cannot perform a live action.
    const cue=event.type==='quote' && byId(event.source.id).capability==='execution'?'reprice':event.type;
    const sequence=Number(el.dataset.sequence||0)+1;
    el.dataset.sequence=sequence; el.dataset.cue=cue;
    const status=el.querySelector('.unit-cue');if(status){status.textContent=cueLabel(event);
    status.title=event.type==='fill'?'Executed volume. Marked unit P&L appears separately and can change with inventory prices.':status.textContent;}
    el.style.setProperty('--exposure-before','100%');
    el.style.setProperty('--exposure-after',`${event.before?Math.min(100,event.after/event.before*100):0}%`);
    el.classList.remove('performing'); void el.offsetWidth; el.classList.add('performing');
    setTimeout(()=>{ if(Number(el.dataset.sequence)!==sequence)return; el.classList.remove('performing'); el.dataset.cue=''; if(status)status.textContent='READY'; },850);
    // Echo the same role icon at the market where that action happened.
    if(Number.isInteger(event.asset)) {
      const tile=root.querySelector(`[data-asset="${event.asset}"]`);
      if(tile) {
        const slot=tile.querySelector('.unit-market-cue') || root.createElement('span');
        slot.className='unit-market-cue'; slot.innerHTML=icon(byId(event.source.id).icon); slot.title=cueLabel(event); tile.append(slot);
        const version=Number(slot.dataset.sequence||0)+1; slot.dataset.sequence=version;
        setTimeout(()=>{ if(Number(slot.dataset.sequence)===version)slot.remove(); },800);
      }
    }
  }
  for(const [name,event] of traits) {
    if(side)continue;
    const chip=root.querySelector(`[data-trait="${name}"]`); if(!chip)continue;
    chip.classList.remove('trait-performing'); void chip.offsetWidth; chip.classList.add('trait-performing');
    if(event.type==='rebalance')chip.title=`Rebalanced ${event.qty} units; paid $${event.cost.toFixed(2)}. This is a desk-wide trait action.`;
  }
  }
}
