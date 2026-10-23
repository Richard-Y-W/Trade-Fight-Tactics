import test from 'node:test';
import assert from 'node:assert/strict';
import { createDay,step,equity } from '../src/engine.js';
import { createBattleObserver,createBattleReadout,teamworkFor } from '../src/battle-readout.js';
import { Window } from 'happy-dom';

test('attribution reconciles every tick, separates inventory carry, and never changes simulation',()=>{
  const units=[{id:'maker',uid:1,star:2},{id:'router',uid:2,star:1},{id:'analyst',uid:3,star:1},{id:'clerk',uid:4,star:1}];
  for(const scenario of ['calm','trend','shock']) {
    const s=createDay(units,84,units,'put',{scenario}),control=createDay(units,84,units,'put',{scenario});
    const observe=createBattleObserver();observe(s);
    let expectedCarry=[0,0];
    for(let tick=0;tick<80;tick++) {
      const inv=s.firms.map(f=>[...f.inv]),prices=[...s.prices];step(s);step(control);
      expectedCarry=expectedCarry.map((v,i)=>v+inv[i].reduce((n,q,a)=>n+q*(s.prices[a]-prices[a]),0));
      const before=JSON.stringify(s),view=observe(s);observe(s);
      assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(s),JSON.stringify(control));
      view.firms.forEach((f,i)=>{
        assert.ok(Math.abs(f.holding-expectedCarry[i])<1e-7);
        assert.ok(Math.abs(f.trades+f.holding+f.other-(equity(s.firms[i],s.prices)-10000))<1e-7);
        for(const r of f.rows)assert.ok(Math.abs(r.trades+r.holding-r.net)<1e-8);
      });
    }
    const fresh=createDay(units,85);assert.equal(observe(fresh).firms[0].holding,0);
  }
});

test('teamwork names only deployed active-trait partners and explains research without fake profit',()=>{
  const s=createDay([{id:'maker',uid:1},{id:'router',uid:2},{id:'analyst',uid:3}]);
  const view=createBattleObserver()(s),firm=view.firms[0];
  assert.deepEqual(teamworkFor(firm.rows[0],firm).partners.map(r=>r.key),['2']);
  assert.match(teamworkFor(firm.rows[2],firm).support,/2 trading units/);
  assert.match(teamworkFor(firm.rows[2],firm).support,/not a forecast/);
});

test('readout selection connects real teammates and remains useful at close',async()=>{
  const window=new Window(),root=window.document;
  root.body.innerHTML='<div id="desk"><article data-instance="1"></article><article data-instance="2"></article><article data-instance="3"></article></div><section id="battle-readout"></section>';
  const s=createDay([{id:'maker',uid:1},{id:'router',uid:2},{id:'clerk',uid:3}],99);
  const readout=createBattleReadout(root);readout.paint(s);step(s);readout.paint(s);
  root.querySelector('[data-instance="1"]').click();
  assert.equal(root.querySelector('[data-instance="2"]').classList.contains('watch-partner'),true);
  assert.match(root.getElementById('battle-readout').textContent,/Trades & costs/);
  root.querySelector('[data-watch-unit="2"]').click();
  assert.equal(root.querySelector('[data-instance="2"]').classList.contains('watch-focused'),true);
  for(let i=1;i<80;i++){step(s);readout.paint(s);}
  assert.ok(root.querySelector('.watch-focused'));assert.ok(readout.model.recent.length<=3);
  await window.happyDOM.close();
});
