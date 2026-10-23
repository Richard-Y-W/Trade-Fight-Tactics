// Bounded presentation model shared by Pixi and headless tests.
export function animationFor(event){return event.type==='signal_result'?(event.correct?'synergy':'stress'):event.type==='contest'?'synergy':event.type==='limit'||event.type==='guard'?'stress':event.type==='fill'?(event.edge*event.qty-(event.fee||0)>=0?'success':'stress'):'action';}
export function selectVisualEvents(events,{limit=10,reduced=false}={}) {
  if(reduced)return [];
  const priority={hedge:9,contest:8,guard:7,signal_result:6,fill:5,quote:3,signal:2,option:10};
  const unique=new Map();
  for(const e of events)if(e.source&&priority[e.type]){const k=`${e.firm}:${e.source.uid??e.source.id}`;if(!unique.has(k)||priority[e.type]>priority[unique.get(k).type])unique.set(k,e);}
  return [...unique.values()].sort((a,b)=>priority[b.type]-priority[a.type]).slice(0,limit);
}
export function advanceAnimation(current,now){return now>=current.until?{name:'idle',until:Infinity}:current;}
