import { byId,TRAITS,traitLevel,starBenefit } from './roster.js';
import { incomeFor } from './company.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function initializeTooltips(doc,{counts=()=>({}),credits=()=>0}={}) {
  const tip=doc.createElement('div');tip.id='game-tooltip';tip.className='game-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;doc.body.append(tip);
  let current=null,nativeTitle=null;
  const hide=()=>{if(current){current.removeAttribute('aria-describedby');if(nativeTitle)current.setAttribute('title',nativeTitle);}current=null;nativeTitle=null;tip.hidden=true;};
  const position=(x,y)=>{
    const win=doc.defaultView,w=win.innerWidth||1024,h=win.innerHeight||768;
    const r=tip.getBoundingClientRect(),width=r.width||330,height=r.height||230;
    tip.style.left=`${Math.max(10,Math.min(x+15,w-width-12))}px`;
    tip.style.top=`${Math.max(10,Math.min(y+16,h-height-12))}px`;
  };
  const show=(target,x,y)=>{
    if(target===current){position(x,y);return;}
    hide();if(!target)return;
    (target.closest('dialog[open]')||doc.body).append(tip);
    const trait=target.dataset.tooltipTrait||target.dataset.trait;
    if(trait&&TRAITS[trait]) {
      const t=TRAITS[trait],count=counts()[trait]||0,level=traitLevel(count,trait);
      tip.innerHTML=`<small>${escape(t.category)} · Your floor: ${count}</small><h3>${escape(trait)}</h3><p>${escape(t.summary)}</p>${t.thresholds.map((n,i)=>`<div class="tip-threshold ${level>i?'unlocked':''}"><b>${n}</b><span>${escape(t.effects[i])}${level===i+1?' · ACTIVE':''}</span></div>`).join('')}<p class="tip-cost">${escape(t.tradeoff)}</p><small>Distinct deployed identities count. Bench units and duplicates do not.</small>`;
    } else if(target.dataset.tooltipContest) {
      tip.innerHTML=`<small>REAL CUSTOMER ORDER</small><h3>Opportunity won.</h3><p>${escape(target.dataset.tooltipContest)}</p>`;
    } else if(target.id==='income-preview') {
      const balance=credits(),income=incomeFor(balance);
      tip.innerHTML=`<small>RECRUITMENT ECONOMY</small><h3>Save to earn interest.</h3><p>Keep 10 credits for +1 next day. Every additional 10 earns another +1, up to +5 at 50.</p><div class="tip-threshold unlocked"><b>+${income.total}</b><span>Next day: 4 base + ${income.interest} interest</span></div><p class="tip-cost">Calculated from credits saved at the closing bell, before next-day income. Buying or rerolling can lower interest. Trading P&amp;L is separate.</p>`;
    } else {
      const id=target.dataset.unitId||target.dataset.offerId||target.dataset.catalogUnit||target.dataset.inspect,c=byId(id);if(!c)return;
      const star=Number(target.dataset.star||target.dataset.inspectStar||target.closest('[data-star]')?.dataset.star)||1;
      tip.innerHTML=`<small>${escape(c.seniority)} · ${escape(c.combatRole)} · ${star} star</small><h3>${escape(c.name)}</h3><p>${escape(c.detail)}</p><p>${escape(c.job)}</p><div class="tip-market">${['research','hedge'].includes(c.capability)?'Supports the firm across the markets currently open.':'Trades Technology, Energy, Commodities, Rates, and Currencies as they open.'}</div><p><b>Star upgrades:</b> ${escape(starBenefit(c.id))} Each extra star adds 0.25 capability grade.</p><p class="tip-cost">${escape(c.counter)}</p><small>${escape(c.style)} / ${escape(c.specialty)} · Click Read unit for more detail.</small>`;
    }
    current=target;nativeTitle=target.getAttribute('title');if(nativeTitle)target.removeAttribute('title');target.setAttribute('aria-describedby',tip.id);tip.hidden=false;position(x,y);
  };
  const find=el=>el?.closest?.('[data-tooltip-contest],[data-tooltip-trait],[data-trait],[data-unit-id],[data-offer-id],[data-catalog-unit],[data-inspect],#income-preview');
  doc.addEventListener('pointerover',e=>show(find(e.target),e.clientX||0,e.clientY||0));
  doc.addEventListener('pointerout',e=>{if(current&&!current.contains(e.relatedTarget))hide();});
  doc.addEventListener('pointermove',e=>{if(current)position(e.clientX,e.clientY);});
  doc.addEventListener('focusin',e=>{const target=find(e.target);if(target){const r=target.getBoundingClientRect();show(target,r.left,r.bottom);}});
  doc.addEventListener('focusout',hide);doc.addEventListener('scroll',hide,true);
  doc.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
  return {hide};
}
