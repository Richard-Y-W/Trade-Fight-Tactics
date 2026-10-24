// These policies receive public observations and delivered beliefs, never simulator state.
export const POLICIES={maker:'Passive quotes',execution:'Fast repricing',manual:'Player-directed pressure',broker:'Momentum', 'value-clerk':'Mean reversion',analyst:'Private research',clerk:'Inventory guard',hedge:'Dynamic liquidation','agency-lead':'Paired relative value',specialist:'Options quoting'};
export function policyFor(card){return POLICIES[card.id]||({research:'Private research',hedge:'Dynamic liquidation',sizing:'Depth ladder',execution:'Fast repricing',manual:'Player-directed pressure',maker:'Passive quotes'}[card.capability]);}
export function decisionFor(card,{asset,prices,history,beliefs,inventory,capacity,lean,leanStrength,trendTilt}) {
  const p=prices[asset],h=history[asset],movement=p-h[Math.max(0,h.length-5)];
  const clamp=(x,m)=>Math.max(-m,Math.min(m,x));
  let center=beliefs[asset]+lean*leanStrength,target=null,cadence=null,pair=null;
  if(card.id==='broker') {center+=clamp(movement*.8,.28);target=Math.sign(movement)*Math.min(12,Math.floor(capacity*.3));cadence=4;}
  else if(card.id==='value-clerk') {const recent=h.slice(-12),mean=recent.reduce((n,v)=>n+v,0)/recent.length;center+=clamp((mean-p)*.65,.22);target=Math.abs(mean-p)>.04?Math.sign(mean-p)*8:null;}
  else if(card.id==='agency-lead'&&asset<2) {
    const other=1-asset,initial=[100,75],gap=(p/initial[asset]-prices[other]/initial[other])*p;
    center-=clamp(gap*.45,.3);target=Math.abs(gap)>.07?-Math.sign(gap)*8:null;pair=other;cadence=4;
  } else center+=clamp(movement*trendTilt,.15);
  return {center,target,cadence,pair,policy:policyFor(card)};
}
