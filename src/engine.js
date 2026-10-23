import { buildConfig,byId,unitGrade,traitLevel } from './roster.js';
import { setupBooks,advanceBook,customerOrder,cancelFirmOrders,syncQuotes,seedQuoteSnapshot } from './market-session.js';
export { CARDS } from './roster.js';
export const ASSETS = [
  { name:'Technology',ticker:'NOVA',label:'EQUITIES',price:100,vol:.24,beta:1.2,customerWidth:.38,flow:4,info:'Fast-moving equity proxy; larger price swings and tighter competition.' },
  { name:'Energy',ticker:'VOLT',label:'ENERGY',price:75,vol:.18,beta:.7,customerWidth:.30,flow:4,info:'Mixed common and asset-specific shocks; moderate customer depth.' },
  { name:'Commodities',ticker:'ORE',label:'MATERIALS',price:50,vol:.13,beta:.25,customerWidth:.24,flow:3,info:'Less exposure to the common shock; a narrower customer price budget.' },
  { name:'Rates',ticker:'BOND',label:'BOND PROXY',price:100,vol:.07,beta:-.6,customerWidth:.18,flow:3,info:'A lower-volatility fictional bond proxy that offsets part of the common shock. Not a calibrated bond model.' },
  { name:'Currencies',ticker:'FX',label:'CURRENCY PROXY',price:80,vol:.10,beta:-.2,customerWidth:.26,flow:3,info:'A fictional currency proxy with modest common exposure. Opens Thursday in the beta; not a real currency conversion model.' },
];
export const SCENARIOS = {
  calm:{name:'Calm session',volatility:.7,drift:0,informed:.18,customerScale:1.1},
  trend:{name:'Directional session',volatility:1,drift:.065,informed:.32,customerScale:1},
  shock:{name:'Unstable session',volatility:1.65,drift:0,informed:.55,customerScale:.85},
};
export function scenarioFor(seed) { return Object.keys(SCENARIOS)[Math.abs(seed)%3]; }
export function rng(seed = 12345) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function firm(units = []) { const config = buildConfig(units), zeros=()=>ASSETS.map(()=>0),normalized=units.map(u=>typeof u==='string'?{id:u,star:1}:{...u}); return { units:normalized,activity:Object.fromEntries(normalized.map(u=>[u.uid??u.id,{quotes:0,fills:0,taken:0,signals:0,hedged:0,cost:0}])),unitLedger:{}, config, cards:config.capabilities, cash:10000, inv:zeros(), basis:zeros(), realized:zeros(), fills:zeros(), pnl:zeros(), enabled:ASSETS.map(()=>true), quotes:[], risk:0, lean:0, stance:'balanced', press:0, cooldown:0, fees:0, option:null,stats:{requests:0,unfilled:0,crossUnits:0} }; }
export function createDay(cards = [], seed = 12345, rival = ['maker', 'research'], option = null, options = {}) {
  const scenario=options.scenario || scenarioFor(seed);
  if(!SCENARIOS[scenario])throw new Error('Unknown game scenario');
  const s = { seed,scenario,conditions:SCENARIOS[scenario],tick:0,random:rng(seed),marketRandom:rng(seed+100003),assetRandom:ASSETS.map((_,a)=>rng(seed+400003+a*1009)),flowRandom:rng(seed+200003),prices:ASSETS.map(a=>a.price),previous:ASSETS.map(a=>a.price),history:ASSETS.map(a=>[a.price]),firms:[firm(cards),firm(rival)],events:[],done:false };
  if(options.enabled) s.firms[0].enabled=ASSETS.map((_,a)=>options.enabled[a]!==false);
  s.firms[0].option = option;
  if (option) s.firms[0].cash -= 8;
  setupBooks(s,ASSETS);
  s.active=ASSETS.map((_,a)=>a<(options.activeMarkets??ASSETS.length));
  s.firms.forEach((f,i)=>{f.autopilot=options.autopilot?.[i]??i===1;f.enabled=f.enabled.map((v,a)=>v&&s.active[a]);});
  return s;
}
export function equity(f, prices) { return f.cash + f.inv.reduce((n, q, a) => n + q * prices[a], 0); }
export function portfolioRisk(f,prices,conditions=SCENARIOS.calm) {
  const commonVariance=(.24*conditions.volatility)**2/12;
  const jumpWidth=conditions===SCENARIOS.shock?2.4:1;
  let commonExposure=0,independentVariance=0,gross=0;
  f.inv.forEach((q,a)=>{
    commonExposure+=q*ASSETS[a].beta;gross+=Math.abs(q*prices[a]);
    const idioVariance=(2*ASSETS[a].vol*conditions.volatility)**2/12;
    const jumpVariance=(jumpWidth*ASSETS[a].vol/.24)**2/12/19;
    independentVariance+=q*q*(idioVariance+jumpVariance);
  });
  return {sigma1s:Math.sqrt(2*(commonExposure**2*commonVariance+independentVariance)),gross,commonExposure};
}
function mark(f, prices,conditions=SCENARIOS.calm) {
  f.pnl = prices.map((p, a) => f.realized[a] + f.inv[a] * (p - f.basis[a]));
  f.risk = Math.round(Math.max(...f.inv.map(q => Math.abs(q) / f.config.capacity)) * 100);
  f.riskStats=portfolioRisk(f,prices,conditions);
}
export function trade(f, asset, qty, price, fee = 0, source = null) {
  if(!Number.isInteger(asset)||asset<0||asset>=ASSETS.length||![qty,price,fee].every(Number.isFinite)||price<=0||fee<0)throw new TypeError('Invalid trade');
  if(qty===0 && fee===0)return;
  if(qty===0) {f.cash-=fee;f.fees+=fee;const account=f.unitLedger.house??={source:null,cash:0,inv:ASSETS.map(()=>0)};account.cash-=fee;return;}
  const old = f.inv[asset];
  if (old && Math.sign(old) !== Math.sign(qty)) f.realized[asset] += Math.min(Math.abs(old), Math.abs(qty)) * (price - f.basis[asset]) * Math.sign(old);
  const next = old + qty;
  if (!old || Math.sign(old) === Math.sign(qty)) f.basis[asset] = (Math.abs(old) * f.basis[asset] + Math.abs(qty) * price) / Math.abs(next);
  else if (next && Math.sign(next) !== Math.sign(old)) f.basis[asset] = price;
  if (!next) f.basis[asset] = 0;
  f.cash -= qty * price + fee; f.fees += fee; f.inv[asset] = next;
  const key=source?(source.uid??source.id):'house';
  const account=f.unitLedger[key]??={source,cash:0,inv:ASSETS.map(()=>0)};
  account.cash-=qty*price+fee;account.inv[asset]+=qty;
}
export function route(s, asset, side, quantity, limit = side==='buy'?s.prices[asset]+ASSETS[asset].customerWidth:s.prices[asset]-ASSETS[asset].customerWidth) {
  if(!s.bookMode)seedQuoteSnapshot(s,asset,trade);
  return customerOrder(s,asset,side,quantity,limit,trade);
}
export function matchFirms(s,a) {
  if(!s.bookMode)seedQuoteSnapshot(s,a,trade);
}
export function hedge(s, index, full = false, limit = s.firms[index].config.hedgeThreshold, eventType = 'hedge',buffer = 0) {
  const f = s.firms[index];
  f.inv.forEach((q, a) => {
    const cut = full ? q : Math.abs(q)>limit+buffer?Math.sign(q)*Math.max(0,Math.abs(q)-limit):0;
    if (cut) {
      const defenders=f.units.filter(u=>byId(u.id)?.capability==='hedge');
      const defender=defenders[a%Math.max(1,defenders.length)];
      const slippage=defender&&eventType==='hedge'?.08/Math.sqrt(unitGrade(defender))*(1-traitLevel(f.config.counts.Risk||0,'Risk')*.15):f.config.hedgeCost;
      const before=Math.abs(q), qty=Math.abs(cut), cost=qty*(slippage+.01);
      // External inventory changes invalidate the capacity reserved by resting orders.
      cancelFirmOrders(s,index,a);f.quotes=[];
      let remaining=qty;
      // Close the positions of the units that actually hold the exposure.
      for(const account of Object.values(f.unitLedger)) {
        if(Math.sign(account.inv[a])!==Math.sign(cut))continue;
        const part=Math.min(remaining,Math.abs(account.inv[a]));if(!part)continue;
        trade(f,a,-Math.sign(cut)*part,s.prices[a]-Math.sign(cut)*slippage,part*.01,account.source);
        remaining-=part;if(remaining<1e-9)break;
      }
      const source=eventType==='hedge'?(defender?{id:defender.id,uid:defender.uid??null}:f.config.sources.hedge??null):null;
      const activity=source?f.activity[source.uid??source.id]:null;if(activity){activity.hedged+=qty;activity.cost+=cost;}
      s.events.push({ type:eventType, firm:index, asset:a, qty, before, after:Math.abs(f.inv[a]), cost, source, trait:eventType==='rebalance'?'Asset Management':null });
    }
  });
  mark(f, s.prices,s.conditions);
}
export function command(s, action, asset = null) {
  if (s.done) return false;
  const f = s.firms[0];
  if(action==='market') {
    if(!Number.isInteger(asset)||asset<0||asset>=ASSETS.length||!s.active[asset])return false;
    f.enabled[asset]=!f.enabled[asset];cancelFirmOrders(s,0,asset);f.quotes=[];return true;
  }
  if (action === 'stance') { f.stance = f.stance === 'balanced' ? 'defensive' : 'balanced'; f.quotes = []; return true; }
  if (action === 'lean' && (f.cards.includes('research') || f.cards.includes('directional'))) { f.lean = f.lean === 0 ? 1 : f.lean === 1 ? -1 : 0; f.quotes = []; return true; }
  if (f.cooldown) return false;
  if (action === 'press' && f.cards.includes('manual')) { f.press = f.config.pressTicks; f.quotes = []; f.cooldown = f.config.cooldownTicks; s.events.push({type:'press',firm:0,source:f.config.sources.manual}); return true; }
  if (action === 'hedge' && f.cards.includes('hedge')) { hedge(s, 0, true); f.cooldown = f.config.cooldownTicks; return true; }
  return false;
}
export function step(s) {
  if (s.done) return s;
  s.events = []; s.tick++; s.previous = [...s.prices];
  const regime=s.conditions;
  const direction=s.seed%2===0?1:-1;
  const common=(s.marketRandom()-.5)*.24*regime.volatility + direction*regime.drift;
  s.prices=s.prices.map((p,a)=>{
    const shock=s.tick%19===0?(s.assetRandom[a]()-.5)*(s.scenario==='shock'?2.4:1)*ASSETS[a].vol/.24:0;
    return Math.max(5,p+common*ASSETS[a].beta+(s.assetRandom[a]()-.5)*ASSETS[a].vol*2*regime.volatility+shock);
  });
  s.prices.forEach((p, a) => s.history[a].push(p));
  // Fixed common innovations preserve comparable external scenarios across builds.
  s.measurements=ASSETS.map(()=>s.random()-.5);
  advanceBook(s,ASSETS,trade,hedge);
  for (let a = 0; a < ASSETS.length; a++) {
    if(!s.active[a])continue;
    for (let n = 0; n < ASSETS[a].flow; n++) {
      const informed = s.flowRandom() < regime.informed;
      const side = informed ? (s.prices[a] > s.previous[a] ? 'buy' : 'sell') : (s.flowRandom() < .5 ? 'buy' : 'sell');
      const qty=1+Math.floor(s.flowRandom()*4),budget=(.04+s.flowRandom()*ASSETS[a].customerWidth)*regime.customerScale;
      const offset=informed?-.015:budget;
      const limit=s.prices[a]+(side==='buy'?offset:-offset);
      const unfilled=route(s,a,side,qty,limit);
      s.firms.forEach(f=>{f.stats.requests+=qty;f.stats.unfilled+=unfilled;});
    }
  }
  syncQuotes(s,ASSETS);
  s.firms.forEach(f => mark(f, s.prices,s.conditions));
  s.firms.forEach(f=>{
    const expiring=f.press===1;
    f.press=Math.max(0,f.press-1);f.cooldown=Math.max(0,f.cooldown-1);
    if(expiring){cancelFirmOrders(s,s.firms.indexOf(f));f.quotes=[];}
  });
  if (s.tick >= 80) {
    s.done = true;
    s.firms.forEach(f => { if (f.option) { const payoff = Math.max(0, (s.prices[0] - 100) * (f.option === 'call' ? 1 : -1)) * 12; f.cash += payoff; s.events.push({ type: 'option', firm: s.firms.indexOf(f), asset: 0, payoff }); } });
  }
  return s;
}
