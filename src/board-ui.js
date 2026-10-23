import { BOARD,boardTile,localTile,unitKey } from './board.js';
import { previewPosition } from './positioning.js';
import { byId } from './roster.js';
export function createDeploymentUI(root,{canEdit,onPlace,onSelect,onBench}){
  const grid=root.getElementById('deployment-grid'),hint=root.getElementById('placement-preview');let model=null,armed=null,dragging=false;
  const uidFrom=el=>{const own=el?.closest?.('#bench [data-instance],#desk [data-instance],[data-tile-uid]');return own?Number(own.dataset.tileUid??own.dataset.instance):null;};
  let pointer=null;
  root.addEventListener('pointerdown',e=>{if(!canEdit()||e.button!==0)return;const uid=uidFrom(e.target);if(uid!=null&&!e.target.closest?.('[data-tile-side="1"],.unit-actions,.unit-details'))pointer={uid,x:e.clientX,y:e.clientY,id:e.pointerId};});
  root.addEventListener('pointermove',e=>{if(!pointer||!canEdit())return;if(!dragging&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>6){dragging=true;armed=pointer.uid;root.body.setPointerCapture?.(pointer.id);root.body.classList.add('unit-dragging');}if(dragging){e.preventDefault();const tile=root.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-tile-row]');if(tile)preview(Number(tile.dataset.tileCol),Number(tile.dataset.tileRow));}});
  root.addEventListener('pointerup',e=>{if(!pointer)return;const moved=dragging,uid=pointer.uid;pointer=null;if(moved&&canEdit()){let ok=false;const target=root.elementFromPoint(e.clientX,e.clientY),tile=target?.closest?.('[data-tile-row]');if(tile){const p=localTile(Number(tile.dataset.tileCol),Number(tile.dataset.tileRow),0,model.board);if(p)ok=onPlace(uid,p);}else if(target?.closest?.('#bench'))ok=onBench(uid);armed=null;hint.textContent=ok?'Formation updated.':'Move unavailable: check your half, deployment capacity or bench room.';}dragging=false;root.body.classList.remove('unit-dragging');grid.querySelectorAll('.in-range,.support-target').forEach(n=>n.classList.remove('in-range','support-target'));});
  root.addEventListener('pointercancel',()=>{pointer=null;dragging=false;root.body.classList.remove('unit-dragging');});
  function preview(col,row){
    grid.querySelectorAll('.in-range,.support-target,.drop-invalid').forEach(n=>n.classList.remove('in-range','support-target','drop-invalid'));
    if(!canEdit()||armed==null||!model)return;
    const target=localTile(col,row,0,model.board);if(!target){hint.textContent='Your deployment half is the bottom four rows.';return;}
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
  root.addEventListener('click',e=>{const reserve=e.target.closest?.('#bench [data-instance]');if(reserve&&canEdit()){armed=Number(reserve.dataset.instance);hint.textContent='Choose a tile on your half, or drag to deploy.';}},true);
  grid.addEventListener('click',e=>{const b=e.target.closest('[data-tile-row]');if(!b)return;const row=Number(b.dataset.tileRow),col=Number(b.dataset.tileCol),p=localTile(col,row,0,model.board);
    if(canEdit()&&p&&armed!=null){if(onPlace(armed,p)){armed=null;hint.textContent='Formation updated.';}return;}
    if(b.dataset.tileUid){const side=Number(b.dataset.tileSide),key=b.dataset.tileUid;onSelect(side,key);if(!side&&canEdit()){armed=Number(key);preview(col,row);}}
  });
  grid.addEventListener('pointerover',e=>{const b=e.target.closest('[data-tile-row]');if(b&&armed!=null)preview(Number(b.dataset.tileCol),Number(b.dataset.tileRow));});
  grid.addEventListener('keydown',e=>{if(e.key==='Escape'){armed=null;hint.textContent='Selection cleared.';return;}const b=e.target.closest('[data-tile-row]');if(!b)return;const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(delta){e.preventDefault();grid.querySelector(`[data-tile-col="${Number(b.dataset.tileCol)+delta[0]}"][data-tile-row="${Number(b.dataset.tileRow)+delta[1]}"]`)?.focus();}if(e.key==='Delete'&&canEdit()&&b.dataset.tileSide==='0')onBench(Number(b.dataset.tileUid));});
  return {paint(next){model=next;const occupants=new Map();next.own.forEach(u=>{const p=boardTile(u.position,0,next.board);occupants.set(`${p.col}:${p.row}`,{u,side:0});});next.opponent.forEach(u=>{const p=boardTile(u.position,1,next.board);occupants.set(`${p.col}:${p.row}`,{u,side:1});});
    const signature=JSON.stringify([next.own.map(u=>[u.uid,u.position,u.star]),next.opponent.map(u=>[u.uid,u.position,u.star]),canEdit(),next.board]);if(grid.dataset.signature===signature)return;grid.dataset.signature=signature;
    grid.style.gridTemplateColumns=`repeat(${next.board.cols},1fr)`;grid.style.gridTemplateRows=`repeat(${next.board.rows},1fr)`;
    grid.setAttribute('aria-label',`${next.board.cols} by ${next.board.rows} trading deployment board`);
    grid.innerHTML=Array.from({length:next.board.cols*next.board.rows},(_,i)=>{const col=i%next.board.cols,row=Math.floor(i/next.board.cols),o=occupants.get(`${col}:${row}`),editable=row>=next.board.half&&canEdit();return `<button class="deployment-tile ${editable?'legal-tile':''} ${o?'occupied':''} ${o?.side?'ghost-tile':''}" data-tile-col="${col}" data-tile-row="${row}" ${o?`data-tile-uid="${o.u.uid??o.u.id}" data-tile-side="${o.side}"`:''} draggable="false" aria-label="${o?byId(o.u.id).name+' · ':''}${row<next.board.half?'Opponent':'Your'} tile ${col+1}, ${row+1}" title="${o?byId(o.u.id).name:editable?'Drop or select a unit to deploy here':'Opponent space'}"><span class="tile-fallback">${o?byId(o.u.id).name:''}</span></button>`;}).join('');
    root.querySelectorAll('#bench [data-instance]').forEach(el=>el.draggable=false);
  }};
}
