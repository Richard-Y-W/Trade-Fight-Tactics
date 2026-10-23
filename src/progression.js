// Fast-beta pacing. Optional later weeks retain Friday's unlocked capacity.
export function progression(week=1,day=1) {
  const d=Math.max(1,Math.min(5,Math.floor(day))),later=week>1;
  return {day:d,slots:later?7:d+2,markets:later?5:[3,3,4,5,5][d-1],scenario:['calm','calm','trend','calm','shock'][d-1],shopIndex:later?4:d-1};
}
