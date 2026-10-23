import { BOARD,unitKey,validPosition } from './board.js';
import { byId } from './roster.js';
export const SUPPORT={research:{range:2,capacity:2},execution:{range:2,capacity:2},risk:{range:2,capacity:3},manager:{range:2,capacity:3}};
export const distance=(a,b)=>Math.abs(a.col-b.col)+Math.abs(a.row-b.row);
export function supportKinds(u){const c=byId(u.id);return [c?.capability==='research'?'research':null,['router','agency-pm'].includes(u.id)?'execution':null,c?.capability==='hedge'?'risk':null,['prime','treasury'].includes(u.id)?'manager':null].filter(Boolean);}
export function isTrading(u){return !['research','hedge'].includes(byId(u.id)?.capability)&&u.id!=='specialist';}
export function supportGraph(units,board=BOARD){
  const links=[];
  for(const source of units)for(const kind of supportKinds(source)){
    const rule=SUPPORT[kind],targets=units.filter(u=>u!==source&&isTrading(u)&&validPosition(u.position,board)&&distance(source.position,u.position)<=rule.range).sort((a,b)=>distance(source.position,a.position)-distance(source.position,b.position)||unitKey(a).localeCompare(unitKey(b),undefined,{numeric:true}));
    for(const target of targets.slice(0,rule.capacity))links.push({source:{id:source.id,uid:source.uid??null},target:{id:target.id,uid:target.uid??null},kind,distance:distance(source.position,target.position)});
  }
  return links;
}
export function supporters(f,u,kind){return (f.supportLinks||[]).filter(e=>e.kind===kind&&unitKey(e.target)===unitKey(u));}
export function routingFor(f,u,{slot=0,tick=0}={}){
  const networkTicks=u.position?.row||0,engineering=supporters(f,u,'execution')[0],management=supporters(f,u,'manager');
  // Four ordinary dispatch jobs per firm/tick; native HFT execution bypasses this processing queue.
  let processingTicks=slot>=4&&byId(u.id)?.capability!=='execution'?1:0,manager=null;
  f.managementUsage??={};
  if(processingTicks)for(const link of management){const key=unitKey(link.source),window=Math.floor(tick/2),entry=f.managementUsage[key];if(!entry||entry.window!==window)f.managementUsage[key]={window,used:0};if(f.managementUsage[key].used<2){f.managementUsage[key].used++;processingTicks=0;manager=link.source;break;}}
  const delayTicks=Math.max(0,networkTicks-(engineering?1:0))+processingTicks;
  return {networkTicks,processingTicks,delayTicks,latencyMs:delayTicks*500,execution:engineering?.source||null,manager};
}
export function previewPosition(units,uid,position,b=BOARD){const copy=units.map(u=>({...u,position:{...u.position}})),u=copy.find(u=>u.uid===uid);if(!u||!validPosition(position,b))return null;const other=copy.find(v=>v!==u&&v.position.col===position.col&&v.position.row===position.row);if(other){if(u.deployed===false)copy.splice(copy.indexOf(other),1);else other.position={...u.position};}u.position={...position};const links=supportGraph(copy,b),execution=links.some(e=>e.kind==='execution'&&e.target.uid===uid);return {position,networkMs:position.row*500,minimumRoutingMs:Math.max(0,position.row-(execution?1:0))*500,links:links.filter(e=>e.source.uid===uid||e.target.uid===uid)};}
