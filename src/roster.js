// Career tier, rarity color and merged star level are separate concepts.
export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
export const SENIORITY = ['Entry', 'Mid', 'Lead', 'PM', 'Firm Owner'];
export const UNIT_PROFILES = {
  maker: { simple:'Posts buy and sell offers. Tries to earn the gap between them.', risk:'Can lose when prices move before its offers update.', tags:['Automatic','Quotes'], watch:'Two tickets appear when offers refresh; a ticket pulses when an order fills.' },
  manual: { simple:'Uses Press to send immediate orders at tight price limits.', risk:'More fills can build unwanted exposure faster.', tags:['Active','Pressure'], watch:'A lever snaps forward when you activate Press. Fill pulses follow actual orders.' },
  research: { simple:'Helps price your offers using a less noisy estimate.', risk:'A clearer estimate of now does not reveal the next price move.', tags:['Information','Support'], watch:'A scanning lens settles onto a price estimate when quotes are calculated.' },
  hedge: { simple:'Trades away excess inventory. Pays to reduce exposure.', risk:'Protection costs money and may cut a winning position.', tags:['Protection','Automatic'], watch:'A shield pulses and an exposure bar shrinks only when inventory is actually reduced.' },
  sizing: { simple:'Places larger offers and lets your desk hold more inventory.', risk:'A larger capacity also leaves room for larger losses.', tags:['Capacity','Exposure'], watch:'Stacks of order tickets expand when the desk publishes larger offers.' },
  execution: { simple:'Reprices quickly and competes to fill first.', risk:'Speed cannot make a bad trading view correct.', tags:['Speed','Automatic'], watch:'Fast routing lights flash on real quote updates, rather than on a timer.' },
};
export const TRAITS = {
  HFT: { category:'Style', thresholds:[2,4], effects:['Refresh ≤ 2 ticks; faster arrival','Refresh each tick; faster arrival'], tradeoff:'Faster quoting pays a small refresh cost. Old orders retain FIFO priority.' },
  Systematic: { category:'Style', thresholds:[2,4], effects:['Trend tilt ×0.25; follow directional inventory targets','Trend tilt ×0.50; follow directional inventory targets'], tradeoff:'Follows observed price history in directional sessions. Reversals can hurt; targets can leave you exposed.' },
  Macro: { category:'Style', thresholds:[2,4], effects:['Unlock conviction tilt ±$0.28','Conviction tilt ±$0.40; inventory limit +10'], tradeoff:'Player chooses direction. A wrong view accumulates unwanted exposure.' },
  Liquidity: { category:'Style', thresholds:[2,4], effects:['Customer fee −25%; quote size +1','Customer fee −50%; quote size +2'], tradeoff:'Extra displayed size can expose more inventory to informed flow.' },
  'Asset Management': { category:'Style', thresholds:[2,4], effects:['Rebalance every 4s toward ≤8 units','Rebalance every 2s toward ≤4 units'], tradeoff:'Rebalancing pays slippage and fees, and can cut a winning position.' },
  Trading: { category:'Specialty', thresholds:[2,3], effects:['Press lasts +1 second','Press lasts +2 seconds'], tradeoff:'Requires a unit that unlocks Press. More activity is not guaranteed profit.' },
  Research: { category:'Specialty', thresholds:[2,3], effects:['Signal noise −25%','Signal noise −45%'], tradeoff:'Better estimates of the current mark do not reveal future prices.' },
  Engineering: { category:'Specialty', thresholds:[2,3], effects:['Quote size +1; faster arrival','Quote size +2; faster arrival'], tradeoff:'Infrastructure improves submission timing, not the correctness of a trading view.' },
  Risk: { category:'Specialty', thresholds:[2,3], effects:['Inventory skew +40%; hedge slippage −15%','Inventory skew +80%; hedge slippage −30%'], tradeoff:'Risk controls change exposure and costs; they do not remove losses.' },
  Value: { category:'Style', thresholds:[2,4], effects:['Require $0.015 more edge per side','Require $0.030 more edge per side'], tradeoff:'More selective offers can miss volume. Estimates may still be wrong.' },
  Agency: { category:'Style', thresholds:[2,4], effects:['Customer execution fees −15%','Customer execution fees −30%'], tradeoff:'Efficient routing reduces costs; it does not create a profitable price.' },
  Execution: { category:'Specialty', thresholds:[2,3], effects:['Earlier arrival; refresh costs −20%','Earlier arrival; refresh costs −40%'], tradeoff:'Arrival speed only breaks simultaneous submissions. Existing FIFO queues remain.' },
  Allocation: { category:'Specialty', thresholds:[2,3], effects:['Inventory capacity +5; quote size +1','Inventory capacity +10; quote size +2'], tradeoff:'More room to deploy also permits larger exposure and losses.' },
};
const traitDescriptions={HFT:'Compete by updating quickly.',Systematic:'Follow recent price movements with rules.',Macro:'Express a directional view through your quotes.',Liquidity:'Compete for customer flow with efficient quotes.','Asset Management':'Periodically reduce concentrated holdings.',Trading:'Extend active quote-pressure windows.',Research:'Improve the estimates used to price orders.',Engineering:'Build execution throughput and submission speed.',Risk:'Encourage inventory reduction and lower hedge costs.',Value:'Demand a larger estimated edge before providing liquidity.',Agency:'Reduce execution costs rather than taking a stronger price view.',Execution:'Reduce submission delay and refresh overhead.',Allocation:'Support larger positions and displayed orders.'};
for(const [name,t] of Object.entries(TRAITS))t.summary=traitDescriptions[name];
const unit = (id,name,tier,capability,style,specialty,desc) => ({ id,name,tier,cost:tier,capability,style,specialty,traits:[style,specialty],desc,...UNIT_PROFILES[capability],
  seniority:SENIORITY[tier-1], role:specialty.toUpperCase(), icon:({maker:'grid',manual:'cursor',research:'signal',hedge:'shield',sizing:'blocks',execution:'speed'})[capability] });
export const CARDS = [
  unit('maker','Junior Market Maker',1,'maker','Liquidity','Trading','Automatically refresh competitive two-sided quotes.'),
  unit('manual','Junior Macro Trader',1,'manual','Macro','Trading','Unlock Press: send immediate orders at tight limits. Fills bring exposure.'),
  unit('clerk','Risk Analyst',1,'hedge','Asset Management','Risk','Trim inventory automatically. Unlock a costly emergency hedge.'),
  unit('analyst','Signal Analyst',1,'research','Systematic','Research','Improve price estimates and unlock a directional quote tilt.'),
  unit('research','Microstructure Researcher',2,'research','HFT','Research','Sharper price estimates for a fast execution desk.'),
  unit('sizing','Execution Trader',2,'sizing','Asset Management','Trading','Larger quotes and inventory limits. More capacity means more exposure.'),
  unit('router','Execution Engineer',2,'maker','Liquidity','Engineering','Refresh quotes frequently and support execution throughput.'),
  unit('broker','Risk Trader',2,'manual','Macro','Risk','Unlock immediate orders during Press while contributing inventory discipline.'),
  unit('hedge','Portfolio Risk Lead',3,'hedge','Systematic','Risk','Automatic inventory trimming with stronger hedge efficiency.'),
  unit('liquidity','Electronic Trading Lead',3,'maker','HFT','Trading','Run frequent quoting and supply a fast desk with trading expertise.'),
  unit('macro','Macro Research Lead',3,'research','Macro','Research','Improve pricing and support a player-selected directional view.'),
  unit('treasury','Allocation Research Lead',3,'hedge','Asset Management','Research','Use inventory hedging to support portfolio allocation decisions.'),
  unit('execution','Low-Latency PM',4,'execution','HFT','Engineering','Refresh every tick and submit early. Older resting orders retain priority.'),
  unit('adaptive','Systematic PM',4,'research','Systematic','Engineering','High-grade price estimation backed by systems expertise.'),
  unit('prime','Portfolio PM',4,'sizing','Asset Management','Engineering','Increase position capacity and displayed quote size.'),
  unit('specialist','Liquidity PM',4,'manual','Liquidity','Risk','Longer active quoting windows, supported by inventory-risk expertise.'),
  unit('quantum','Systematic Founder',5,'execution','Systematic','Trading','Fast submission timing and an experienced trading specialty.'),
  unit('sentinel','HFT Founder',5,'hedge','HFT','Risk','Efficient automatic inventory protection for a fast trading operation.'),
  unit('oracle','Liquidity Founder',5,'research','Liquidity','Research','High-grade price estimates. Signals remain imperfect.'),
  unit('founder','Macro Founder',5,'manual','Macro','Engineering','Premium active execution windows. Timing and direction still matter.'),
  unit('value-clerk','Value Apprentice',1,'maker','Value','Allocation','Post selective offers and help your firm carry inventory.'),
  unit('agency-clerk','Order Clerk',1,'maker','Agency','Execution','Maintain small automatic orders with execution expertise.'),
  unit('value-analyst','Valuation Analyst',2,'research','Value','Research','Reduce pricing noise while building a selective Value desk.'),
  unit('agency-trader','Agency Trader',2,'manual','Agency','Trading','Unlock active pressure while contributing cheaper execution.'),
  unit('value-lead','Patient Capital Lead',3,'sizing','Value','Risk','Place deeper price ladders; pair position capacity with inventory discipline.'),
  unit('agency-lead','Liquidity Routing Lead',3,'execution','Agency','Engineering','Submit quickly and help route a high-throughput firm.'),
  unit('value-pm','Value Portfolio PM',4,'hedge','Value','Allocation','Trim excessive inventory while supporting allocation capacity.'),
  unit('agency-pm','Execution Services PM',4,'execution','Agency','Execution','Maintain fast quote streams with lower refresh overhead.'),
  unit('execution-analyst','Execution Analyst',2,'research','Systematic','Execution','Combine cleaner estimates with efficient submission infrastructure.'),
  unit('allocation-clerk','Allocation Assistant',1,'hedge','Macro','Allocation','Trim excess positions while contributing allocation capacity.'),
  unit('allocation-lead','Capital Allocation Lead',3,'sizing','Liquidity','Allocation','Add a second price level and room for a larger liquidity operation.'),
  unit('execution-risk','Execution Risk Lead',3,'hedge','HFT','Execution','Trim inventory for a fast desk while reducing refresh overhead.'),
];
const roles={maker:['Liquidity carry','Earn spread through resting buy/sell orders.','Stale orders can be picked off.'],manual:['Active carry','Use Press to take available prices with tightly limited immediate orders.','A wrong view or an empty book wastes the window.'],research:['Information support','Contribute cleaner estimates to the trading units.','Information cannot supply missing liquidity.'],hedge:['Protector','Close actual excess positions and visibly reduce inventory.','Protection spends money and may cut winners.'],sizing:['Liquidity anchor','Add a second price level and larger inventory capacity.','Deeper orders tie up risk capacity and may fill during shocks.'],execution:['Execution carry','Cancel and replace its own orders quickly.','Cancelling loses queue position; speed still pays overhead.']};
for(const c of CARDS){const [role,job,counter]=roles[c.capability];c.combatRole=role;c.job=job;c.counter=counter;c.detail=c.desc;}
export const byId = id => CARDS.find(c => c.id === id);
export function unitGrade(unit) { const c=byId(unit.id);return 1+((c?.tier||1)-1)*.12+((unit.star||1)-1)*.25; }
export function starBenefit(id) { return ({maker:'Larger offers and lower execution costs.',manual:'Larger orders and longer Press windows.',research:'Cleaner estimates for every trading unit.',hedge:'Lower slippage when reducing actual positions.',sizing:'Deeper size and more firm inventory capacity.',execution:'Larger orders and earlier submission.'})[byId(id)?.capability]||''; }
export function traitCounts(units) {
  const counts = {};
  for(const id of new Set(units.map(u=>typeof u==='string'?u:u.id))) for(const trait of byId(id)?.traits || []) counts[trait]=(counts[trait]||0)+1;
  return counts;
}
export function traitLevel(count,name) {
  const thresholds=TRAITS[name]?.thresholds || [2,4];
  return count>=thresholds[1]?2:count>=thresholds[0]?1:0;
}
export function buildConfig(units) {
  const normalized=units.map(u=>typeof u==='string'?{id:u,star:1}:u), caps={}, sources={}, counts=traitCounts(normalized);let researchPower=0;
  for(const u of normalized) {
    const c=byId(u.id); if(!c)continue;
    const grade=unitGrade(u);
    if(c.capability==='research')researchPower+=grade*grade;
    if(grade>(caps[c.capability]||0)) { caps[c.capability]=grade; sources[c.capability]={id:c.id,uid:u.uid??null}; }
  }
  const level=t=>traitLevel(counts[t]||0,t), hft=level('HFT'), systematic=level('Systematic'), macro=level('Macro'), am=level('Asset Management');
  const speed=Math.max(caps.execution||0,caps.maker||0), capabilities=Object.keys(caps);
  if(macro)capabilities.push('directional');
  return {
    capabilities,counts,sources,
    cadence:caps.execution||hft===2?1:speed||hft?2:4,
    noise:(researchPower ? .18/Math.sqrt(researchPower) : .24)*(level('Research')===2 ? .55 : level('Research') ? .75 : 1),
    capacity:Math.round((caps.sizing?30+15*caps.sizing:30)+(macro===2?10:0)+level('Allocation')*5),
    size:Math.round((caps.sizing?4+3*caps.sizing:4)+level('Liquidity')+level('Engineering')+Math.max(0,(caps.maker||1)-1)*2),
    skew:.009*(1+level('Risk')*.4),
    fee:.005*(1-level('Liquidity')*.25)*(1-level('Agency')*.15)/Math.sqrt(caps.maker||1),
    hedgeThreshold:Math.max(5,Math.round(12/(caps.hedge||1))),
    hedgeCost:.08/Math.sqrt(caps.hedge||1)*(1-level('Risk')*.15),
    pressTicks:10+level('Trading')*2+Math.round(Math.max(0,(caps.manual||1)-1)*2),
    cooldownTicks:Math.max(10,16-Math.round(Math.max(0,(caps.manual||1)-1)*2)),
    priority:(caps.execution||0)+(hft===2 ? .6 : hft ? .2 : 0)+level('Engineering')*.1+level('Execution')*.15,
    trendTilt:systematic===2 ? .5 : systematic ? .25 : 0,
    leanStrength:macro===2 ? .40 : macro ? .28 : .18,
    quoteFee:(hft===2 ? .004 : hft ? .002 : 0)*(1-level('Execution')*.2),
    rebalanceEvery:am===2?4:am?8:0,
    rebalanceLimit:am===2?4:8,
  };
}
