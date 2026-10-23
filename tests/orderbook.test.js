import test from 'node:test';
import assert from 'node:assert/strict';
import { createBook,submitOrder,cancelOrders,depth } from '../src/orderbook.js';
import { createDay,step,equity,command } from '../src/engine.js';
import { buildConfig,TRAITS,CARDS } from '../src/roster.js';

test('limit book matches best price then FIFO and sweeps multiple levels with partial fills',()=>{
  const b=createBook(),fills=[];
  submitOrder(b,{owner:0,side:'sell',price:10010,qty:3});
  submitOrder(b,{owner:1,side:'sell',price:10010,qty:2});
  submitOrder(b,{owner:2,side:'sell',price:10020,qty:5});
  assert.equal(submitOrder(b,{owner:-1,side:'buy',price:10020,qty:7,tif:'IOC'},{onFill:e=>fills.push(e)}),0);
  assert.deepEqual(fills.map(e=>[e.resting.owner,e.qty,e.price]),[[0,3,100.1],[1,2,100.1],[2,2,100.2]]);
  assert.equal(depth(b).asks[0].qty,3);
});
test('cancellation loses queue position; self-trades cancel incoming orders; IOC never rests',()=>{
  const b=createBook(),fills=[];
  for(const owner of [0,1])submitOrder(b,{owner,side:'buy',price:10000,qty:2});
  cancelOrders(b,o=>o.owner===0);submitOrder(b,{owner:0,side:'buy',price:10000,qty:2});
  submitOrder(b,{owner:2,side:'sell',price:10000,qty:1,tif:'IOC'},{onFill:e=>fills.push(e)});
  assert.equal(fills[0].resting.owner,1);
  const before=b.orders.length;submitOrder(b,{owner:1,side:'sell',price:9900,qty:3});assert.equal(b.orders.length,before);
  submitOrder(b,{owner:3,side:'buy',price:1,qty:99,tif:'IOC'});assert.equal(b.orders.length,before);
});
test('actual unit books reconcile position ledgers, costs, and scores through controls and hedges',()=>{
  const units=[{id:'maker',uid:1,star:2},{id:'router',uid:2,star:1},{id:'clerk',uid:3,star:1},{id:'analyst',uid:4,star:1}];
  const s=createDay(units,27,['liquidity','research','manual']);
  for(let t=0;t<80;t++) {
    if(t===16)command(s,'hedge');if(t===30)command(s,'market',0);
    step(s);
    for(const f of s.firms){
      const accounts=Object.values(f.unitLedger);
      for(let a=0;a<4;a++)assert.ok(Math.abs(accounts.reduce((n,x)=>n+x.inv[a],0)-f.inv[a])<1e-8);
      const sum=accounts.reduce((n,x)=>n+x.cash+x.inv.reduce((v,q,a)=>v+q*s.prices[a],0),0);
      assert.ok(Math.abs(sum-(equity(f,s.prices)-10000))<1e-7);
      for(const [a,book] of s.books.entries()){
        assert.ok(book.orders.every(o=>o.remaining>0));
        const owner=s.firms.indexOf(f);
        for(const side of ['buy','sell']) {
          const reserved=book.orders.filter(o=>o.owner===owner&&o.side===side).reduce((n,o)=>n+o.remaining,0);
          assert.ok(reserved<=f.config.capacity+(side==='buy'?-1:1)*f.inv[a]+1e-8,'resting orders reserve enough position capacity');
        }
      }
    }
  }
  assert.ok(s.firms[0].activity[1].quotes>0&&s.firms[0].activity[2].quotes>0);
  assert.ok(s.firms[0].activity[4].signals>0);
  assert.ok(!s.books[0].orders.some(o=>o.owner===0));
});
test('new trait thresholds change actual costs, capacity, and selectivity',()=>{
  const agency=buildConfig(['agency-clerk','agency-trader']),single=buildConfig(['agency-clerk']);assert.ok(agency.fee<single.fee);
  const allocation=buildConfig(['value-clerk','allocation-clerk']);assert.equal(allocation.capacity,35);
  const execution=buildConfig(['research','liquidity','agency-clerk','execution-analyst']);assert.ok(execution.quoteFee<.002);
  const s=createDay(['value-clerk','value-lead'],9);step(s);
  const quotes=s.events.filter(e=>e.firm===0&&e.type==='quote');assert.ok(quotes.every(e=>e.ask-e.bid>=.29-1e-8));
  for(const c of CARDS)assert.ok(c.detail&&c.job&&c.counter&&c.combatRole);
  for(const t of Object.values(TRAITS))assert.ok(t.summary);
});
