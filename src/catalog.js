import { CARDS,TRAITS } from './roster.js';
export function initializeCatalog({document:doc,icon,onInspect,onOpen}) {
  const $=id=>doc.getElementById(id);let tab='units';
  const render=()=>{
    const query=$('catalog-search').value.trim().toLowerCase(),style=$('catalog-style').value;
    doc.querySelectorAll('[data-catalog-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.catalogTab===tab));});
    $('catalog-style').hidden=tab!=='units';
    if(tab==='units') {
      const cards=CARDS.filter(c=>(!style||c.style===style)&&`${c.name} ${c.style} ${c.specialty} ${c.combatRole} ${c.desc}`.toLowerCase().includes(query));
      $('catalog-count').textContent=`${cards.length} units · all careers`;
      $('catalog-content').innerHTML=cards.map(c=>`<button class="catalog-unit rarity-${c.tier}" data-catalog-unit="${c.id}"><span class="catalog-cost">${c.seniority} · ${c.cost} ◉</span>${icon(c.icon)}<h3>${c.name}</h3><span class="catalog-role">${c.combatRole}</span><p>${c.detail}</p><span class="catalog-tags">${c.style} / ${c.specialty}</span><small>${c.counter}</small></button>`).join('')||'<p>No matching units.</p>';
      doc.querySelectorAll('[data-catalog-unit]').forEach(b=>b.addEventListener('click',()=>onInspect(b.dataset.catalogUnit)));
    } else if(tab==='traits') {
      const traits=Object.entries(TRAITS).filter(([name,t])=>`${name} ${t.summary}`.toLowerCase().includes(query));
      $('catalog-count').textContent=`${traits.length} styles & specialties`;
      $('catalog-content').innerHTML=traits.map(([name,t])=>`<article class="catalog-trait"><span class="eyebrow">${t.category}</span><h3>${name}</h3><p>${t.summary}</p>${t.thresholds.map((n,i)=>`<div class="threshold"><b>${n}</b><span>${t.effects[i]}</span></div>`).join('')}<small>${t.tradeoff}</small></article>`).join('')||'<p>No matching traits.</p>';
    } else {
      $('catalog-count').textContent='Roles explain behavior; traits modify it.';
      const capabilities=[...new Set(CARDS.map(c=>c.capability))];
      $('catalog-content').innerHTML=capabilities.map(cap=>{const c=CARDS.find(c=>c.capability===cap);return `<article class="catalog-trait">${icon(c.icon)}<h3>${c.combatRole}</h3><p>${c.job}</p><small>${c.counter}</small><p class="catalog-tags">${CARDS.filter(u=>u.capability===cap).map(u=>u.name).join(' · ')}</p></article>`;}).join('');
    }
  };
  $('catalog-style').innerHTML='<option value="">All firm styles</option>'+Object.entries(TRAITS).filter(([,t])=>t.category==='Style').map(([name])=>`<option>${name}</option>`).join('');
  $('catalog-open').addEventListener('click',()=>{onOpen();render();$('catalog-dialog').showModal();});
  $('catalog-close').addEventListener('click',()=>$('catalog-dialog').close());
  $('catalog-search').addEventListener('input',render);$('catalog-style').addEventListener('change',render);
  doc.querySelectorAll('[data-catalog-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.catalogTab;render();}));
}
