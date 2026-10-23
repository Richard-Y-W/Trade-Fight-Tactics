import { createBook,cancelOrders,submitOrder } from './orderbook.js';
import { byId,traitLevel,unitGrade } from './roster.js';

export function setupBooks(s,assets) { s.books=assets.map(()=>createBook());s.bookMode=false; }
export function cancelFirmOrders(s,index,asset=null) {
  s.books.forEach((b,a)=>{if(asset==null||asset===a)cancelOrders(b,o=>o.owner===index);});
}
function stats(f,source) { return source?f.activity[source.uid??source.id]:null; }
function hooks(s,a,trade) {
  return {
    capacity:o=>o.owner<0?Infinity:Math.max(0,s.firms[o.owner].config.capacity+(o.side==='buy'?-1:1)*s.firms[o.owner].inv[a]),
    onFill:({incoming,resting,qty,price})=>{
      const direct=incoming.owner>=0&&resting.owner>=0;
      for(const [order,taker] of [[incoming,true],[resting,false]]) {
        if(order.owner<0)continue;
        const f=s.firms[order.owner],signed=order.side==='buy'?qty:-qty,fee=qty*f.config.fee*(taker?2:1);
        trade(f,a,signed,price,fee,order.source);
        f.fills[a]+=qty;if(direct)f.stats.crossUnits+=qty;
        const activity=stats(f,order.source);if(activity){activity.fills+=qty;if(taker)activity.taken+=qty;}
        const peer=(taker?resting:incoming);
        s.events.push({type:'fill',firm:order.owner,asset:a,qty,price,source:order.source,opponent:peer.owner>=0?peer.source:null,taker,direct,edge:signed*(s.prices[a]-price)});
        if(incoming.owner===-2&&!taker&&!incoming.contestReported&&order.source) {
          const rivals=s.books[a].orders.filter(o=>o.owner>=0&&o.owner!==order.owner&&o.side===order.side&&o.source&&o.remaining>0&&(incoming.side==='buy'?o.price<=incoming.price:o.price>=incoming.price));
          rivals.sort((x,y)=>(incoming.side==='buy'?x.price-y.price:y.price-x.price)||x.sequence-y.sequence);
          const rival=rivals[0];
          if(rival){
            incoming.contestReported=true;
            const reason=order.price===rival.price?'queue':'price';
            s.events.push({type:'contest',firm:order.owner,asset:a,qty,source:order.source,opponent:rival.source,reason});
            if(activity)activity.contests=(activity.contests||0)+1;
            const loser=stats(s.firms[rival.owner],rival.source);if(loser)loser.outcompeted=(loser.outcompeted||0)+1;
          }
        }
      }
    },
  };
}
export function customerOrder(s,a,side,qty,limit,trade) {
  return submitOrder(s.books[a],{owner:-2,side,qty,price:Math.max(1,Math.round(limit*100)),tif:'IOC'},hooks(s,a,trade));
}
// Public routing helpers can accept an explicitly supplied opening quote snapshot.
export function seedQuoteSnapshot(s,a,trade) {
  s.bookMode=true;
  const makers=s.firms.map((f,i)=>({f,i,q:f.quotes[a]})).filter(x=>x.q&&x.f.enabled[a]).sort((x,y)=>(x.q.updatedAt||0)-(y.q.updatedAt||0)||x.i-y.i);
  for(const {i,q} of makers)for(const side of ['buy','sell']) {
    const qty=side==='buy'?q.bidSize:q.askSize,price=side==='buy'?q.bid:q.ask;if(!qty)continue;
    submitOrder(s.books[a],{owner:i,key:'snapshot',side,qty,price:Math.round(price*100),source:q.source??null},hooks(s,a,trade));
  }
}
export function advanceBook(s,assets,trade,hedge) {
  s.bookMode=true;
  // A finite, replenished outside ladder provides execution beyond the two firms.
  s.books.forEach((book,a)=>{
    if(!s.active[a])return;
    if(s.tick===1||s.tick%2===0) {
      cancelOrders(book,o=>o.owner===-1);
      const width=s.conditions ? .12*s.conditions.volatility : .13;
      for(let level=0;level<3;level++)for(const side of ['buy','sell']) {
        const price=Math.max(1,Math.round((s.prices[a]+(side==='buy'?-1:1)*(width+level*.16))*100));
        // Outside liquidity providers post passively; they do not sweep stale quotes for free.
        const opposite=book.orders.filter(o=>o.side!==side);
        const best=opposite.length?(side==='buy'?Math.min(...opposite.map(o=>o.price)):Math.max(...opposite.map(o=>o.price))):null;
        const passive=best==null?price:side==='buy'?Math.min(price,best-1):Math.max(price,best+1);
        if(passive>0)submitOrder(book,{owner:-1,side,price:passive,qty:4+level*4,source:null},hooks(s,a,trade));
      }
    }
  });
  const jobs=[];
  s.firms.forEach((f,i)=>{
    if(f.autopilot&&f.cards.includes('manual')&&!f.cooldown&&f.risk<65) {
      const opportunity=s.books.some((book,a)=>s.active[a]&&book.orders.some(o=>o.owner!==i&&(o.side==='sell'?o.price/100<s.prices[a]-.04-f.config.fee*2:o.price/100>s.prices[a]+.04+f.config.fee*2)));
      if(opportunity){f.press=f.config.pressTicks;f.cooldown=f.config.cooldownTicks;f.quotes=[];s.events.push({type:'press',firm:i,source:f.config.sources.manual});}
    }
    const units=f.units.map((u,index)=>({...u,card:byId(u.id),index})).filter(u=>u.card);
    const traders=units.filter(u=>!['research','hedge'].includes(u.card.capability));
    // A basic house policy keeps support-only openings playable; it has no unit attribution.
    if(!traders.length)traders.push({id:null,star:1,index:0,card:{capability:'house',tier:1}});
    const forced=!f.quotes.length;
    for(const u of units.filter(u=>u.card.capability==='research')) {
      const source={id:u.id,uid:u.uid??null},activity=stats(f,source);
      if(s.tick%2===1)for(let a=0;a<assets.length;a++) {
        if(!s.active[a])continue;if(activity)activity.signals++;
        s.events.push({type:'signal',firm:i,asset:a,source,estimate:s.prices[a]+s.measurements[a]*f.config.noise});
      }
    }
    for(const u of traders) {
      const capability=u.card.capability,source=u.id?{id:u.id,uid:u.uid??null}:null;
      const cadence=capability==='execution'?1:capability==='house'?4:Math.min(f.config.cadence,capability==='manual'?3:2);
      if(!forced&&s.tick%cadence!==0)continue;
      // Arrival order expresses execution speed; it never jumps an older resting FIFO order.
      const latency=(capability==='execution'?0:capability==='maker'?1:2)-f.config.priority*.1-(unitGrade(u)-1)*.05;
      jobs.push({f,i,u,source,latency});
    }
    if(f.cards.includes('hedge') && (s.tick%4===0||f.risk>80))hedge(s,i,false,f.config.hedgeThreshold,'hedge',6);
    if(f.config.rebalanceEvery&&s.tick%f.config.rebalanceEvery===0)hedge(s,i,false,f.config.rebalanceLimit,'rebalance',6);
  });
  jobs.sort((a,b)=>a.latency-b.latency||((a.i+s.tick)%2-(b.i+s.tick)%2)||a.u.index-b.u.index);
  for(const {f,i,u,source} of jobs) {
    const key=source?(source.uid??source.id):'house';
    const grade=u.id?unitGrade(u):1;
    const activity=stats(f,source);
    s.books.forEach((book,a)=>{
      cancelOrders(book,o=>o.owner===i&&o.key===key);
      if(!f.enabled[a]||!s.active[a])return;
      const measurement=s.measurements[a],trend=Math.max(-.15,Math.min(.15,(s.prices[a]-s.previous[a])*f.config.trendTilt));
      const spread=f.press?.055:f.stance==='defensive'?.28:.13;
      // Inventory skews quotes without automatically pricing the reducing side through fair value.
      const skew=Math.max(-spread*.6,Math.min(spread*.6,f.inv[a]*f.config.skew));
      const center=s.prices[a]+measurement*f.config.noise+trend-skew+f.lean*f.config.leanStrength;
      const size=Math.max(1,Math.round(f.config.size/Math.sqrt(jobs.filter(j=>j.i===i).length)*grade*(f.stance==='defensive'?.5:1)));
      const levels=u.card.capability==='sizing'?2:1;
      const value=traitLevel(f.config.counts.Value||0,'Value');
      const allocation=traitLevel(f.config.counts.Allocation||0,'Allocation');
      // Bot discretionary choices and Systematic automation use observed history, never future prices.
      const canFollow=(f.autopilot&&(f.cards.includes('research')||f.cards.includes('directional')))||f.config.trendTilt>0;
      const history=s.history[a],observed=history.at(-1)-history[Math.max(0,history.length-5)];
      const direction=canFollow&&s.scenario==='trend'&&Math.abs(observed)>assets[a].vol*.7?Math.sign(observed):0;
      const target=direction*Math.min(12,Math.floor(f.config.capacity*.3));
      let posted=0;
      for(let level=0;level<levels;level++)for(const side of ['buy','sell']) {
        if(direction>0&&side==='sell'&&f.inv[a]<target)continue;
        if(direction<0&&side==='buy'&&f.inv[a]>target)continue;
        const offset=spread+level*.12+value*.015;
        let price=Math.max(1,side==='buy'?Math.floor((center-offset)*100):Math.ceil((center+offset)*100));
        const reserved=book.orders.filter(o=>o.owner===i&&o.side===side).reduce((n,o)=>n+o.remaining,0);
        const remainingCapacity=Math.max(0,f.config.capacity+(side==='buy'?-1:1)*f.inv[a]-reserved);
        const qty=Math.min(size+allocation,remainingCapacity);if(!qty)continue;
        const tif=u.card.capability==='manual'&&f.press?'IOC':undefined;
        if(!tif) {
          const opposite=book.orders.filter(o=>o.side!==side);
          if(opposite.length){const best=side==='buy'?Math.min(...opposite.map(o=>o.price)):Math.max(...opposite.map(o=>o.price));price=side==='buy'?Math.min(price,best-1):Math.max(price,best+1);}
          if(price<=0)continue;
        }
        submitOrder(book,{owner:i,key,source,side,price,qty,tif},hooks(s,a,trade));
        posted++;
        if(activity)activity.quotes++;
      }
      if(f.config.quoteFee){
        f.cash-=f.config.quoteFee;f.fees+=f.config.quoteFee;
        const account=f.unitLedger[key]??={source,cash:0,inv:assets.map(()=>0)};account.cash-=f.config.quoteFee;
      }
      s.events.push({type:posted?'quote':'limit',firm:i,asset:a,qty:posted?size:0,source,bid:Math.floor((center-spread-value*.015)*100)/100,ask:Math.ceil((center+spread+value*.015)*100)/100,trait:f.config.quoteFee?'HFT':null});
      if(posted&&u.card.capability==='sizing')s.events.push({type:'capacity',firm:i,asset:a,qty:size,source});
      if(trend)s.events.push({type:'trend',firm:i,asset:a,trait:'Systematic',tilt:trend});
    });
  }
  syncQuotes(s,assets);
}
export function syncQuotes(s,assets) {
  s.firms.forEach((f,i)=>{f.quotes=assets.map((_,a)=>{
    if(!f.enabled[a])return null;
    const orders=s.books[a].orders.filter(o=>o.owner===i),bids=orders.filter(o=>o.side==='buy'),asks=orders.filter(o=>o.side==='sell');
    // Display indicative bounds when IOC orders have already executed or expired.
    const fallback=s.prices[a]-f.inv[a]*f.config.skew+f.lean*f.config.leanStrength;
    const halfSpread=f.press?.055:f.stance==='defensive'?.28:.13;
    const bid=bids.length?Math.max(...bids.map(o=>o.price))/100:Math.floor((fallback-halfSpread)*100)/100;
    const ask=asks.length?Math.min(...asks.map(o=>o.price))/100:Math.ceil((fallback+halfSpread)*100)/100;
    return {bid,ask,bidSize:bids.filter(o=>o.price===Math.round(bid*100)).reduce((n,o)=>n+o.remaining,0),askSize:asks.filter(o=>o.price===Math.round(ask*100)).reduce((n,o)=>n+o.remaining,0),updatedAt:s.tick,indicative:!bids.length||!asks.length};
  });});
}
