import test from 'node:test';
import assert from 'node:assert/strict';
import { createPool,createCompany,releaseOffers,releaseCompany,buy,sell,reroll } from '../src/company.js';
import { CARDS } from '../src/roster.js';
import { makeLobby,prepareBots } from '../src/league.js';

function conserved(pool,companies) {
  for(const c of CARDS) {
    const owned=companies.reduce((sum,company)=>sum+company.units.filter(u=>u.id===c.id).reduce((n,u)=>n+3**(u.star-1),0),0);
    const reserved=companies.reduce((sum,company)=>sum+company.offers.filter(id=>id===c.id).length,0);
    assert.ok(pool.remaining[c.id]>=0);assert.equal(pool.remaining[c.id]+owned+reserved,pool.total[c.id],c.id);
  }
}
test('shops reserve scarce copies and cannot offer units owned by someone else when exhausted',()=>{
  const pool=createPool([0,0,0,0,0]);for(const id of ['maker','manual','clerk','analyst']){pool.total[id]=1;pool.remaining[id]=1;}
  const a=createCompany(1,pool),b=createCompany(2,pool);
  assert.equal(a.offers.filter(Boolean).length,4);assert.ok(b.offers.every(id=>id===null));conserved(pool,[a,b]);
  const id=a.offers[0];assert.ok(buy(a,0).ok);releaseOffers(a);reroll(b,1,true);
  assert.ok(!b.offers.includes(id));conserved(pool,[a,b]);
  sell(a,a.units[0].uid);reroll(b,1,true);assert.ok(b.offers.includes(id));conserved(pool,[a,b]);
});
test('merged units retain all copies and selling or elimination returns the exact count',()=>{
  const pool=createPool([9,9,9,9,9]),a=createCompany(1,pool);releaseOffers(a);a.credits=100;
  for(let i=0;i<9;i++){assert.ok(pool.remaining.maker>0);pool.remaining.maker--;a.offers=['maker'];assert.ok(buy(a,0).ok);}
  assert.equal(a.units[0].star,3);assert.equal(pool.remaining.maker,0);conserved(pool,[a]);
  releaseCompany(a);assert.equal(pool.remaining.maker,9);conserved(pool,[a]);
  releaseCompany(a);conserved(pool,[a]);
});
test('all eight firms use one conserved pool through bot recruitment, merges, rerolls and elimination',()=>{
  const pool=createPool(),human=createCompany(12,pool),lobby=makeLobby(pool,human,12),companies=lobby.map(p=>p.company);
  assert.equal(new Set(companies.map(c=>c.pool)).size,1);conserved(pool,companies);
  for(let day=1;day<16;day++) {
    prepareBots(lobby,Math.min(3,1+Math.floor(day/5)),true,(day-1)%5+1);conserved(pool,companies);
    for(const c of companies){assert.ok(c.units.filter(u=>u.deployed).length<=c.floorLimit);assert.ok(c.units.filter(u=>!u.deployed).length<=c.benchLimit);}
  }
  lobby[3].health=0;releaseCompany(lobby[3].company);conserved(pool,companies);
});
