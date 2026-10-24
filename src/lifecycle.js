// Authoritative match clock. No DOM, animation frames or financial calculations here.
export const PHASES=Object.freeze({INITIALIZING:'initializing',PREPARATION:'prep',OPPONENT_REVEAL:'opening',MARKET_OPEN:'live',MARKET_CLOSE:'closing',RESULTS_FREEZE:'results',ROUND_ADVANCE:'advance',WEEKEND_EVENT:'weekend',MATCH_COMPLETE:'complete'});
export const DURATIONS=Object.freeze({prep:30000,opening:1200,live:40000,closing:750,results:3000,advance:750});
const transitions={initializing:['prep'],prep:['opening'],opening:['live'],live:['closing'],closing:['results'],results:['advance'],advance:['prep','weekend','complete'],weekend:['prep'],complete:[]};
export function createLifecycle({durations={},onEnter=()=>{},onExit=()=>{},onTradeTick=()=>{},onClock=()=>{},nextRound=()=> 'prep',reducedMotion=()=>false}={}){
  const timing={...DURATIONS,...durations};
  for(const [phase,ms] of Object.entries(timing))if(!Number.isFinite(ms)||ms<=0)throw TypeError(`Invalid ${phase} duration`);
  if(timing.live<30000||timing.live>45000)throw RangeError('Combat must last 30–45 seconds');
  let phase='initializing',elapsed=0,steps=0,roundId=0,paused=false,generation=0;
  const duration=()=>reducedMotion()&&['opening','closing','advance'].includes(phase)?0:timing[phase]??Infinity;
  const snapshot=()=>({phase,elapsed,remaining:Math.max(0,duration()-elapsed),steps,roundId,paused,generation});
  function enter(next){
    if(!transitions[phase].includes(next))return false;
    const previous=phase;onExit(previous,snapshot());phase=next;elapsed=0;
    if(next==='prep'){roundId++;steps=0;}
    generation++;onEnter(next,{...snapshot(),previous});onClock(snapshot());return true;
  }
  function advance(ms){
    if(!Number.isFinite(ms)||ms<0)throw TypeError('Clock delta must be finite and nonnegative');
    if(paused)return snapshot();let budget=ms,guard=0;
    while(!paused&&guard++<10000){
      const end=duration();if(!Number.isFinite(end))break;
      const boundary=phase==='live'?Math.min(end,(steps+1)*timing.live/80):end;
      const used=Math.min(budget,Math.max(0,boundary-elapsed));elapsed+=used;budget-=used;
      if(phase==='live'&&elapsed>=(steps+1)*timing.live/80-1e-8&&steps<80){steps++;onTradeTick(snapshot());}
      if(elapsed>=end-1e-8){
        const next=phase==='advance'?nextRound():({prep:'opening',opening:'live',live:'closing',closing:'results',results:'advance'})[phase];
        if(!next||!enter(next))throw Error(`Illegal automatic transition ${phase} -> ${next}`);
      }else if(!budget)break;
      if(!budget&&duration()>0)break;
    }
    onClock(snapshot());return snapshot();
  }
  return {get phase(){return phase;},get roundId(){return roundId;},get durations(){return {...timing};},snapshot,advance,
    start:()=>phase==='initializing'&&enter('prep'),
    ready:()=>!paused&&phase==='prep'&&enter('opening'),
    skipResults:()=>!paused&&phase==='results'&&enter('advance'),
    chooseWeekend:()=>!paused&&phase==='weekend'&&enter('prep'),
    setPaused(value){paused=!!value;onClock(snapshot());},
    can(action){return ({buy:['prep'],deploy:['prep'],sell:['prep'],reroll:['prep'],lock:['prep'],operate:['live'],choose:['weekend'],skip:['results']})[action]?.includes(phase)||false;},
    reset(){phase='initializing';elapsed=0;steps=0;paused=false;roundId=0;generation++;return enter('prep');},
  };
}
