import { buildConfig,byId,unitGrade,traitLevel } from './roster.js';
import { stampEvents } from './combat-events.js';
import { BOARD,assignPositions,boardConfig,unitKey } from './board.js';
import { supportGraph,supporters } from './positioning.js';
import { setupBooks,advanceBook,customerOrder,cancelFirmOrders,syncQuotes,seedQuoteSnapshot } from './market-session.js';
import { INSTRUMENTS,MARKETS,initialRegionalState,advanceRegional,callValue,regionalPortfolioRisk } from './markets.js';
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
export function firm(units = [],board=BOARD,instruments=ASSETS) { const config = buildConfig(units), zeros=()=>instruments.map(()=>0),normalized=assignPositions(units.map(u=>typeof u==='string'?{id:u,star:1}:{...u}),board); return { instruments,regional:board.shared,board,units:normalized,supportLinks:supportGraph(normalized,board),activity:Object.fromEntries(normalized.map(u=>[u.uid??u.id,{quotes:0,fills:0,taken:0,signals:0,hedged:0,cost:0}])),unitLedger:{}, config, cards:config.capabilities, cash:10000, inv:zeros(), basis:zeros(), realized:zeros(), fills:zeros(), pnl:zeros(), enabled:instruments.map(()=>true), quotes:[], risk:0, lean:0, stance:'balanced', press:0, cooldown:0, fees:0,costByAsset:zeros(), option:null,stats:{requests:0,unfilled:0,crossUnits:0} }; }
export function createDay(cards = [], seed = 12345, rival = ['maker', 'research'], option = null, options = {}) {
  const scenario=options.scenario || scenarioFor(seed);
  if(!SCENARIOS[scenario])throw new Error('Unknown game scenario');
  const regional=options.marketModel==='regional'||options.board?.shared;
  const instruments=regional?INSTRUMENTS:ASSETS,board=boardConfig({...options.board,shared:!!regional});
  const s = { seed,roundId:options.roundId??`seed-${seed}`,regional,instruments,board,pendingJobs:[],scenario,conditions:SCENARIOS[scenario],tick:0,random:rng(seed),marketRandom:rng(seed+100003),assetRandom:instruments.map((_,a)=>rng(seed+400003+a*1009)),flowRandom:rng(seed+200003),prices:instruments.map(a=>a.price),previous:instruments.map(a=>a.price),history:instruments.map(a=>[a.price]),firms:[firm(cards,board,instruments),firm(rival,board,instruments)],events:[],done:false };
  if(options.enabled) s.firms[0].enabled=instruments.map((_,a)=>options.enabled[a]!==false);
  s.firms[0].option = option;
  if (option) s.firms[0].cash -= 8;
  s.fundamentals=[...s.prices];s.fundamentalHistory=s.prices.map(p=>[p]);s.observationRandom=rng(seed+800003);s.pendingSignals=[];s.eventSequence=0;s.replay=[];
  s.firms.forEach((f,i)=>{f.beliefs=[...s.prices];f.signalSources=[];f.contracts=[];f.researchRandoms=Object.fromEntries(f.units.map(u=>{let hash=0;for(const c of unitKey(u))hash=(hash*31+c.charCodeAt(0))|0;return [unitKey(u),rng(seed+900003+i*1009+hash)];}));});
  s.firms.forEach((f,side)=>f.units.filter(u=>u.id==='specialist'&&!regional).forEach(u=>{
    const qty=3*unitGrade(u),premium=qty*1.6,source={id:u.id,uid:u.uid??null};
    f.cash-=premium;f.contracts.push({source,qty,premium,strike:100,asset:0});
    f.unitLedger[u.uid??u.id]={source,cash:-premium,inv:instruments.map(()=>0),optionNet:-premium};
    s.events.push({type:'option_open',firm:side,asset:0,source,premium,qty});
  }));stampEvents(s);
  if(regional){const active=options.activeRegions||MARKETS.map(m=>m.id);for(const f of s.firms){assignPositions(f.units,board,active);f.supportLinks=supportGraph(f.units,board);}
  s.drivers=initialRegionalState();s.optionGreeks=callValue(100,100,.22,1/252);s.prices[1]=s.optionGreeks.price;s.fundamentals[1]=s.prices[1];s.fundamentalHistory[1]=[s.prices[1]];s.history[1]=[s.prices[1]];}
  setupBooks(s,instruments);
  s.active=instruments.map((m,a)=>regional?(options.activeRegions||MARKETS.map(m=>m.id)).includes(m.market):a<(options.activeMarkets??ASSETS.length));
  s.firms.forEach((f,i)=>{f.autopilot=options.autopilot?.[i]??i===1;f.enabled=f.enabled.map((v,a)=>v&&s.active[a]);});
  return s;
}
export function equity(f, prices) { return f.cash + f.inv.reduce((n, q, a) => n + q * prices[a]*(f.instruments[a].multiplier||1), 0); }
export function portfolioRisk(f,prices,conditions=SCENARIOS.calm) {
  if(f.regional)return regionalPortfolioRisk(f,prices,conditions);
  const commonVariance=(.24*conditions.volatility)**2/12;
  const jumpWidth=conditions===SCENARIOS.shock?2.4:1;
  let commonExposure=0,independentVariance=0,gross=0;
  f.inv.forEach((q,a)=>{
    commonExposure+=q*ASSETS[a].beta;gross+=Math.abs(q*prices[a]);
    const idioVariance=(2*ASSETS[a].vol*conditions.volatility)**2/12;
    const jumpVariance=(jumpWidth*ASSETS[a].vol/.24)**2/12/19;
    independentVariance+=q*q*(idioVariance+jumpVariance);
  });
  const observationVariance=f.inv.reduce((n,q)=>n+q*q*2*.08**2/12,0);
  return {sigma1s:Math.sqrt(2*(commonExposure**2*commonVariance+independentVariance)+observationVariance),gross,commonExposure,net:f.inv.reduce((n,q,a)=>n+q*prices[a],0),concentration:gross?Math.max(...f.inv.map((q,a)=>Math.abs(q*prices[a])))/gross:0};
}
export function covariance1s(conditions=SCENARIOS.calm){
  const common=2*(.24*conditions.volatility)**2/12,jump=conditions===SCENARIOS.shock?2.4:1;
  return ASSETS.map((a,i)=>ASSETS.map((b,j)=>a.beta*b.beta*common+(i===j?2*((2*a.vol*conditions.volatility)**2/12+(jump*a.vol/.24)**2/12/19)+2*.08**2/12:0)));
}
function mark(f, prices,conditions=SCENARIOS.calm) {
  f.pnl = prices.map((p, a) => f.realized[a] + f.inv[a] * (p - f.basis[a])*(f.instruments[a].multiplier||1)-(f.regional?f.costByAsset[a]:0));
  f.risk = Math.round(Math.max(...f.inv.map(q => Math.abs(q) / f.config.capacity)) * 100);
  f.riskStats=portfolioRisk(f,prices,conditions);
}
export function trade(f, asset, qty, price, fee = 0, source = null) {
  if(!Number.isInteger(asset)||asset<0||asset>=f.instruments.length||![qty,price,fee].every(Number.isFinite)||(price<0||(price===0&&f.instruments[asset].kind!=='option'))||fee<0)throw new TypeError('Invalid trade');
  if(qty===0 && fee===0)return;
  if(qty===0) {f.costByAsset[asset]+=fee;f.cash-=fee;f.fees+=fee;const account=f.unitLedger.house??={source:null,cash:0,inv:f.instruments.map(()=>0)};account.cash-=fee;return;}
  const multiplier=f.instruments[asset].multiplier||1;
  const old = f.inv[asset];
  if (old && Math.sign(old) !== Math.sign(qty)) f.realized[asset] += Math.min(Math.abs(old), Math.abs(qty)) * (price - f.basis[asset]) * Math.sign(old)*multiplier;
  const next = old + qty;
  if (!old || Math.sign(old) === Math.sign(qty)) f.basis[asset] = (Math.abs(old) * f.basis[asset] + Math.abs(qty) * price) / Math.abs(next);
  else if (next && Math.sign(next) !== Math.sign(old)) f.basis[asset] = price;
  if (!next) f.basis[asset] = 0;
  f.costByAsset[asset]+=fee;f.cash -= qty * price * multiplier + fee; f.fees += fee; f.inv[asset] = next;
  const key=source?(source.uid??source.id):'house';
  const account=f.unitLedger[key]??={source,cash:0,inv:f.instruments.map(()=>0)};
  account.basis??=f.instruments.map(()=>0);account.realized??=f.instruments.map(()=>0);account.fees??=0;
  const oldUnit=account.inv[asset],nextUnit=oldUnit+qty;
  if(oldUnit&&Math.sign(oldUnit)!==Math.sign(qty))account.realized[asset]+=Math.min(Math.abs(oldUnit),Math.abs(qty))*(price-account.basis[asset])*Math.sign(oldUnit)*multiplier;
  if(!oldUnit||Math.sign(oldUnit)===Math.sign(qty))account.basis[asset]=(Math.abs(oldUnit)*account.basis[asset]+Math.abs(qty)*price)/Math.abs(nextUnit);
  else if(nextUnit&&Math.sign(nextUnit)!==Math.sign(oldUnit))account.basis[asset]=price;
  if(!nextUnit)account.basis[asset]=0;account.fees+=fee;
  account.cash-=qty*price*multiplier+fee;account.inv[asset]+=qty;
}
export function route(s, asset, side, quantity, limit = side==='buy'?s.prices[asset]+s.instruments[asset].customerWidth:s.prices[asset]-s.instruments[asset].customerWidth) {
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
      const eligible=d=>[...f.supportLinks.filter(e=>e.kind==='risk'&&unitKey(e.source)===unitKey(d)).map(e=>unitKey(e.target)),'house'];
      const defender=full?defenders[a%Math.max(1,defenders.length)]:[...defenders].sort((x,y)=>{
        const quantity=d=>eligible(d).reduce((n,k)=>n+Math.max(0,(f.unitLedger[k]?.inv[a]||0)*Math.sign(cut)),0);return quantity(y)-quantity(x);
      })[0];
      const connected=!full&&defender?new Set(eligible(defender)):null;
      const rawSlippage=defender&&eventType==='hedge'?.08/Math.sqrt(unitGrade(defender))*(1-traitLevel(f.config.counts.Risk||0,'Risk')*.15):f.config.hedgeCost;
      const multiplier=f.instruments[a].multiplier||1,slippage=Math.min(s.prices[a],rawSlippage*(s.regional?f.instruments[a].spread/.13:1));
      const before=Math.abs(q), available=connected?[...connected].reduce((n,k)=>n+Math.max(0,(f.unitLedger[k]?.inv[a]||0)*Math.sign(cut)),0):Math.abs(cut),qty=Math.min(Math.abs(cut),available),cost=qty*(slippage*multiplier+.01);
      if(!qty)return;
      // External inventory changes invalidate the capacity reserved by resting orders.
      cancelFirmOrders(s,index,a);f.quotes=[];
      let remaining=qty;const affected=[];
      // Close the positions of the units that actually hold the exposure.
      for(const account of Object.values(f.unitLedger)) {
        if(connected&&!connected.has(account.source?unitKey(account.source):'house'))continue;
        if(Math.sign(account.inv[a])!==Math.sign(cut))continue;
        const part=Math.min(remaining,Math.abs(account.inv[a]));if(!part)continue;
        trade(f,a,-Math.sign(cut)*part,Math.max(0,s.prices[a]-Math.sign(cut)*slippage),part*.01,account.source);
        affected.push({source:account.source,qty:part});account.hedgeCost=(account.hedgeCost||0)+part*(slippage*multiplier+.01);
        remaining-=part;if(remaining<1e-9)break;
      }
      const source=eventType==='hedge'?(defender?{id:defender.id,uid:defender.uid??null}:f.config.sources.hedge??null):null;
      const activity=source?f.activity[source.uid??source.id]:null;if(activity){activity.hedged+=qty;activity.cost+=cost;}
      s.events.push({ type:eventType, firm:index, asset:a, qty, before, after:Math.abs(f.inv[a]), cost, source, affected, trait:eventType==='rebalance'?'Asset Management':null });
    }
  });
  mark(f, s.prices,s.conditions);
}
function doCommand(s, action, asset = null) {
  if (s.done) return false;
  const f = s.firms[0];
  if(action==='market') {
    if(!Number.isInteger(asset)||asset<0||asset>=s.instruments.length||!s.active[asset])return false;
    f.enabled[asset]=!f.enabled[asset];cancelFirmOrders(s,0,asset);f.quotes=[];return true;
  }
  if (action === 'stance') { f.stance = f.stance === 'balanced' ? 'defensive' : 'balanced'; f.quotes = []; return true; }
  if (action === 'lean' && (f.cards.includes('research') || f.cards.includes('directional'))) { f.lean = f.lean === 0 ? 1 : f.lean === 1 ? -1 : 0; f.quotes = []; return true; }
  if (f.cooldown) return false;
  if (action === 'press' && f.cards.includes('manual')) { f.press = f.config.pressTicks; f.quotes = []; f.cooldown = f.config.cooldownTicks; s.events.push({type:'press',firm:0,source:f.config.sources.manual}); return true; }
  if (action === 'hedge' && f.cards.includes('hedge')) { hedge(s, 0, true); f.cooldown = f.config.cooldownTicks; return true; }
  return false;
}
export function command(s,action,asset=null){const ok=doCommand(s,action,asset);if(ok)s.events.push({type:'command',action,asset,firm:0});stampEvents(s);return ok;}
export function step(s) {
  if (s.done) return s;
  s.events = []; s.tick++; s.previous = [...s.prices];
  const regime=s.conditions;
  if(s.regional)advanceRegional(s);else {
  const direction=s.seed%2===0?1:-1;
  const common=(s.marketRandom()-.5)*.24*regime.volatility + direction*regime.drift;
  s.fundamentals=s.fundamentals.map((p,a)=>{
    const shock=s.tick%19===0?(s.assetRandom[a]()-.5)*(s.scenario==='shock'?2.4:1)*ASSETS[a].vol/.24:0;
    return Math.max(5,p+common*ASSETS[a].beta+(s.assetRandom[a]()-.5)*ASSETS[a].vol*2*regime.volatility+shock);
  });
  s.fundamentals.forEach((p,a)=>s.fundamentalHistory[a].push(p));
  // Observable marks lag hidden value by one tick and include bounded observation noise.
  s.prices=s.fundamentals.map((_,a)=>Math.max(5,s.fundamentalHistory[a][s.tick-1]+(s.observationRandom()-.5)*.08));
  }
  s.prices.forEach((p, a) => s.history[a].push(p));
  for(const pending of s.pendingSignals) {
    const change=s.prices[pending.asset]-pending.publicPrice,correct=Math.sign(change)===Math.sign(pending.estimate-pending.publicPrice);
    const activity=s.firms[pending.firm].activity[pending.source.uid??pending.source.id];
    activity.signalChecked=(activity.signalChecked||0)+1;activity.signalCorrect=(activity.signalCorrect||0)+(correct?1:0);
    s.events.push({type:'signal_result',...pending,correct,change});
  }s.pendingSignals=[];
  // Fixed common innovations preserve comparable external scenarios across builds.
  s.measurements=s.instruments.map(()=>s.random()-.5);
  advanceBook(s,s.instruments,trade,hedge);
  for (let a = 0; a < s.instruments.length; a++) {
    if(!s.active[a])continue;
    for (let n = 0; n < s.instruments[a].flow; n++) {
      const informed = s.flowRandom() < regime.informed;
      const side = informed ? (s.fundamentals[a] > s.prices[a] ? 'buy' : 'sell') : (s.flowRandom() < .5 ? 'buy' : 'sell');
      const qty=1+Math.floor(s.flowRandom()*4),budget=((s.regional?s.instruments[a].spread*.3:.04)+s.flowRandom()*s.instruments[a].customerWidth)*regime.customerScale;
      const offset=informed?-(s.regional?s.instruments[a].spread*.1:.015):budget;
      const limit=(informed?s.fundamentals[a]:s.prices[a])+(side==='buy'?offset:-offset);
      const unfilled=route(s,a,side,qty,limit);
      s.firms.forEach(f=>{f.stats.requests+=qty;f.stats.unfilled+=unfilled;});
    }
  }
  syncQuotes(s,s.instruments);
  s.firms.forEach(f => mark(f, s.prices,s.conditions));
  s.firms.forEach(f=>{
    const expiring=f.press===1;
    f.press=Math.max(0,f.press-1);f.cooldown=Math.max(0,f.cooldown-1);
    if(expiring){cancelFirmOrders(s,s.firms.indexOf(f));f.quotes=[];}
  });
  if (s.tick >= 80) {
    s.done = true;
    if(s.regional){for(const [side,f] of s.firms.entries()){for(const account of Object.values(f.unitLedger)){const q=account.inv[1];if(q)trade(f,1,-q,s.prices[1],0,account.source);}s.events.push({type:'option_expiry',firm:side,asset:1,payoffPerShare:s.prices[1],strike:100});mark(f,s.prices,s.conditions);}}
    s.firms.forEach(f => { if (f.option) { const payoff = Math.max(0, (s.prices[0] - 100) * (f.option === 'call' ? 1 : -1)) * 12; f.cash += payoff; s.events.push({ type: 'option', firm: s.firms.indexOf(f), asset: 0, payoff }); } });
    s.firms.forEach((f,i)=>f.contracts.forEach(c=>{const payoff=c.qty*Math.abs(s.prices[c.asset]-c.strike),account=f.unitLedger[c.source.uid??c.source.id];f.cash+=payoff;account.cash+=payoff;account.optionNet+=payoff;s.events.push({type:'option',firm:i,asset:c.asset,source:c.source,payoff,premium:c.premium});}));
    s.events.push({type:'settlement',scores:s.firms.map(f=>equity(f,s.prices)-10000)});
  }
  stampEvents(s);
  return s;
}
