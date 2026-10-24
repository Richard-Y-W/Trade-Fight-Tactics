// Fast-beta pacing. Optional later weeks retain Friday's unlocked capacity.
import { unlockedMarkets } from './markets.js';
export function progression(week=1,day=1) {
  const d=Math.max(1,Math.min(5,Math.floor(day))),later=week>1;
  const marketIds=unlockedMarkets(week,d);
  return {day:d,slots:later?7:d+2,markets:marketIds.length,marketIds,scenario:['calm','calm','trend','calm','shock'][d-1],shopIndex:later?4:d-1};
}
