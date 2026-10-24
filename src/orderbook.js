// Small continuous limit book. Prices are integer instrument ticks; equal prices use FIFO.
export function createBook(priceScale=100) { return {priceScale,orders:[],sequence:0,last:null,trades:0}; }
export function cancelOrders(book,predicate) {
  const count=book.orders.filter(predicate).length;
  book.orders=book.orders.filter(o=>!predicate(o));return count;
}
export function submitOrder(book,input,{capacity=()=>Infinity,onFill=()=>{}}={}) {
  if(!['buy','sell'].includes(input.side)||!Number.isInteger(input.price)||input.price<=0||!Number.isFinite(input.qty)||input.qty<=0)throw new TypeError('Invalid limit order');
  const incoming={...input,sequence:++book.sequence,remaining:input.qty};
  let prevented=false;
  const opposite=book.orders.filter(o=>o.side!==incoming.side)
    .sort((a,b)=>(incoming.side==='buy'?a.price-b.price:b.price-a.price)||a.sequence-b.sequence);
  for(const resting of opposite) {
    if(incoming.side==='buy'?resting.price>incoming.price:resting.price<incoming.price)break;
    // Cancel the incoming remainder rather than allow a crossed self-trade.
    if(resting.owner===incoming.owner){prevented=true;break;}
    const qty=Math.max(0,Math.min(incoming.remaining,resting.remaining,capacity(incoming),capacity(resting)));
    if(!qty)continue;
    incoming.remaining-=qty;resting.remaining-=qty;book.last=resting.price;book.trades++;
    onFill({incoming,resting,qty,price:resting.price/(book.priceScale||100)});
    if(incoming.remaining<1e-9)break;
  }
  book.orders=book.orders.filter(o=>o.remaining>1e-9);
  if(!prevented&&incoming.remaining>1e-9 && input.tif!=='IOC')book.orders.push(incoming);
  return incoming.remaining;
}
export function depth(book,levels=3) {
  const side=name=>{
    const prices=new Map();
    for(const o of book.orders)if(o.side===name)prices.set(o.price,(prices.get(o.price)||0)+o.remaining);
    return [...prices].sort((a,b)=>name==='buy'?b[0]-a[0]:a[0]-b[0]).slice(0,levels).map(([p,qty])=>({price:p/(book.priceScale||100),qty}));
  };
  return {bids:side('buy'),asks:side('sell'),last:book.last==null?null:book.last/(book.priceScale||100)};
}
