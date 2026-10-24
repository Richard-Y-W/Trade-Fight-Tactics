import { enableRegionalCompany } from './board.js';
import { CARDS, byId } from './roster.js';
import { progression } from './progression.js';
import { BOARD,assignPositions } from './board.js';
import { compatibleMarkets } from './markets.js';
// Original tuning for this prototype, not TFT's live bag-size table.
export const POOL_COPIES = [24,20,16,12,9];
export function createPool(copies=POOL_COPIES) {
  return {total:Object.fromEntries(CARDS.map(c=>[c.id,copies[c.tier-1]])),remaining:Object.fromEntries(CARDS.map(c=>[c.id,copies[c.tier-1]]))};
}
export function releaseOffers(company) {
  for(const id of company.offers)if(id)company.pool.remaining[id]++;
  company.offers=[];
}
export function releaseCompany(company) {
  if(company.eliminated)return;
  releaseOffers(company);
  for(const u of company.units)company.pool.remaining[u.id]+=3**(u.star-1);
  company.units=[];company.eliminated=true;
}
export const WEEK_ODDS = [[70,25,5,0,0],[45,35,17,3,0],[25,35,28,10,2],[15,25,35,20,5],[10,20,30,28,12]];
export function floorLimitFor(week,day=1) { return progression(week,day).slots; }
export function oddsFor(week,day=1) { return WEEK_ODDS[progression(week,day).shopIndex]; }
function random(company) { let n = company.seed += 0x6D2B79F5; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }
export function offersFor(company, week) {
  const odds = oddsFor(week,company.day||1);
  return Array.from({length:5},() => {
    const tiers=odds.map((weight,i)=>({tier:i+1,weight,pool:CARDS.filter(c=>c.tier===i+1 && company.pool.remaining[c.id]>0)})).filter(t=>t.weight>0&&t.pool.length);
    const sum=tiers.reduce((n,t)=>n+t.weight,0);if(!sum)return null;
    let roll=random(company)*sum,chosen=tiers.at(-1);
    for(const t of tiers){if(roll<t.weight){chosen=t;break;}roll-=t.weight;}
    const stock=chosen.pool.reduce((n,c)=>n+company.pool.remaining[c.id],0);let pick=random(company)*stock,id=chosen.pool.at(-1).id;
    for(const c of chosen.pool){if(pick<company.pool.remaining[c.id]){id=c.id;break;}pick-=company.pool.remaining[c.id];}
    company.pool.remaining[id]--;return id;
  });
}
export function createCompany(seed = Date.now(),pool=createPool()) {
  const c = { units:[], credits:10, offers:[], pool, seed:seed >>> 0, nextUid:1, floorLimit:floorLimitFor(1), benchLimit:8, locked:false,eliminated:false };
  c.board={...BOARD};c.offers = offersFor(c,1); return c;
}
export const deployed = c => c.units.filter(u => u.deployed);
export const reserves = c => c.units.filter(u => !u.deployed);
export const sellValue = u => byId(u.id).cost * 3 ** (u.star - 1);
export function mergeUnits(units) {
  let changed = true;
  while(changed) {
    changed = false;
    for (const u of units) {
      if(u.star >= 3) continue;
      const same = units.filter(x => x.id === u.id && x.star === u.star).sort((a,b) => Number(b.deployed) - Number(a.deployed));
      if(same.length < 3) continue;
      const [keep,...remove] = same.slice(0,3); keep.star++;
      units = units.filter(x => !remove.includes(x)); changed = true; break;
    }
  }
  return units;
}
export function buy(company, slot) {
  if(company.eliminated)return {ok:false,message:'This firm is eliminated.'};
  const id = company.offers[slot], card = byId(id);
  if(!card) return {ok:false,message:'That offer has been recruited.'};
  if(company.credits < card.cost) return {ok:false,message:'Not enough recruitment credits.'};
  // Trial merge before rejecting a full bench: completing a triple can free space.
  const candidate = company.units.map(u => ({...u}));
  candidate.push({uid:company.nextUid,id,star:1,deployed:false});
  const merged = mergeUnits(candidate);
  if(merged.filter(u => !u.deployed).length > company.benchLimit) return {ok:false,message:'Your bench is full. Deploy, sell, or complete a merge.'};
  const upgraded = merged.some(u => u.star > (company.units.find(x => x.uid === u.uid)?.star || 1));
  company.units = merged; company.nextUid++; company.credits -= card.cost; company.offers[slot] = null;
  return {ok:true,message:upgraded ? `${card.name} merged!` : `${card.name} joined your bench.`};
}
export function move(company, uid, swapUid = null) {
  const u = company.units.find(x => x.uid === uid); if(!u) return false;
  if(!u.deployed&&company.board?.shared&&!compatibleMarkets(u.id).some(id=>company.activeRegions?.includes(id)))return false;
  if(u.deployed) { if(reserves(company).length >= company.benchLimit) return false; u.deployed = false;delete u.position; return true; }
  if(deployed(company).length >= company.floorLimit) {
    const other = company.units.find(x => x.uid === swapUid && x.deployed); if(!other) return false;
    other.deployed = false;u.position=other.position;delete other.position;
  }
  u.deployed = true;assignPositions(deployed(company),company.board,company.activeRegions); return true;
}
export function sell(company, uid) {
  const u = company.units.find(x => x.uid === uid); if(!u) return false;
  company.credits += sellValue(u);company.pool.remaining[u.id]+=3**(u.star-1); company.units = company.units.filter(x => x.uid !== uid); return true;
}
export function reroll(company, week, free = false) {
  if(company.eliminated)return false;
  if(!free && company.credits < 2) return false;
  if(!free) company.credits -= 2;
  releaseOffers(company);
  company.offers = offersFor(company,week); return true;
}
export function interestFor(credits) { return Math.min(5,Math.floor(Math.max(0,credits)/10)); }
export function incomeFor(credits) { const interest=interestFor(credits);return {base:4,interest,total:4+interest,balance:credits}; }
export function refreshDay(company, week,day=1) {
  if(company.eliminated)return;
  if(company.board?.shared)enableRegionalCompany(company,week,day);
  company.day=day;company.floorLimit=floorLimitFor(week,day);company.lastIncome=incomeFor(company.credits);company.credits+=company.lastIncome.total;
  if(!company.locked)reroll(company,week,true);
  return company.lastIncome;
}
