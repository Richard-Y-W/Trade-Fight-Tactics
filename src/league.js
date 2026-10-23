import { createDay, step, equity } from './engine.js';
import { createPool,createCompany,refreshDay,buy,reroll,deployed,reserves,sell,releaseCompany,floorLimitFor } from './company.js';
import { byId,traitCounts } from './roster.js';
import { progression } from './progression.js';
import { assignPositions } from './board.js';
const isTrader=u=>!['hedge','research'].includes(byId(u.id).capability);
export function selectBotFloor(company,preferences=[]) {
  const chosen=[],candidates=[...company.units];
  while(chosen.length<company.floorLimit&&candidates.length) {
    const counts=traitCounts(chosen),traders=chosen.filter(isTrader).length;
    const score=u=>{
      const c=byId(u.id),same=chosen.filter(v=>byId(v.id).capability===c.capability).length;
      const traitBonus=c.traits.reduce((n,t)=>n+((counts[t]||0)===1?2:(counts[t]||0)===3?1:0),0);
      const coverage=isTrader(u)?(traders<Math.ceil(company.floorLimit*.55)?5:1):(c.capability==='research'?(same===0?3:same===1?0:-5):(same===0?2:-7));
      return c.tier*.4+u.star*2+(preferences.includes(u.id)?1.5:0)+traitBonus+coverage-(chosen.some(v=>v.id===u.id)?5:0);
    };
    candidates.sort((a,b)=>score(b)-score(a));chosen.push(candidates.shift());
  }
  company.units.forEach(u=>{u.deployed=chosen.includes(u);});
  assignPositions(chosen,company.board);
}
export const makeLobby = (pool=createPool(),playerCompany=null,seed=1) => {
const players=[
  {id:'mint',name:'Mint Capital',health:100,ids:[],you:true},
  {id:'cobalt',name:'Cobalt Partners',health:100,ids:['maker','research','manual']},
  {id:'amber',name:'Amber Arbitrage',health:100,ids:['clerk','broker','manual']},
  {id:'ivory',name:'Ivory Research',health:100,ids:['analyst','research','router']},
  {id:'copper',name:'Copper Markets',health:100,ids:['sizing','liquidity','manual']},
  {id:'slate',name:'Slate Systems',health:100,ids:['maker','router','analyst']},
  {id:'cedar',name:'Cedar Treasury',health:100,ids:['clerk','treasury','broker']},
  {id:'violet',name:'Violet Quant',health:100,ids:['research','analyst','maker']},
];
for(let i=0;i<players.length;i++)players[i].company=i===0&&playerCompany?playerCompany:createCompany(seed+i*997,pool);
prepareBots(players,1,false);return players;
};
export function prepareBots(lobby,week,advance=true,day=1) {
  for(const player of lobby.slice(1)) {
    const c=player.company;if(!player.health||c.eliminated)continue;
    c.day=day;c.floorLimit=floorLimitFor(week,day);if(advance)refreshDay(c,week,day);
    for(let pass=0;pass<2;pass++) {
      for(let n=0;n<5;n++) {
        const counts=traitCounts(deployed(c));
        const ranked=c.offers.map((id,slot)=>({id,slot,card:byId(id)})).filter(x=>x.card&&x.card.cost<=c.credits).map(x=>{
          const copies=c.units.filter(u=>u.id===x.id&&u.star===1).length;
          const floor=deployed(c),traders=floor.filter(isTrader).length,support=floor.filter(u=>byId(u.id).capability===x.card.capability).length;
          const role=isTrader(x)?(traders<Math.ceil(c.floorLimit*.55)?5:1):(x.card.capability==='research'?(support===0?3:0):(support===0?1:-4));
          return {...x,score:(player.ids.includes(x.id)?2:0)+(copies===2?8:copies===1?2:0)+x.card.traits.reduce((sum,t)=>sum+(counts[t]||0),0)+x.card.tier*.5+role};
        }).sort((a,b)=>b.score-a.score);
        if(!ranked.length)break;
        if(!buy(c,ranked[0].slot).ok)break;
        // Choose a compact floor with role coverage; extras remain on the real bench.
        selectBotFloor(c,player.ids);
      }
      if(pass===0&&c.credits>=4&&reserves(c).length<6)reroll(c,week);else break;
    }
    if(reserves(c).length>=6) {
      const spare=reserves(c).filter(u=>!player.ids.includes(u.id)).sort((a,b)=>a.star-b.star||byId(a.id).tier-byId(b.id).tier)[0];
      if(spare)sell(c,spare.uid);
    }
    selectBotFloor(c,player.ids);
  }
}
export function botUnits(player, week) {
  return deployed(player.company).map(u=>({...u}));
}
export function startExhibition(lobby, week, seed,day=1) {
  const p=progression(week,day);
  return [[2,3],[4,5],[6,7]].filter(([a,b]) => lobby[a].health && lobby[b].health).map(([a,b]) => ({a,b,state:createDay(botUnits(lobby[a],week),seed,botUnits(lobby[b],week),null,{scenario:p.scenario,activeMarkets:p.markets,autopilot:[true,true]})}));
}
export function stepExhibition(matches) { matches.forEach(m => step(m.state)); }
export function dayDamage(a,b) { const gap = Math.abs(a-b); return gap < .005 ? 0 : Math.min(18,8 + Math.floor(gap / 5)); }
export function settleExhibition(lobby,matches) {
  for(const m of matches) {
    const scores = m.state.firms.map(f => equity(f,m.state.prices) - 10000), damage = dayDamage(...scores);
    const loser = scores[0] < scores[1] ? m.a : m.b;
    lobby[loser].health = Math.max(0,lobby[loser].health - damage);
    if(!lobby[loser].health)releaseCompany(lobby[loser].company);
  }
}
