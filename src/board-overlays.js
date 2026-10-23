import { boardTile,unitKey } from './board.js';
export const OVERLAYS={activity:'Executed quantity per unit',pnl:'Marked net order-stream P&L including costs',risk:'Gross open inventory value per unit',competition:'Customer contests won minus lost',market:'Executed quantity in selected market'};
export function overlayData(s,mode='activity',market=0){
  return s.firms.flatMap((f,side)=>f.units.map(u=>{const a=f.activity[unitKey(u)]||{},account=f.unitLedger[unitKey(u)],inv=account?.inv||s.prices.map(()=>0),net=account?account.cash+inv.reduce((n,q,i)=>n+q*s.prices[i],0):0;
    const value=mode==='pnl'?net:mode==='risk'?inv.reduce((n,q,i)=>n+Math.abs(q*s.prices[i]),0):mode==='competition'?(a.contests||0)-(a.outcompeted||0):mode==='market'?(a.fillsByAsset?.[market]||0):(a.fills||0);
    return {key:unitKey(u),side,position:boardTile(u.position,side,s.board),value,metric:OVERLAYS[mode]||OVERLAYS.activity};
  }));
}
