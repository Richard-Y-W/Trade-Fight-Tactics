// Product taxonomy, not economic-volume weights. Tile area never enters pricing or order flow.
export const MARKETS=[
  {id:'equities',name:'Equities / ETFs',short:'EQUITIES',tiles:14,color:0x214137,anchor:{col:1,row:1},unlock:'Day 1',description:'A broad equity ETF. Quote spreads, carry inventory or take a directional view.'},
  {id:'options',name:'Options / Vol',short:'OPTIONS / VOL',tiles:16,color:0x392d48,anchor:{col:5,row:1},unlock:'Day 2',description:'A European call on the equity ETF: premium, delta, volatility sensitivity and day-end expiry.'},
  {id:'rates',name:'Rates',short:'RATES',tiles:14,color:0x2b3b50,anchor:{col:6,row:4},unlock:'Day 3',description:'A five-year-duration zero-coupon bond proxy. Higher yields reduce its price.'},
  {id:'commodities',name:'Commodities',short:'COMMODITIES',tiles:10,color:0x493b27,anchor:{col:1,row:5},unlock:'Day 4',description:'A spot commodity basket with independent supply shocks and less continuous liquidity.'},
  {id:'fx',name:'FX',short:'FX',tiles:6,color:0x203d43,anchor:{col:5,row:7},unlock:'Day 3',description:'EUR/USD, quoted to a pip. Each contract represents 1,000 EUR.'},
  {id:'credit',name:'Credit',short:'CREDIT',tiles:4,color:0x472b36,anchor:{col:1,row:7},unlock:'Day 5',description:'A risky bond with rate/spread exposure, thin liquidity and a modeled default haircut.'},
];
const rows=['EEEEOOOO','EEEOOOOO','EEEOOOOR','EEEEOOOR','CCCCRRRR','CCCRRRRR','CCCFFRRR','DDDDFFFF'];
const keys={E:'equities',O:'options',R:'rates',C:'commodities',F:'fx',D:'credit'};
export const REGION_MAP=rows.map(r=>[...r].map(c=>keys[c]));
export const regionAt=p=>REGION_MAP[p?.row]?.[p?.col]||null;
export const marketIndex=id=>MARKETS.findIndex(m=>m.id===id);
export const marketCells=id=>REGION_MAP.flatMap((row,r)=>row.flatMap((v,c)=>v===id?[{col:c,row:r}]:[]));
export const UNLOCKS=[['equities'],['equities','options'],['equities','options','rates','fx'],['equities','options','rates','fx','commodities'],MARKETS.map(m=>m.id)];
export function unlockedMarkets(week=1,day=1){return [...UNLOCKS[week>1?4:Math.max(0,Math.min(4,day-1))]];}
export const INSTRUMENTS=[
  {id:'equity-etf',market:'equities',name:'Equities / ETFs',ticker:'ETF',label:'BROAD EQUITY ETF',kind:'equity',price:100,vol:.24,beta:1.2,customerWidth:.38,flow:4,spread:.13,priceScale:100,multiplier:1,noise:.08,minimum:.01,info:MARKETS[0].description},
  {id:'etf-call',market:'options',name:'Options / Vol',ticker:'CALL',label:'ETF CALL · K100 · DAILY EXPIRY',kind:'option',price:.56,vol:.1,beta:.5,customerWidth:.15,flow:3,spread:.04,priceScale:100,multiplier:10,noise:.02,minimum:0,info:MARKETS[1].description},
  {id:'duration-bond',market:'rates',name:'Rates',ticker:'BOND',label:'DURATION 5 · RATE SENSITIVE',kind:'rates',price:100,vol:.07,beta:-.6,customerWidth:.22,flow:3,spread:.09,priceScale:100,multiplier:1,noise:.03,minimum:.01,duration:5,info:MARKETS[2].description},
  {id:'commodity-basket',market:'commodities',name:'Commodities',ticker:'CMD',label:'SPOT COMMODITY BASKET',kind:'commodity',price:50,vol:.16,beta:.25,customerWidth:.35,flow:3,spread:.12,priceScale:100,multiplier:1,noise:.05,minimum:.01,info:MARKETS[3].description},
  {id:'eur-usd',market:'fx',name:'FX',ticker:'EUR/USD',label:'1,000 EUR · USD QUOTE',kind:'fx',price:1.1,vol:.0009,beta:-.2,customerWidth:.0025,flow:5,spread:.0008,priceScale:10000,multiplier:1000,noise:.0002,minimum:.0001,info:MARKETS[4].description},
  {id:'credit-bond',market:'credit',name:'Credit',ticker:'CRD',label:'DURATION 4 · CREDIT SPREAD',kind:'credit',price:100,vol:.1,beta:.7,customerWidth:.45,flow:2,spread:.18,priceScale:100,multiplier:1,noise:.05,minimum:.01,duration:4,info:MARKETS[5].description},
];
// Explicit semantic migrations. VOLT was an energy proxy, never an option contract.
export const LEGACY_ALIASES={NOVA:'equity-etf',VOLT:'commodity-basket',ORE:'commodity-basket',BOND:'duration-bond',FX:'eur-usd'};
export function migrateInstrumentId(id){return LEGACY_ALIASES[id]||id;}
export function compatibleMarkets(id){if(id==='specialist')return ['options'];if(id==='agency-lead')return ['rates','credit'];if(id==='value-clerk')return MARKETS.filter(m=>m.id!=='options').map(m=>m.id);return MARKETS.map(m=>m.id);}
export function assignedAssets(s,u){if(!s.regional)return s.instruments.map((_,i)=>i);const m=regionAt(u.position);if(!compatibleMarkets(u.id).includes(m))return [];if(u.id==='agency-lead')return s.active[2]&&s.active[5]?[2,5]:[];const a=marketIndex(m);return a>=0&&s.active[a]?[a]:[];}

const cdf=x=>{const a=Math.abs(x),t=1/(1+.2316419*a),d=.3989422804014327*Math.exp(-a*a/2),p=1-d*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?p:1-p;};
export function callValue(spot,strike,vol,time,rate=.04){if(time<=0)return {price:Math.max(0,spot-strike),delta:spot>strike?1:spot<strike?0:.5,vega:0};const root=Math.sqrt(time),d1=(Math.log(spot/strike)+(rate+vol*vol/2)*time)/(vol*root),d2=d1-vol*root;return {price:Math.max(0,spot*cdf(d1)-strike*Math.exp(-rate*time)*cdf(d2)),delta:cdf(d1),vega:spot*Math.exp(-d1*d1/2)/Math.sqrt(2*Math.PI)*root};}
export function initialRegionalState(){return {yield:.04,spread:.015,iv:.22,fx:1.1,commodity:50,creditRecovery:1,defaulted:false};}
export function advanceRegional(s){
  const d=s.drivers,v=s.conditions.volatility,common=(s.marketRandom()-.5)*.24*v+(s.seed%2? -1:1)*s.conditions.drift;
  const equity=Math.max(1,s.fundamentals[0]+common*1.2+(s.assetRandom[0]()-.5)*.48*v);
  d.yield=Math.max(-.01,Math.min(.2,d.yield+(s.assetRandom[2]()-.5)*.0005*v+common*.00025));
  d.spread=Math.max(.001,d.spread+(.015-d.spread)*.035+(s.assetRandom[5]()-.5)*.0008*v-common*.0004);
  if(!d.defaulted&&s.assetRandom[5]()<(s.scenario==='shock'?.002:.0001)){d.defaulted=true;d.creditRecovery=.65;s.events.push({type:'credit_default',asset:5,recovery:.65});}
  d.iv=Math.max(.08,Math.min(1,d.iv+(.22-d.iv)*.04+(s.assetRandom[1]()-.5)*.04*v+Math.abs(common)*.01));
  d.fx=Math.max(.2,d.fx*Math.exp((s.assetRandom[4]()-.5)*.0014*v-common*.0008));
  const supply=s.tick%17===0?(s.assetRandom[3]()-.5)*2*v:0;d.commodity=Math.max(2,d.commodity+common*.25+(s.assetRandom[3]()-.5)*.32*v+supply);
  const previous=s.fundamentals.slice(),previousIv=s.publicIv??.22,time=Math.max(0,(80-s.tick)/(252*80));
  s.fundamentals=[equity,callValue(equity,100,d.iv,time,d.yield).price,100*Math.exp(-5*(d.yield-.04)),d.commodity,d.fx,100*Math.exp(-4*(d.yield-.04+d.spread-.015))*d.creditRecovery];
  s.prices=s.fundamentals.map((_,i)=>Math.max(s.instruments[i].minimum,previous[i]+(s.observationRandom()-.5)*s.instruments[i].noise));
  s.publicIv=d.iv;s.optionGreeks=callValue(s.prices[0],100,previousIv,time,d.yield);s.prices[1]=s.optionGreeks.price;for(const f of s.firms)f.marketGreeks=s.optionGreeks;
  s.fundamentals.forEach((p,i)=>s.fundamentalHistory[i].push(p));
}
export function regionalPortfolioRisk(f,prices,conditions){
  const q=f.inv,m=f.instruments,option=f.marketGreeks||callValue(prices[0],100,.22,1/252),delta=q[0]+q[1]*10*option.delta,dv01=(q[2]*prices[2]*5+q[5]*prices[5]*4)*.0001,cs01=q[5]*prices[5]*4*.0001,vega=q[1]*10*option.vega;
  const gross=q.reduce((n,v,a)=>n+Math.abs(v*prices[a]*(m[a].multiplier||1)),0),sigma=Math.sqrt((delta*.24)**2+(dv01*2)**2+(cs01*3)**2+(q[3]*.18)**2+(q[4]*1000*.001)**2+(vega*.015)**2)*conditions.volatility;
  return {sigma1s:sigma,gross,net:q.reduce((n,v,a)=>n+v*prices[a]*(m[a].multiplier||1),0),commonExposure:delta,delta,dv01,cs01,vega,creditJumpLoss:Math.max(0,q[5]*prices[5]*.35),concentration:gross?Math.max(...q.map((v,a)=>Math.abs(v*prices[a]*(m[a].multiplier||1))))/gross:0,definition:'Local factor stress approximation; excludes default tail from sigma. DV01/CS01 are dollars per 1bp; vega dollars per 1.0 volatility.'};
}
