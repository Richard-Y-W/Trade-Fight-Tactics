import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompany,interestFor,incomeFor,refreshDay } from '../src/company.js';
import { createDay,step,route,trade,hedge } from '../src/engine.js';
import { submitOrder } from '../src/orderbook.js';
import { initializeTooltips } from '../src/tooltips.js';
import { Window } from 'happy-dom';

test('interest uses pre-income savings thresholds and caps at five for every company',()=>{
  assert.deepEqual([0,9,10,19,20,49,50,100].map(interestFor),[0,0,1,1,2,4,5,5]);
  const c=createCompany(8);c.credits=19;const income=refreshDay(c,2);
  assert.deepEqual(income,{base:4,interest:1,total:5,balance:19});assert.equal(c.credits,24);
  assert.deepEqual(incomeFor(50),{base:4,interest:5,total:9,balance:50});
  c.eliminated=true;refreshDay(c,2);assert.equal(c.credits,24);
});
test('a unit wins contested customer volume through better prices or an older equal-price order',()=>{
  for(const equal of [false,true]) {
    const s=createDay([{id:'maker',uid:1,star:1}],9,[{id:'router',uid:2,star:1}]);s.bookMode=true;
    submitOrder(s.books[0],{owner:0,side:'sell',price:10010,qty:5,source:{id:'maker',uid:1}});
    submitOrder(s.books[0],{owner:1,side:'sell',price:equal?10010:10020,qty:5,source:{id:'router',uid:2}});
    route(s,0,'buy',2,100.3);
    const event=s.events.find(e=>e.type==='contest');assert.ok(event);assert.equal(event.firm,0);assert.equal(event.opponent.uid,2);
    assert.equal(event.reason,equal?'queue':'price');assert.equal(event.qty,2);
    assert.equal(s.firms[0].activity[1].contests,1);assert.equal(s.firms[1].activity[2].outcompeted,1);
    assert.equal(s.firms[1].inv[0],0);
  }
});
test('passive quote refreshes do not consume rival liquidity and hedge buffers prevent tiny trims',()=>{
  const s=createDay(['maker','router'],23,['maker','router']);step(s);
  assert.equal(s.firms[0].activity.maker.taken,0);assert.equal(s.firms[1].activity.maker.taken,0);
  const f=s.firms[0],target=12;trade(f,0,target+2-f.inv[0],s.prices[0]);
  const fees=f.fees;hedge(s,0,false,target,'hedge',6);assert.equal(f.inv[0],14);assert.equal(f.fees,fees);
  hedge(s,0,true);assert.equal(f.inv[0],0);assert.ok(f.fees>fees);
});
test('hover explanations show plain language, active thresholds, markets and income',async()=>{
  const window=new Window(),doc=window.document;
  doc.body.innerHTML='<span data-tooltip-trait="Liquidity" tabindex="0">Liquidity</span><article data-unit-id="maker" tabindex="0">Maker</article><button id="income-preview">Income</button>';
  initializeTooltips(doc,{counts:()=>({Liquidity:2}),credits:()=>20});
  const hover=el=>el.dispatchEvent(new window.Event('pointerover',{bubbles:true}));
  hover(doc.querySelector('[data-tooltip-trait]'));const tip=doc.getElementById('game-tooltip');
  assert.equal(tip.hidden,false);assert.match(tip.textContent,/ACTIVE/);assert.match(tip.textContent,/customer flow/);
  hover(doc.querySelector('article'));assert.match(tip.textContent,/Technology, Energy/);
  hover(doc.getElementById('income-preview'));assert.match(tip.textContent,/4 base \+ 2 interest/);
  doc.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(tip.hidden,true);
  await window.happyDOM.close();
});
