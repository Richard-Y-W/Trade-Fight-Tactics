import { createBattleReadout } from './battle-readout.js';
import { createMarketFeel } from './feel.js';
import { progression } from './progression.js';
import { initializeTooltips } from './tooltips.js';
import { initializeCatalog } from './catalog.js';
import { paintUnitActivity,paintBook,showMarketActions,paintContests } from './combat-view.js';
import { ASSETS, SCENARIOS, scenarioFor, createDay, step, command, equity, portfolioRisk } from './engine.js';
import { RARITIES, TRAITS, byId, traitCounts, traitLevel, buildConfig, starBenefit, unitGrade } from './roster.js';
import { createCompany, deployed, reserves, buy, move, sell, sellValue, reroll, refreshDay, oddsFor, floorLimitFor, releaseCompany, incomeFor } from './company.js';
import { makeLobby, prepareBots, botUnits, startExhibition, stepExhibition, settleExhibition, dayDamage } from './league.js';
import { sceneMarkup, showUnitFeedback } from './unit-view.js';
const $ = id => document.getElementById(id);
const money = n => `${n < 0 ? '−' : '+'}$${Math.abs(n).toFixed(2)}`;
const icons = {
  speed: '<path d="m8 22 12-15-3 12h11L16 34l3-12Z"/><path d="M5 12h7M3 18h6M5 28h7"/>',
  signal: '<path d="M5 31h30M9 26v-7m8 7V12m8 14V8m8 18V4"/><path d="m6 15 10-8 9 3 10-7"/>',
  shield: '<path d="m20 4 13 5v11c0 8-13 15-13 15S7 28 7 20V9Z"/><path d="m13 19 5 5 9-11"/>',
  cursor: '<path d="m10 5 21 17-11 1-5 10Z"/><path d="m23 25 7 10M5 4 2 1M20 3l2-3M3 16H0"/>',
  blocks: '<path d="M5 5h13v13H5zM22 5h13v13H22zM5 22h13v13H5zM22 22h13v13H22z"/>',
  grid: '<rect x="5" y="8" width="30" height="24" rx="3"/><path d="M12 8V4m8 4V4m8 4V4M12 32v4m8-4v4m8-4v4M5 15H1m4 10H1m34-10h4m-4 10h4M13 16h14v8H13z"/>',
};
const icon = name => `<svg class="unit-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
const marketFeel=createMarketFeel(document,icon);
const battleReadout=createBattleReadout(document);
let matchSeed=Date.now()>>>0;
let company=createCompany(matchSeed),lobby=makeLobby(company.pool,company,matchSeed),otherMatches=[],inspectPlayer='cobalt',selectedUnit=null;
let cards = [], day = 1, week = 1, health = [100, 100], phase = 'prep', selected = 0;
let state = createDay(), interval = null, paused = false, option = null, sound = false, audio = null;
let previousScores = [0, 0];
let marketEnabled=ASSETS.map(()=>true);
const sessionOptions=()=>({enabled:marketEnabled,activeMarkets:progression(week,day).markets,scenario:progression(week,day).scenario});
const daySeed=()=>(matchSeed+week*107+day*31)>>>0;

function beep(pitch = 440, length = .06) {
  if (!sound || !audio) return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(pitch, audio.currentTime);
  gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + length);
}
function animate(el, name) { el.classList.remove(name); void el.offsetWidth; el.classList.add(name); }
function pop(asset, text, side = 0, hedge = false) {
  const el = document.createElement('span'); el.className = `floating ${side ? 'blue-text' : ''} ${hedge ? 'hedge' : ''}`;
  el.textContent = text; document.querySelector(`[data-asset="${asset}"]`).append(el);
  setTimeout(() => el.remove(), 1200);
}
function paintWeek() {
  $('week').innerHTML = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'W/E'].map((name, i) => `<span class="day-pill ${i === day - 1 ? 'current' : i < day - 1 ? 'past' : ''}">${name}</span>`).join('');
  $('era').textContent = `WEEK ${String(week).padStart(2, '0')} / ${week === 1 ? 'THE RECOVERY' : 'ELECTRONIC EXPANSION'} - ${progression(week,day).slots} SLOTS / ${progression(week,day).markets} MARKETS`;
  $('day-title').textContent = phase === 'weekend' ? 'The floor closes. Opportunity doesn’t.' : day === 1 && week === 1 ? 'A new day. An edge to find.' : `Day ${day}. Make your next move.`;
}
function paintMap() {
  $('market-map').innerHTML = ASSETS.map((a, i) => `<button class="asset ${selected === i ? 'selected' : ''}" data-asset="${i}" aria-label="Inspect ${a.name}" aria-pressed="${selected === i}" title="${a.info}"><div class="asset-top"><span>${a.ticker} / ${a.label}</span><span>0${i + 1} ↗</span></div><div class="asset-name">${a.name}</div><div class="asset-price" id="price-${i}">$${a.price.toFixed(2)}<span class="price-change" id="change-${i}">+0.00%</span></div><svg class="sparkline" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><path id="chart-fill-${i}" fill="currentColor" opacity=".05"/><path id="chart-${i}" fill="none" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/></svg><div class="asset-bottom"><div class="asset-scores"><span class="mine" id="mine-${i}">+$0.00</span><span class="theirs" id="theirs-${i}">+$0.00</span></div><div class="flow-track"><div class="mine" id="share-${i}"></div><div class="theirs"></div></div><div class="flow-label"><span>MINT</span><span>ORDER FLOW</span><span>COBALT</span></div></div></button>`).join('');
  document.querySelectorAll('.asset').forEach(el => el.addEventListener('click', () => {
    selected = Number(el.dataset.asset);
    document.querySelectorAll('.asset').forEach(x => { const active = x === el; x.classList.toggle('selected', active); x.setAttribute('aria-pressed', String(active)); });
    paintFocus(); beep(320);
  }));
}
function paintDesk() {
  const floor = deployed(company), bench = reserves(company), editable = phase === 'prep';
  $('desk').style.setProperty('--floor-slots', company.floorLimit);
  const renderUnit = (u, active) => {
    const c = byId(u.id);
    return `<article class="company-unit rarity-${c.tier} ${selectedUnit === u.uid ? 'chosen' : ''}" data-unit="${c.capability}" data-unit-id="${c.id}" data-star="${u.star}" data-instance="${u.uid}"><button class="unit-select" data-select="${u.uid}" aria-label="Select ${c.name}">${sceneMarkup(c,icon,active,phase==='live')}<span class="unit-stars">${'★'.repeat(u.star)} <small>${c.seniority}</small></span><b>${c.name}</b><span class="unit-traits"><span class="style-tag" data-tooltip-trait="${c.style}">${c.style}</span> · <span data-tooltip-trait="${c.specialty}">${c.specialty}</span></span><small class="unit-role">${c.combatRole}</small><small class="unit-metrics">Waiting for open</small></button><button class="unit-details" data-inspect="${c.id}" data-inspect-uid="${u.uid}">Read unit</button><div class="unit-actions"><button data-move="${u.uid}" ${!editable ? 'disabled' : ''}>${active ? 'To bench' : floor.length >= company.floorLimit ? 'Swap in' : 'Deploy'}</button><button data-sell="${u.uid}" ${!editable ? 'disabled' : ''} title="Sell for ${sellValue(u)} credits">${sellValue(u)} ◎ ↗</button></div></article>`;
  };
  $('desk').innerHTML = floor.map(u => renderUnit(u,true)).join('') + Array.from({length:company.floorLimit-floor.length},() => '<div class="desk-slot"><span class="plus">+</span><span>DEPLOY A TRADER</span></div>').join('');
  $('bench').innerHTML = bench.map(u => renderUnit(u,false)).join('') + Array.from({length:company.benchLimit-bench.length},() => '<div class="bench-empty">+</div>').join('');
  $('bench-count').textContent = `${bench.length} / ${company.benchLimit}`;
  $('slots-label').textContent = `${floor.length} / ${company.floorLimit} DEPLOYED`;
  $('build-traits').textContent = `DAY ${Math.min(day,5)} CAPACITY · NEXT ${floorLimitFor(week,Math.min(5,day+1))}`;
  document.querySelectorAll('[data-select]').forEach(b => b.addEventListener('click', () => { selectedUnit = Number(b.dataset.select); paintDesk(); }));
  document.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => {
    if(!editable) return;
    const swap = floor.find(u => u.uid === selectedUnit) || floor.at(-1);
    const ok = move(company,Number(b.dataset.move),swap?.uid);
    notice(ok ? 'Trading floor updated.' : 'Bench full. Swap a reserve onto the floor or sell a unit.'); syncCompany();
  }));
  document.querySelectorAll('[data-sell]').forEach(b => b.addEventListener('click', () => { if(editable) { sell(company,Number(b.dataset.sell)); notice('Unit sold. Credits returned.'); syncCompany(); } }));
  const counts = traitCounts(floor);
  $('traits').innerHTML = ['Style','Specialty'].map(category=>`<div class="trait-group"><span class="trait-group-label">${category==='Style'?'FIRM STYLES':'SPECIALTIES'}</span>${Object.entries(TRAITS).filter(([name,t])=>t.category===category && (counts[name]||0)>0).map(([name,t])=>{
    const count=counts[name]||0,level=traitLevel(count,name),target=count<t.thresholds[0]?t.thresholds[0]:t.thresholds[1];
    return `<span class="trait-chip ${level?'active-trait':''}" data-trait="${name}" tabindex="0" title="${name}: ${t.thresholds[0]} units — ${t.effects[0]}; ${t.thresholds[1]} units — ${t.effects[1]}. ${t.tradeoff} Distinct deployed identities only.">${name} <b>${count}/${target}</b></span>`;
  }).join('')}</div>`).join('');
  $('trait-benefits').innerHTML=Object.entries(TRAITS).filter(([name])=>(counts[name]||0)>0).map(([name,t])=>{
    const count=counts[name],level=traitLevel(count,name);
    const current=level?t.effects[level-1]:'Inactive';
    const next=level<2?`Next at ${t.thresholds[level]}: ${t.effects[level]}`:'Maximum threshold reached';
    return `<div class="trait-benefit ${level?'enabled':''}"><b>${name} ${count}</b><span>${current}</span><small>${next}</small></div>`;
  }).join('')||'<p class="muted">Deploy distinct units to activate firm styles and specialties.</p>';
  const auto = Math.min(95,20 + (cards.includes('execution') ? 25 : cards.includes('maker') ? 20 : 0) + (cards.includes('hedge') ? 25 : 0) + (cards.includes('research') ? 10 : 0));
  $('autonomy').innerHTML = `${auto}<span>%</span>`;
  $('automation-meter').innerHTML = Array.from({ length: 12 }, (_, i) => `<i class="${i < Math.round(auto / 100 * 12) ? 'on' : ''}"></i>`).join('');
  $('autonomy-caption').textContent = auto >= 65 ? 'Your systems run the floor. Pick your moments.' : cards.includes('manual') ? 'An active desk. Your timing creates openings.' : 'Basic quotes run automatically. Recruit your edge.';
  $('autonomy').title = 'Capability summary, not success probability: base 20%, automation +20–25, hedging +25, research +10.';
}
function notice(text) { $('company-notice').textContent = text; }
function syncCompany() {
  state = createDay(deployed(company),daySeed(),undefined,null,sessionOptions()); cards = state.firms[0].cards; paintPrep();
}
function paintIncome() {
  const income=incomeFor(company.credits),next=Math.max(0,Math.min(50,(income.interest+1)*10)-company.credits);
  $('income-preview').textContent=`Next day +${income.total} = 4 base + ${income.interest} interest`;
  $('income-preview').setAttribute('aria-label',`Next day income ${income.total} credits. Save 10 credits per interest point, maximum 5.`);
  $('income-preview').title=income.interest===5?'Maximum interest reached.':`Save ${next} more credits to reach the next interest threshold.`;
}
function paintShop() {
  paintIncome();
  $('credits').innerHTML = `${company.credits} <small>◎</small>`; $('shop').classList.remove('option-shop');
  $('shop-eyebrow').textContent = 'RECRUITMENT MARKET';
  $('shop-title').textContent = phase === 'live' ? 'The floor is open.' : 'Find your next edge.';
  $('reroll').disabled = phase !== 'prep' || company.credits < 2;
  $('lock-shop').disabled = phase !== 'prep'; $('lock-shop').textContent = company.locked ? 'Offers locked' : 'Lock offers'; $('lock-shop').setAttribute('aria-pressed',String(company.locked));
  $('shop-odds').innerHTML = `<span>DAY ${Math.min(day,5)} ODDS</span>` + oddsFor(week,day).map((p,i) => `<span class="odds rarity-${i+1}">${RARITIES[i]} <b>${p}%</b></span>`).join('');
  $('shop').innerHTML = company.offers.map((id,slot) => {
    const c = byId(id); if(!c) return '<div class="shop-sold"><span>—</span>EMPTY OFFER</div>';
    const owned = company.units.filter(u => u.id === id).reduce((n,u) => n+3**(u.star-1),0);
    const disabled = phase !== 'prep' || company.credits < c.cost;
    return `<div class="shop-offer" data-offer-id="${c.id}"><button class="shop-card rarity-${c.tier}" data-buy="${slot}" ${disabled ? 'disabled' : ''} aria-label="Recruit ${c.seniority} ${c.name} for ${c.cost} credits. ${c.style} style, ${c.specialty} specialty. ${c.simple}"><div class="card-top"><span>${c.seniority}<small>${RARITIES[c.tier-1]}</small></span><span class="cost">${c.cost} ◎</span></div>${icon(c.icon)}<h3>${c.name}</h3><div class="shop-traits"><span class="style-tag" data-tooltip-trait="${c.style}" title="Firm style">${c.style}</span><span data-tooltip-trait="${c.specialty}" title="Specialty">${c.specialty}</span></div><p>${c.detail}</p><div class="role-tags">${c.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="pool-count" title="Free copies exclude all eight firms' owned units and reserved shop offers.">${company.pool.remaining[c.id]} free in shared bag / ${company.pool.total[c.id]}</div><div class="card-bottom">${owned ? `${owned} COPIES OWNED · ` : ''}RECRUIT TO BENCH +</div></button><button class="unit-details" data-inspect="${c.id}">Read unit · strengths & risks</button></div>`;
  }).join('');
  document.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
    if(phase !== 'prep') return;
    const result = buy(company,Number(b.dataset.buy)); notice(result.message);
    if(result.ok) { beep(550); syncCompany(); }
  }));
}
function paintControls() {
  document.querySelector('.app').dataset.phase=phase;
  const focused = document.activeElement?.dataset?.action;
  const f = state.firms[0];
  const controls = [{ action: 'stance', symbol: '◈', label: f.stance === 'defensive' ? 'Defensive' : 'Balanced', sub: 'Spread & size stance', key: '1', title: 'Toggle wider spreads and half-size orders. Available to every build.' }];
  if (cards.includes('manual')) controls.push({ action: 'press', symbol: '↗', label: 'Press the market', sub: f.press ? `${Math.ceil(f.press / 2)}s active · tighter quotes` : `${f.config.pressTicks/2}s window · ${f.config.cooldownTicks/2}s cooldown`, key: '2', title: 'Refresh and tighten quotes temporarily. Traits and upgrades change the window. More competitive prices bring more exposure.' });
  if (cards.includes('research') || cards.includes('directional')) controls.push({ action: 'lean', symbol: '⌁', label: f.lean === 1 ? 'Lean long' : f.lean === -1 ? 'Lean short' : 'Neutral signal', sub: cards.includes('directional') ? 'Macro conviction tilt' : 'Cycle your quote tilt', key: String(controls.length + 1), title: `Cycle neutral → long → short. Shift quotes by $${f.config.leanStrength.toFixed(2)}. A wrong directional view can increase losses.` });
  if (cards.includes('hedge')) controls.push({ action: 'hedge', symbol: '◇', label: 'Emergency hedge', sub: 'Flatten inventory · pay execution cost', key: String(controls.length + 1), title: `Close positions at an external hedge venue. Slippage $${f.config.hedgeCost.toFixed(3)} + $0.01 fee per unit. Shares an intervention cooldown with Press.` });
  $('controls').innerHTML = controls.map(c => {
    const cd = ['press', 'hedge'].includes(c.action) && f.cooldown;
    return `<button class="control" data-action="${c.action}" data-key="${c.key}" title="${c.title}" ${phase !== 'live' || paused || cd ? 'disabled' : ''}><span class="control-icon">${c.symbol}</span><span>${c.label}<small>${cd ? `${Math.ceil(f.cooldown / 2)}s cooldown` : c.sub}</small></span><kbd>${c.key}</kbd></button>`;
  }).join('');
  document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => act(b.dataset.action)));
  if (focused) document.querySelector(`[data-action="${focused}"]:not(:disabled)`)?.focus({ preventScroll: true });
  $('control-status').textContent = phase !== 'live' ? 'OFFLINE' : paused ? 'PAUSED' : 'CONNECTED';
}
function act(action) {
  if (phase !== 'live' || paused) return;
  const before=state.events.length;
  if (command(state, action)) {
    beep(action === 'hedge' ? 220 : 620, .12);
    showUnitFeedback(state.events.slice(before),icon);
    showMarketActions(state.events.slice(before),icon);paintControls(); paintNumbers();
  }
}
function paintFocus() {
  paintBook(state,selected);
  const f = state.firms[0], a = selected, q = f.quotes[a];
  $('focus-ticker').textContent = ASSETS[a].ticker; $('focus-price').textContent = `$${state.prices[a].toFixed(2)}`;
  $('bid').textContent = q ? `$${q.bid.toFixed(2)}` : '—'; $('ask').textContent = q ? `$${q.ask.toFixed(2)}` : '—';
  $('focus-result').textContent = `${q?.indicative&&phase==='live'?'Indicative bounds - ':''}${f.enabled[a]?'':'Quoting paused · '}Position ${f.inv[a]>=0?'+':''}${f.inv[a]} · Realized ${money(f.realized[a])}`;
  $('market-toggle').textContent=`${f.enabled[a]?'Pause':'Resume'} ${ASSETS[a].ticker} quotes`;
  $('market-toggle').setAttribute('aria-pressed',String(f.enabled[a]));
  $('market-toggle').disabled=!['prep','live'].includes(phase)||paused;
}
function paintNumbers() {
  if(!state.active[selected])selected=0;
  $('market-map').dataset.markets=String(state.active.filter(Boolean).length);
  state.firms.forEach((f, i) => {
    const score = equity(f, state.prices) - 10000, id = i ? 'rival' : 'your';
    $(id + '-score').textContent = money(score);
    if (phase === 'live' && Math.abs(score - previousScores[i]) > .6) animate($(id + '-score'), 'bump');
    previousScores[i] = score; $(id + '-flow').textContent = `${f.fills.reduce((n, x) => n + x, 0)} fills`; $(id + '-health').textContent = `${health[i]} HP`;
  });
  ASSETS.forEach((a, i) => {
    document.querySelector(`[data-asset="${i}"]`).hidden=!state.active[i];
    document.querySelector(`[data-asset="${i}"]`).classList.toggle('market-paused',!state.firms[0].enabled[i]);
    const p = state.prices[i], change = (p / a.price - 1) * 100;
    $('price-' + i).firstChild.textContent = `$${p.toFixed(2)} `;
    $('change-' + i).textContent = `${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(2)}%`;
    $('mine-' + i).textContent = money(state.firms[0].pnl[i]); $('theirs-' + i).textContent = money(state.firms[1].pnl[i]);
    const [x, y] = state.firms.map(f => f.fills[i]); $('share-' + i).style.width = `${x + y ? x / (x + y) * 100 : 50}%`;
    const history = state.history[i], min = Math.min(...history) - .3, max = Math.max(...history) + .3;
    const points = history.map((v, k) => `${history.length > 1 ? k / (history.length - 1) * 400 : 0},${90 - (v - min) / (max - min) * 80}`);
    const path = 'M' + points.join(' L'); $('chart-' + i).setAttribute('d', path); $('chart-fill-' + i).setAttribute('d', path + ' L400,100 L0,100Z');
  });
  const f = state.firms[0];
  $('risk-label').textContent = f.risk + '%'; $('risk-fill').style.width = Math.min(100, f.risk) + '%'; $('risk-fill').style.background = f.risk > 75 ? '#ffc17d' : 'var(--lime)';
  const risk=portfolioRisk(f,state.prices,state.conditions);
  $('risk-sigma').textContent=`$${risk.sigma1s.toFixed(2)}`;$('risk-gross').textContent=`$${risk.gross.toFixed(0)}`;
  $('positions').innerHTML = ASSETS.map((a, i) => `<div class="position" ${state.active[i]?'':'hidden'}>${a.ticker}<b>${f.inv[i] >= 0 ? '+' : ''}${f.inv[i]}</b></div>`).join('');
  const remaining = Math.max(0, 40 - state.tick / 2); $('timer').textContent = `0:${String(Math.ceil(remaining)).padStart(2, '0')}`; $('timer').classList.toggle('urgent', phase === 'live' && remaining < 10);
  paintFocus();paintUnitActivity(state);battleReadout.paint(state);
}
function paintLobby() {
  lobby[0].health = health[0]; lobby[1].health = health[1];
  const scores = {mint:equity(state.firms[0],state.prices)-10000,cobalt:equity(state.firms[1],state.prices)-10000};
  for(const match of otherMatches) {
    scores[lobby[match.a].id] = equity(match.state.firms[0],match.state.prices)-10000;
    scores[lobby[match.b].id] = equity(match.state.firms[1],match.state.prices)-10000;
  }
  $('lobby-players').innerHTML = [...lobby].sort((a,b)=>b.health-a.health).map((p,i) => `<button class="lobby-player ${p.id === inspectPlayer ? 'inspecting' : ''} ${p.you ? 'local-player' : ''}" data-player="${p.id}" aria-label="Inspect ${p.name}" aria-pressed="${p.id === inspectPlayer}"><span class="lobby-rank">${i+1}</span><span class="lobby-avatar">${p.name.slice(0,1)}</span><span class="lobby-name">${p.name}<small>${p.you ? 'YOU' : 'BOT'} ${phase === 'prep' ? '· PREPARING' : p.health ? '· ' + money(scores[p.id] || 0) : '· ELIMINATED'}</small></span><b>${p.health}<small>HP</small></b></button>`).join('');
  $('lobby-matches').innerHTML = otherMatches.length ? otherMatches.map(m => `<div class="match-row"><span>${lobby[m.a].name.split(' ')[0]} <b>${money(scores[lobby[m.a].id] || 0)}</b></span><small>vs</small><span>${lobby[m.b].name.split(' ')[0]} <b>${money(scores[lobby[m.b].id] || 0)}</b></span></div>`).join('') : '<p class="lobby-note">Three bot pairings begin at the opening bell.</p>';
  const player = lobby.find(p => p.id === inspectPlayer) || lobby[1];
  const units = player.you ? deployed(company) : botUnits(player,week);
  const config = buildConfig(units);
  const bench=player.you?reserves(company):reserves(player.company);
  $('lobby-inspect').innerHTML = `<span class="eyebrow">INSPECTING</span><h3>${player.name}</h3><b class="inspect-label">Floor</b><div class="inspect-units">${units.map(u => `<span class="rarity-${byId(u.id).tier}">${byId(u.id).name} ${'★'.repeat(u.star)}</span>`).join('') || '<span>Empty trading floor</span>'}</div><b class="inspect-label">Bench</b><div class="inspect-units">${bench.map(u=>`<span class="rarity-${byId(u.id).tier}">${byId(u.id).name} ${'★'.repeat(u.star)}</span>`).join('')||'<span>No reserves</span>'}</div><p>${Object.entries(config.counts).filter(([,n])=>n>=2).map(([t,n])=>`${t} (${n})`).join(' · ') || 'No active trait thresholds'}</p><small>Build inspection · actual shared-pool recruits</small>`;
  document.querySelectorAll('[data-player]').forEach(b=>b.addEventListener('click',()=>{ inspectPlayer=b.dataset.player; paintLobby(); }));
}
function paintOpponent() {
  const enemy=lobby[1],floor=deployed(enemy.company),bench=reserves(enemy.company),counts=traitCounts(floor);
  $('opponent-name').textContent=enemy.name;
  $('opponent-slots').textContent=`${floor.length}/${enemy.company.floorLimit} DEPLOYED · ${bench.length}/${enemy.company.benchLimit} BENCH`;
  const recruit=u=>{const c=byId(u.id);return `<button class="scout-unit rarity-${c.tier}" data-inspect="${c.id}" data-inspect-star="${u.star}" data-instance="${u.uid}" data-unit-id="${u.id}">${icon(c.icon)}<span><b>${c.name}</b><small>${'★'.repeat(u.star)} · <span data-tooltip-trait="${c.style}">${c.style}</span> / <span data-tooltip-trait="${c.specialty}">${c.specialty}</span></small><small class="unit-role">${c.combatRole}</small><small class="unit-metrics">Waiting for open</small></span></button>`;};
  $('opponent-floor').innerHTML=floor.map(recruit).join('')||'<span class="muted">No deployed units</span>';
  $('opponent-bench').innerHTML=bench.map(recruit).join('')||'<span class="muted">No reserves</span>';
  $('opponent-traits').textContent=Object.entries(counts).filter(([name,n])=>traitLevel(n,name)>0).map(([name,n])=>`${name} ${n}: ${TRAITS[name].effects[traitLevel(n,name)-1]}`).join(' · ')||'No active thresholds';
}
function paintPrep() {
  paintWeek(); paintDesk(); paintShop(); paintControls(); paintNumbers(); paintLobby();paintOpponent();
  $('day-result').hidden = true;
  $('rival-build').textContent=botUnits(lobby[1],week).map(u=>byId(u.id).name).join(' / ');
  $('phase-label').textContent = 'PRE-MARKET'; $('clock-label').textContent = 'OPEN IN'; $('start').disabled = !deployed(company).length; $('start').innerHTML = 'RING THE BELL <span>↗</span>';
  $('duel-label').textContent=({calm:'CALM',trend:'DIRECTIONAL',shock:'UNSTABLE'})[progression(week,day).scenario];
  $('start-note').textContent = !deployed(company).length ? 'Deploy a trader from your bench to open the market.' : option ? `${option.toUpperCase()} ready · $8 premium at opening · expires today.` : '40 seconds. One shared market. Find your edge.';
  $('pause').hidden = true; document.querySelector('.status-dot').classList.remove('live');
  $('ticker').innerHTML=`<span class="muted">TODAY'S CONDITIONS</span><span class="scenario-label">${SCENARIOS[progression(week,day).scenario].name}</span> · Customer orders have price limits.`;
}
function begin() {
  if (phase !== 'prep' || !deployed(company).length) return;
  phase = 'live'; paused = false;
  const rival = botUnits(lobby[1],week), seed = daySeed();
  state = createDay(deployed(company),seed,rival,option,sessionOptions()); cards=state.firms[0].cards; option = null;
  marketFeel.reset(state);
  otherMatches = startExhibition(lobby,week,seed,day);
  $('rival-build').textContent = rival.map(u => byId(u.id).name).join(' / ');
  $('start').disabled = true; $('start').innerHTML = 'MARKET IS OPEN <span>●</span>'; $('phase-label').textContent = 'MARKET OPEN'; $('clock-label').textContent = 'TO THE CLOSE';
  $('start-note').textContent = 'Select a market. Your terminal controls the whole desk.'; $('pause').hidden = false; $('pause').textContent = 'Pause'; document.querySelector('.status-dot').classList.add('live');
  paintDesk(); paintShop(); paintControls(); paintNumbers(); paintLobby();paintOpponent(); beep(700, .2);
  clearInterval(interval); interval = setInterval(tick, 500);
}
function tick() {
  if (paused || phase !== 'live') return;
  step(state); stepExhibition(otherMatches); paintNumbers(); paintControls(); paintLobby();
  const grouped = new Map();
  for (const e of state.events) if (e.type === 'fill') { const key = e.asset + ':' + e.firm; grouped.set(key, (grouped.get(key) || 0) + e.edge); }
  const largest = [...grouped.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  for (const [key, edge] of largest.slice(0, 2)) {
    const [a, side] = key.split(':').map(Number); animate(document.querySelector(`[data-asset="${a}"]`), side ? 'flash-blue' : 'flash-green');

  }
  const feel=marketFeel.tick(state);
  if(feel.positive&&state.tick%3===0)beep(440+Math.min(6,feel.chain)*55,.055);
  showUnitFeedback(state.events,icon);showMarketActions(state.events,icon);paintContests(state.events,icon);
  const shock = state.prices.findIndex((p, a) => Math.abs(p - state.previous[a]) > .35);
  if (shock >= 0) { pop(shock, `${ASSETS[shock].ticker} ${state.prices[shock] > state.previous[shock] ? '↑' : '↓'}`, 0, true); beep(180, .09); }
  const [f, r] = state.firms, leader = f.pnl.indexOf(Math.max(...f.pnl));
  $('ticker').innerHTML = f.risk >= 90 ? '<span class="muted">INVENTORY ALERT</span> Near capacity. Quotes may stop filling.' : state.events.some(e => e.type === 'rebalance' && e.firm === 0) ? '<span class="muted">REBALANCED</span> Exposure trimmed. Execution costs paid.' : state.events.some(e => e.type === 'hedge' && e.firm === 0) ? '<span class="muted">RISK SPECIALIST</span> Inventory trimmed. Hedge costs applied.' : `<span class="muted">ON THE FLOOR</span> ${ASSETS[leader].ticker} ${money(f.pnl[leader])} <span class="muted">/</span> ${f.fills.reduce((n, v) => n + v, 0) > r.fills.reduce((n, v) => n + v, 0) ? 'Mint leads executed volume.' : 'Cobalt leads executed volume.'}`;
  if (state.done) closeDay();
}
function closeDay() {
  clearInterval(interval); phase = 'close';
  const scores = state.firms.map(f => equity(f, state.prices) - 10000), gap = scores[0] - scores[1];
  const damage = dayDamage(...scores);
  if (damage) health[gap > 0 ? 1 : 0] = Math.max(0, health[gap > 0 ? 1 : 0] - damage);
  for(let i=0;i<2;i++)if(!health[i])releaseCompany(lobby[i].company);
  $('phase-label').textContent = 'MARKET CLOSED'; $('clock-label').textContent = 'CLOSING BELL'; $('pause').hidden = true; document.querySelector('.status-dot').classList.remove('live'); paintNumbers(); paintControls();
  $('recap-title').textContent = !damage ? 'A photo finish.' : gap > 0 ? 'You found your edge.' : 'Cobalt takes the day.';
  const nextIncome=incomeFor(company.credits);
  $('recap-subtitle').textContent = damage ? `${gap > 0 ? 'Cobalt' : 'Mint'} −${damage} HP · +${nextIncome.total} credits tomorrow (${nextIncome.interest} interest)` : `Evenly matched - +${nextIncome.total} credits tomorrow (${nextIncome.interest} interest)`;
  $('recap-stats').innerHTML = `<span>${money(scores[0])}</span><span>${money(scores[1])}</span>`;
  $('recap-breakdown').innerHTML = ASSETS.map((a, i) => `<div class="recap-row"><span>${a.ticker}</span><span>${money(state.firms[0].pnl[i])}</span><span>${money(state.firms[1].pnl[i])}</span></div>`).join('') + `<div class="recap-row"><small>Fees</small><small>−$${state.firms[0].fees.toFixed(2)}</small><small>−$${state.firms[1].fees.toFixed(2)}</small></div><div class="recap-row"><small>Inventory settled at closing marks.<br>Options settle separately in net P&L.</small></div>`;
  const ended = health.some(h => !h);
  if (ended) { $('recap-title').textContent = health[0] ? 'Mint wins the match.' : 'The firm closes its doors.'; $('recap-subtitle').textContent = 'Build a different desk and try again.'; }
  $('next').innerHTML = `${ended ? 'NEW MATCH' : day === 5 ? 'HEAD INTO THE WEEKEND' : 'PREPARE FOR TOMORROW'} <span>→</span>`;
  settleExhibition(lobby,otherMatches); paintLobby();
  const result = $('day-result'); result.hidden = false; result.className = `day-result ${!damage ? 'draw' : gap > 0 ? 'victory' : 'defeat'}`;
  $('confetti').innerHTML = !damage ? '' : Array.from({length:28},(_,i)=>`<i style="--x:${(i*37)%100}%;--delay:${i%7*.08}s;--rotate:${i*53}deg;--drift:${(i%5-2)*35}px"></i>`).join('');
  $('next').focus({preventScroll:true}); beep(gap >= 0 ? 780 : 200, .3);
}
function nextDay() {
  $('day-result').hidden=true; if (health.some(h => !h)) { reset(); return; }
  if (day === 5) { weekend(); return; }
  day++; refreshDay(company,week,day);prepareBots(lobby,week,true,day); phase = 'prep'; state = createDay(deployed(company),daySeed(),undefined,null,sessionOptions()); cards=state.firms[0].cards; otherMatches=[]; previousScores = [0, 0]; paintPrep();
}
function weekend() {
  phase = 'weekend'; day = 6; paintWeek(); paintDesk(); paintControls();
  $('phase-label').textContent = 'WEEKEND DRAFT'; $('shop-eyebrow').textContent = 'THE WEEKEND / DERIVATIVES DRAFT'; $('shop-title').textContent = 'A different shape of risk.'; $('credits').innerHTML = `${company.credits} <small>◎</small>`; $('shop').classList.add('option-shop');
  $('reroll').disabled=true; $('lock-shop').disabled=true;
  const choices = [ ['call', 'Long Call', 'Pays 12 × max(NOVA close − $100, 0). $8 premium. Expires Monday.', 'signal'], ['put', 'Protective Put', 'Pays 12 × max($100 − NOVA close, 0). $8 premium. Expires Monday.', 'shield'], ['skip', 'Stay Liquid', 'Skip the premium. Carry no option into Monday.', 'blocks'] ];
  $('shop').innerHTML = choices.map(([id, name, desc, img]) => `<button class="shop-card" data-option="${id}"><div class="card-top"><span>MONDAY EXPIRY</span><span class="cost">${id === 'skip' ? '$0' : '$8'}</span></div>${icon(img)}<h3>${name}</h3><p>${desc}</p><div class="card-bottom">SELECT & OPEN NEXT WEEK →</div></button>`).join('');
  $('start').disabled = true; $('start').innerHTML = 'CHOOSE BELOW <span>↓</span>'; $('start-note').textContent = 'One contract. Premium paid from Monday’s trading capital.'; $('ticker').innerHTML = '<span class="muted">MARKET CLOSED</span> Pick an option below. A new week awaits.';
  document.querySelectorAll('[data-option]').forEach(b => b.addEventListener('click', () => {
    option = b.dataset.option === 'skip' ? null : b.dataset.option; week++; day = 1; refreshDay(company,week,day);prepareBots(lobby,week,true,day); phase = 'prep'; state = createDay(deployed(company),daySeed(),undefined,null,sessionOptions()); cards=state.firms[0].cards; otherMatches=[]; previousScores = [0, 0]; paintPrep(); beep(520);
  }));
}
function reset() {
  clearInterval(interval);marketFeel.reset(state);matchSeed=Date.now()>>>0;company=createCompany(matchSeed);lobby=makeLobby(company.pool,company,matchSeed); otherMatches=[]; selectedUnit=null; cards = []; day = 1; week = 1; health = [100, 100]; phase = 'prep'; option = null; paused = false; previousScores = [0, 0];
  marketEnabled=ASSETS.map(()=>true);state=createDay([],daySeed(),undefined,null,sessionOptions()); $('rival-build').textContent = 'Spread Engine / Signal Lab'; paintMap(); paintPrep();
  notice('Recruit to your bench, then deploy. Three matching copies merge automatically.');
}
function inspectUnit(id,uid,star=1) {
  const c=byId(id); if(!c)return;
  if(phase==='live' && !paused)$('pause').click();
  const owned=company.units.find(u=>u.uid===Number(uid)), config=owned?.deployed?state.firms[0].config:buildConfig([{id,star:owned?.star||star}]);
  $('unit-title').textContent=c.name;
  $('unit-career').textContent=`${c.seniority} · ${c.cost} CREDIT${c.cost===1?'':'S'} · ${c.style} / ${c.specialty}`;
  $('unit-simple').textContent=`${c.detail} ${c.job}`; $('unit-risk').textContent=c.risk; $('unit-watch').textContent=c.watch;
  $('unit-tags').innerHTML=c.tags.map(tag=>`<span>${tag}</span>`).join('');
  $('unit-portrait').innerHTML=sceneMarkup(c,icon,false,false);
  $('unit-portrait').querySelector('.unit-cue').textContent='ROLE ILLUSTRATION';
  const technical={
    maker:`Quotes both sides around an estimated price, skewed by inventory. The ${owned?.deployed?'deployed desk':'unit-alone preview'} refresh interval is ${config.cadence/2}s. Fills can capture a spread or lose against changing marks.`,
    research:`Combined current-mark estimation noise has half-width $${(config.noise/2).toFixed(3)} in this ${owned?.deployed?'desk':'unit-alone preview'}. This prototype uses a noisy reference mark, not a forecast of hidden future value.`,
    hedge:`Automatically trims inventory above ${config.hedgeThreshold} units. Per-unit hedge slippage is $${config.hedgeCost.toFixed(3)}, plus a $0.01 fee. New customer orders can rebuild exposure. It does not block trades or cancel health damage.`,
    manual:`Press uses a $0.055 half-spread for ${config.pressTicks/2}s. Its shared intervention cooldown is ${config.cooldownTicks/2}s. During Press, this unit submits immediate-or-cancel orders at its chosen limits; unmatched quantity expires.`,
    sizing:`The ${owned?.deployed?'current desk':'unit-alone preview'} can quote ${config.size} units per side in Balanced stance and hold at most ${config.capacity} units per asset. The unit places two price levels; inventory limits are enforced across the whole firm.`,
    execution:`Quote refresh interval is ${config.cadence/2}s with arrival advantage ${config.priority.toFixed(2)}. The book fills by price then FIFO; speed does not jump older orders. Repricing and filling are different events.`,
  };
  $('unit-technical').textContent=`${technical[c.capability]} Star ${owned?.star||star}: grade ${unitGrade({id,star:owned?.star||star}).toFixed(2)}. ${starBenefit(id)} Each extra star adds 0.25 grade; profits are not guaranteed.`;
  $('unit-scope').textContent=`${c.combatRole}: ${c.counter} Trading units own their orders and position streams. Research and protection support the firm; their activity counters show actual estimates or exposure trimmed.`;
  $('unit-advanced').open=false; $('unit-dialog').showModal();
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-inspect]');if(button)inspectUnit(button.dataset.inspect,button.dataset.inspectUid,Number(button.dataset.inspectStar)||1);});
$('close-unit').addEventListener('click',()=>$('unit-dialog').close());
$('market-toggle').addEventListener('click',()=>{
  if(!['prep','live'].includes(phase)||paused)return;
  if(command(state,'market',selected)) {marketEnabled[selected]=state.firms[0].enabled[selected];paintNumbers();}
});
$('start').addEventListener('click', begin); $('next').addEventListener('click', nextDay); $('reset').addEventListener('click', reset);
$('reroll').addEventListener('click',()=>{ if(phase==='prep' && reroll(company,week)) { notice('Five fresh offers.'); paintShop(); beep(350); } });
$('lock-shop').addEventListener('click',()=>{ if(phase==='prep') { company.locked=!company.locked; paintShop(); } });
$('pause').addEventListener('click', () => { paused = !paused; $('pause').textContent = paused ? 'Resume' : 'Pause'; $('phase-label').textContent = paused ? 'PAUSED' : 'MARKET OPEN'; paintControls();paintFocus(); });
$('sound').addEventListener('click', () => {
  sound = !sound; if (sound) { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); beep(500); }
  $('sound').innerHTML = `♪ <span>${sound ? 'ON' : 'OFF'}</span>`; $('sound').setAttribute('aria-label', `${sound ? 'Disable' : 'Enable'} sound`);
});
$('help').addEventListener('click', () => { if (phase === 'live' && !paused) $('pause').click(); $('help-dialog').showModal(); });
$('close-help').addEventListener('click', () => $('help-dialog').close());
$('build-guide').addEventListener('click',()=>{
  if(phase==='live' && !paused)$('pause').click();
  $('guide-traits').innerHTML=Object.entries(TRAITS).map(([name,t])=>`<div class="guide-trait"><b>${name} <small>${t.category}</small></b><p>${t.summary}</p><p>${t.thresholds.map((n,i)=>`<strong>${n}</strong> ${t.effects[i]}`).join('<br>')}</p><small>${t.tradeoff}</small></div>`).join('');
  $('build-guide-dialog').showModal();
});
$('close-build-guide').addEventListener('click',()=>$('build-guide-dialog').close());
document.addEventListener('keydown', e => {
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  const b = document.querySelector(`[data-key="${e.key}"]`); if (b && !b.disabled) { e.preventDefault(); b.click(); }
});
state=createDay(deployed(company),daySeed(),undefined,null,sessionOptions());cards=state.firms[0].cards;
initializeTooltips(document,{counts:()=>traitCounts(deployed(company)),credits:()=>company.credits});
initializeCatalog({document,icon,onInspect:id=>inspectUnit(id),onOpen:()=>{if(phase==='live'&&!paused)$('pause').click();}});
paintMap(); paintPrep();
