import { MARKETS,regionAt,compatibleMarkets } from './markets.js';
import { BOARD,boardTile,localTile,unitKey } from './board.js';
import { previewPosition } from './positioning.js';
import { byId } from './roster.js';
export function createDeploymentUI(root,{canEdit,onPlace,onSelect,onBench}){
  const grid=root.getElementById('deployment-grid'),hint=root.getElementById('placement-preview');let model=null,armed=null,dragging=false;
  const uidFrom=el=>{const own=el?.closest?.('#bench [data-instance],#desk [data-instance],[data-tile-uid]');return own?Number(own.dataset.tileUid??own.dataset.instance):null;};
  let pointer=null;
  root.addEventListener('pointerdown',e=>{if(!canEdit()||e.button!==0)return;const uid=uidFrom(e.target);if(uid!=null&&!e.target.closest?.('[data-tile-side="1"],.unit-actions,.unit-details'))pointer={uid,x:e.clientX,y:e.clientY,id:e.pointerId};});
  root.addEventListener('pointermove',e=>{if(!pointer||!canEdit())return;if(!dragging&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>6){dragging=true;armed=pointer.uid;root.body.setPointerCapture?.(pointer.id);root.body.classList.add('unit-dragging');}if(dragging){e.preventDefault();const tile=root.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-tile-row]');if(tile)preview(Number(tile.dataset.tileCol),Number(tile.dataset.tileRow));}});
  root.addEventListener('pointerup',e=>{if(!pointer)return;const moved=dragging,uid=pointer.uid;pointer=null;if(moved&&canEdit()){let ok=false;const target=root.elementFromPoint(e.clientX,e.clientY),tile=target?.closest?.('[data-tile-row]');if(tile){const p=localTile(Number(tile.dataset.tileCol),Number(tile.dataset.tileRow),0,model.board);if(p)ok=onPlace(uid,p);}else if(target?.closest?.('#bench'))ok=onBench(uid);armed=null;hint.textContent=ok?'Formation updated.':'Move unavailable: check market compatibility, capacity or bench room.';}dragging=false;root.body.classList.remove('unit-dragging');grid.querySelectorAll('.in-range,.support-target').forEach(n=>n.classList.remove('in-range','support-target'));});
  root.addEventListener('pointercancel',()=>{pointer=null;dragging=false;root.body.classList.remove('unit-dragging');});
  function preview(col,row){
    grid.querySelectorAll('.in-range,.support-target,.drop-invalid').forEach(n=>n.classList.remove('in-range','support-target','drop-invalid'));
    if(!canEdit()||armed==null||!model)return;
    const target=localTile(col,row,0,model.board);if(!target){hint.textContent='Choose an unlocked compatible market.';return;}
    const candidate=[...model.own,...model.bench].find(u=>u.uid===armed),region=regionAt(target);
    if(!model.activeRegions.includes(region)||candidate&&!compatibleMarkets(candidate.id).includes(region)){grid.querySelector(`[data-tile-col="${col}"][data-tile-row="${row}"]`)?.classList.add('drop-invalid');hint.textContent='Locked market or incompatible product. Choose an eligible region.';return;}
    const units=model.own.map(u=>({...u}));if(!units.some(u=>u.uid===armed)){const reserve=model.bench.find(u=>u.uid===armed);if(reserve)units.push({...reserve,position:{...target}});}
    const p=previewPosition(units,armed,target,model.board);if(!p)return;
    for(const b of grid.querySelectorAll('[data-tile-row]')){const local=localTile(Number(b.dataset.tileCol),Number(b.dataset.tileRow),0,model.board);if(local&&Math.abs(local.row-target.row)+Math.abs(local.col-target.col)<=2)b.classList.add('in-range');}
    for(const link of p.links){const partner=model.own.find(u=>unitKey(u)===unitKey(link.source.uid===armed?link.target:link.source));if(partner){const pos=boardTile(partner.position,0,model.board);grid.querySelector(`[data-tile-col="${pos.col}"][data-tile-row="${pos.row}"]`)?.classList.add('support-target');}}
    hint.textContent=`Routing ≥${p.minimumRoutingMs}ms · network ${p.networkMs}ms · ${p.links.length} support links · range 2 tiles, finite capacity`;
  }
  root.addEventListener('dragstart',e=>{if(!canEdit())return;const uid=uidFrom(e.target);if(uid==null)return;armed=uid;dragging=true;e.dataTransfer?.setData('application/x-tft-unit',String(uid));if(e.dataTransfer)e.dataTransfer.effectAllowed='move';});
  root.addEventListener('dragend',()=>{dragging=false;grid.querySelectorAll('.in-range,.support-target').forEach(n=>n.classList.remove('in-range','support-target'));});
  grid.addEventListener('dragover',e=>{if(canEdit()){e.preventDefault();const b=e.target.closest('[data-tile-row]');if(b)preview(Number(b.dataset.tileCol),Number(b.dataset.tileRow));}});
  grid.addEventListener('drop',e=>{e.preventDefault();if(!canEdit())return;const b=e.target.closest('[data-tile-row]'),uid=Number(e.dataTransfer?.getData('application/x-tft-unit')||armed);if(b&&Number.isFinite(uid)){const p=localTile(Number(b.dataset.tileCol),Number(b.dataset.tileRow),0,model.board);if(p&&onPlace(uid,p)){armed=null;hint.textContent='Formation updated.';}}});
  root.getElementById('bench').addEventListener('dragover',e=>{if(canEdit())e.preventDefault();});
  root.getElementById('bench').addEventListener('drop',e=>{e.preventDefault();if(canEdit()){const uid=Number(e.dataTransfer?.getData('application/x-tft-unit')||armed);if(onBench(uid))armed=null;}});
  root.addEventListener('click',e=>{const reserve=e.target.closest?.('#bench [data-instance]');if(reserve&&canEdit()){armed=Number(reserve.dataset.instance);hint.textContent='Choose an unlocked market tile, or drag to deploy.';}},true);
  grid.addEventListener('click',e=>{const b=e.target.closest('[data-tile-row]');if(!b)return;const row=Number(b.dataset.tileRow),col=Number(b.dataset.tileCol),p=localTile(col,row,0,model.board);
    if(canEdit()&&p&&armed!=null){if(onPlace(armed,p)){armed=null;hint.textContent='Formation updated.';}return;}
    const hit=e.target.closest('[data-tile-uid]');if(hit){const side=Number(hit.dataset.tileSide),key=hit.dataset.tileUid;onSelect(side,key);if(!side&&canEdit()){armed=Number(key);preview(col,row);}}
  });
  grid.addEventListener('pointerover',e=>{const b=e.target.closest('[data-tile-row]');if(b&&armed!=null)preview(Number(b.dataset.tileCol),Number(b.dataset.tileRow));});
  grid.addEventListener('keydown',e=>{if(e.key==='Escape'){armed=null;hint.textContent='Selection cleared.';return;}const b=e.target.closest('[data-tile-row]');if(!b)return;const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(delta){e.preventDefault();grid.querySelector(`[data-tile-col="${Number(b.dataset.tileCol)+delta[0]}"][data-tile-row="${Number(b.dataset.tileRow)+delta[1]}"]`)?.focus();}if(e.key==='Delete'&&canEdit()){const own=b.querySelector('[data-tile-side="0"]');if(own)onBench(Number(own.dataset.tileUid));}});
  return {paint(next){model=next;
    // Update accessible/fallback metrics without reconstructing deployment every tick.
    for(const button of grid.querySelectorAll('[data-tile-uid]')){const side=Number(button.dataset.tileSide),f=next.state?.firms[side],key=button.dataset.tileUid,u=f?.units.find(u=>String(u.uid??u.id)===key),a=f?.unitLedger[key];if(!u)continue;const net=a?a.cash+a.inv.reduce((n,q,i)=>n+q*next.state.prices[i]*(next.state.instruments[i].multiplier||1),0):0;button.title=`${byId(u.id).name}. ${byId(u.id).simple}. $${net.toFixed(2)} marked net, ${f.activity[key]?.fills||0} filled`;button.setAttribute('aria-label',`${side?'Rival':'Your'} ${button.title}`);const metric=button.querySelector('.fallback-net');if(metric)metric.textContent=`$${net.toFixed(1)}`;}
    const occupants=new Map();
    for(const [side,units] of [[0,next.own],[1,next.opponent]])for(const u of units){const p=boardTile(u.position,side,next.board),key=`${p.col}:${p.row}`,entry=occupants.get(key)||[];entry.push({u,side});occupants.set(key,entry);}
    const signature=JSON.stringify([next.own,next.opponent,canEdit(),next.board,next.activeRegions]);if(grid.dataset.signature===signature)return;grid.dataset.signature=signature;
    grid.style.gridTemplateColumns=`repeat(${next.board.cols},1fr)`;grid.style.gridTemplateRows=`repeat(${next.board.rows},1fr)`;
    grid.setAttribute('aria-label','Shared 8 by 8 regional trading floor');
    grid.innerHTML=Array.from({length:next.board.cols*next.board.rows},(_,i)=>{
      const col=i%next.board.cols,row=Math.floor(i/next.board.cols),region=MARKETS.find(m=>m.id===regionAt({col,row})),active=!next.board.shared||next.activeRegions.includes(region.id),os=occupants.get(`${col}:${row}`)||[];
      const content=os.map(o=>`<button class="unit-subslot side-${o.side}" data-tile-uid="${o.u.uid??o.u.id}" data-tile-side="${o.side}" aria-label="${o.side?'Rival':'Your'} ${byId(o.u.id).name} in ${region.name}" title="${byId(o.u.id).name} / ${region.name}"><span class="tile-fallback">${byId(o.u.id).name}<b class="fallback-net"></b></span></button>`).join('');
      return `<div class="deployment-tile ${active&&canEdit()?'legal-tile':''} ${os.length?'occupied':''} ${active?'':'locked-region'}" style="--region-color:#${region.color.toString(16)}" data-region="${region.id}" data-tile-col="${col}" data-tile-row="${row}" role="gridcell" tabindex="0" aria-label="${region.name}, tile ${col+1}, ${row+1}${active?'':', unlocks '+region.unlock}" title="${region.description}${active?'':' Unlocks '+region.unlock}">${region.anchor.col===col&&region.anchor.row===row?`<span class="region-fallback">${region.short}${active?'':' / '+region.unlock}</span>`:''}${content}</div>`;
    }).join('');
    root.querySelectorAll('#bench [data-instance]').forEach(el=>el.draggable=false);
  }};
}
