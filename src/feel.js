const cash=n=>`${n<0?'−':'+'}$${Math.abs(n).toFixed(2)}`;
export function snapshot(s) { return s.firms.map(f=>({pnl:[...f.pnl],fees:f.fees,equity:f.cash+f.inv.reduce((n,q,a)=>n+q*s.prices[a],0)})); }
export function markedChanges(s,before) {
  const changes=[];
  s.firms.forEach((f,side)=>f.pnl.forEach((pnl,asset)=>{
    if(!s.active[asset])return;
    const delta=pnl-(before?.[side]?.pnl[asset]||0);
    if(Math.abs(delta)>=.25)changes.push({side,asset,delta});
  }));
  return changes.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
}
export function createMarketFeel(doc,icon) {
  let before=null,lastTick=0,chains=[0,0],lastWin=[-10,-10];
  return {
    reset(s){before=snapshot(s);lastTick=0;chains=[0,0];lastWin=[-10,-10];doc.querySelectorAll('.pnl-burst,.unit-clash,.flow-chain').forEach(el=>el.remove());},
    tick(s){
      if(s.tick===lastTick)return {chain:0,positive:false};lastTick=s.tick;
      const changes=markedChanges(s,before),next=snapshot(s),netGain=before?next[0].equity-before[0].equity:0;before=next;
      for(const e of changes.slice(0,2)) {
        const tile=doc.querySelector(`[data-asset="${e.asset}"]`);if(!tile)continue;
        const burst=doc.createElement('span');burst.className=`pnl-burst side-${e.side} ${e.delta>0?'gain':'loss'}`;
        burst.dataset.amount=String(e.delta);burst.innerHTML=`<small>MARKED Δ</small><b>${cash(e.delta)}</b>`;burst.title='Change in marked inventory P&L this tick, before firm-wide costs. This can include unrealized gains or losses.';
        burst.style.setProperty('--burst-size',`${Math.min(30,20+Math.abs(e.delta)*.5)}px`);tile.append(burst);setTimeout(()=>burst.remove(),850);
        const number=doc.getElementById(`${e.side?'theirs':'mine'}-${e.asset}`);if(number){number.classList.remove('number-gain','number-loss');void number.offsetWidth;number.classList.add(e.delta>0?'number-gain':'number-loss');}
      }
      const contests=s.events.filter(e=>e.type==='contest');
      for(const side of [0,1]) {
        if(contests.some(e=>e.firm===side)){chains[side]=s.tick-lastWin[side]<=2?chains[side]+1:1;lastWin[side]=s.tick;}
        else if(s.tick-lastWin[side]>2)chains[side]=0;
      }
      const clash=contests.sort((a,b)=>b.qty-a.qty)[0];
      if(clash) {
        const sourceKey=x=>x.uid==null?`[data-unit-id="${x.id}"]`:`[data-instance="${x.uid}"]`;
        const winner=doc.querySelector(`${clash.firm?'#opponent-floor':'#desk'} ${sourceKey(clash.source)}`),loser=doc.querySelector(`${clash.firm?'#desk':'#opponent-floor'} ${sourceKey(clash.opponent)}`);
        if(winner&&loser) {
          const a=winner.getBoundingClientRect(),b=loser.getBoundingClientRect(),svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
          svg.setAttribute('class',`unit-clash side-${clash.firm}`);svg.setAttribute('aria-hidden','true');
          svg.innerHTML=`<path d="M${a.x+a.width/2},${a.y+a.height/2} Q${(a.x+b.x)/2+60},${(a.y+b.y)/2} ${b.x+b.width/2},${b.y+b.height/2}"/><circle cx="${b.x+b.width/2}" cy="${b.y+b.height/2}" r="16"/>`;
          doc.body.append(svg);winner.classList.remove('edge-won');loser.classList.remove('outplayed');void winner.offsetWidth;winner.classList.add('edge-won');loser.classList.add('outplayed');
          setTimeout(()=>svg.remove(),650);
        }
        const tile=doc.querySelector(`[data-asset="${clash.asset}"]`);if(tile&&chains[clash.firm]>=2){
          const badge=tile.querySelector('.flow-chain')||doc.createElement('span');badge.className=`flow-chain side-${clash.firm}`;badge.textContent=`FLOW ×${chains[clash.firm]}`;badge.title='Recent contested-flow streak. Visual feedback only; no profit multiplier.';tile.append(badge);
          const version=String(s.tick);badge.dataset.tick=version;setTimeout(()=>{if(badge.dataset.tick===version)badge.remove();},1000);
        }
      }
      return {chain:chains[0],positive:netGain>0};
    },
  };
}
