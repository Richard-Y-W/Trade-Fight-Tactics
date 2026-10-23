# Prototype 0.1 — implementation and handoff

**Historical record:** this describes the first version. [Prototype 0.2](PROTOTYPE-V0.2.md) supersedes the roster, shop, deployment, trait, result-screen, lobby, and testing details below.

Recorded: October 21, 2026. This document describes the code at the time of the initial prototype, not the full intended game. [GAME-VISION.md](GAME-VISION.md) records the larger design.

## Run and verify

Requires Node.js 22 or later; no dependency installation is needed.

```powershell
npm run dev
```

Open http://127.0.0.1:5173. Stop the server with Ctrl+C.

```powershell
npm test
npm run check
git diff --check
```

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Arena, terminal, shop, help, and closing-dialog structure |
| `src/engine.js` | Seeded price generation, quotes, routing, trades, inventory, hedging, valuation, and settlement |
| `src/app.js` | Recruitment, phase transitions, live commands, bot selection, presentation, health, weekends, and sound |
| `src/style.css` | Responsive layout, heatmap, cards, typography, animation, reduced-motion support |
| `server.mjs` | Local HTTP server on `127.0.0.1:5173` |
| `tests/engine.test.js` | Seven tests covering core simulation invariants |
| `package.json` | Development, test, and syntax-check commands |

The app has no framework or package dependencies. Google Fonts are loaded optionally, with local system fallbacks. Unit graphics are custom inline SVG symbols. No generated character assets are used.

## Current playable loop

1. Start with 8 recruitment credits, 100 firm health, and four empty unit slots.
2. Recruit any affordable combination; units are unique within the desk.
3. Sell units for full cost during preparation.
4. Ring the bell for a 40-second local duel against a bot.
5. Use unlocked terminal buttons or their displayed number shortcuts.
6. Inspect a selected asset's quotes and position.
7. At the close, compare net marked-to-market P&L and apply health damage.
8. Advance, receiving 3 recruitment credits, and adapt the desk.
9. After Friday, choose a call, put, or no option for the next Monday.
10. Restart when one firm's health reaches zero, or use New Match.

Preparation has no timer. Trading uses 80 ticks scheduled at half-second intervals. Pause stops simulation advancement; it is a local testing aid, not a future PvP rule. Browser background throttling can extend real wall-clock duration.

## Economy and outcome

Recruitment credits and trading cash are separate. Both firms start each day with a $10,000 trading bankroll and flat inventory. Asset starting prices also reset daily. Units, health, credits, and a pending option persist between relevant phases.

```text
equity = cash + sum(inventory × current mark)
net day P&L = closing equity − 10,000
```

Net day P&L includes customer fees, hedge costs, and option premium/payoff. Market tile P&L includes realized plus unrealized asset P&L but excludes separately charged fees and options. This explains small differences between summed tile values and the main score.

The smaller result loses. If the gap is below $0.005, no damage is applied. Otherwise:

```text
damage = min(25, 8 + floor(abs(P&L gap) / 5))
```

Daily resets and the damage formula are provisional. There is no margin, financing model, daily capital allocation, or insolvency liquidation system.

## Markets

| Asset | Ticker | Starting mark | Asset-specific movement parameter |
| --- | --- | --- | --- |
| Technology | NOVA | $100 | 0.24 |
| Energy | VOLT | $75 | 0.18 |
| Commodities | ORE | $50 | 0.13 |

Each tick has a common price disturbance and an asset-specific disturbance. Every nineteenth tick can add a larger disturbance. Marks have a floor of $5. These parameters are game tuning values, not annualized volatilities.

Price generation, customer flow, and signal noise have separate seeded random streams. Changing a build or pressing a button does not change the external price path. The live app chooses a repeatable seed from week and day. This makes initial debugging repeatable but also means future replayability needs varied match seeds.

There is no endogenous price impact. Firm trades affect allocations and inventory, not the external reference path. The model is a limited-depth quote competition, not a full exchange with a deep order book.

## Quote and execution rules

Base quote center is the current reference mark plus noisy estimation, inventory skew, and a possible directional tilt.

```text
center = mark + estimation noise − inventory × 0.009 + lean × 0.18
bid = center − half-spread
ask = center + half-spread
```

| Setting | Half-spread | Size per side |
| --- | --- | --- |
| Balanced | $0.13 | 4, or 8 with Block Desk |
| Defensive | $0.28 | Half of normal size |
| Press active | $0.055 | Size still follows stance |

Quotes normally refresh every four ticks. Colocation changes this to every tick; Spread Engine changes it to every two ticks. Colocation takes precedence when both are equipped, so their cadence benefits do not stack.

Per asset, four customer requests arrive each tick, each sized from one to four units. A 32% branch chooses direction based on the latest price move; other customers choose randomly. This is a simplified proxy for informed flow, not a full informational trader model.

Customer orders route by best price, then Colocation priority for equal prices, then alternating firm priority. Available displayed size is consumed until refreshed. Position limits restrict fills: 30 units per asset normally, 50 with Block Desk.

After customer routing, crossed firm quotes can match directly at the seller's ask. These direct trades transfer cash and inventory between firms, have no separate fee in this prototype, and do not increment the customer-fill counter.

Customer executions cost $0.005 per unit. Realized P&L uses weighted average inventory basis and correctly handles reducing, closing, or reversing a position.

## Units and controls

| Unit | Cost | Current effect | Live capability |
| --- | --- | --- | --- |
| Colocation | 3 | Refresh every tick; win equal-price priority | Passive automation |
| Signal Lab | 3 | Noise range narrows from ±$0.325 to ±$0.06 | Cycle neutral / long / short tilt |
| Risk Officer | 3 | Hedge inventory exceeding magnitude 10 back to 10 before subsequent customer flow | Emergency full hedge |
| Flow Trader | 2 | Enables a temporary quote-pressure action | Press the market |
| Block Desk | 2 | Size doubles; per-asset position limit increases to 50 | Passive capacity; no size toggle |
| Spread Engine | 2 | Refresh every two ticks | Passive automation |

Every build can switch Balanced/Defensive stance. Signal and stance commands invalidate existing quotes so they refresh on the next tick. Press also requests a refresh.

Press lasts nominally five simulation seconds. Press and emergency hedge share an eight-second cooldown. An emergency hedge closes all positions through a modeled external venue. Automatic hedging only reduces inventory above the threshold; new orders can increase exposure again within that tick.

Hedge cost is $0.08 slippage plus $0.01 fee per unit. Slippage enters trade P&L; fees are tracked separately.

The terminal operates the whole desk, not just the selected asset. Selecting a tile changes the inspector. Commands are disabled outside live play and while paused.

## Bot

| Period | Equipped units |
| --- | --- |
| Week 1, days 1–2 | Spread Engine, Signal Lab |
| Week 1, days 3–5 | Spread Engine, Signal Lab, Flow Trader |
| Week 2 onward | Colocation, Signal Lab, Risk Officer |

The bot uses quote pressure when available, off cooldown, and below 60% inventory pressure. It does not shop, use directional tilt, scout, acquire options, or adapt its composition to the player. These are scripted opponent loadouts.

## Weekend options

After Friday, pick one of three choices:

- Call: pay $8 next Monday; receive `12 × max(NOVA close − 100, 0)`.
- Put: pay $8 next Monday; receive `12 × max(100 − NOVA close, 0)`.
- Stay Liquid: no contract or premium.

Premium is deducted when the next day begins. Payoff is credited once at its close. Options are not marked intraday, so live P&L includes the premium but does not show changing option value. There is no multiplayer draft scarcity, selection order, volatility pricing, Greeks, resale, or other expiry.

## Presentation semantics

- Green is Mint Capital; blue is Cobalt Partners.
- Main counters show net equity change, including unrealized inventory.
- Market tile amounts show asset P&L before separately charged fees.
- Flow bars show cumulative customer units filled, not profit or market control as a victory metric.
- Floating execution amounts show immediate edge versus the current mark. They are not independently realized cash rewards.
- Fill counters count customer units, despite the short “fills” label; they are not the number of trade events.
- Inventory pressure is the largest absolute position divided by its per-asset limit, expressed as a percentage.
- Autonomy is a descriptive capability index: base 20; quote automation +20 or +25; Risk Officer +25; Signal Lab +10. It is not a simulation probability or measured percentage of actions automated.
- Unit activity animations exist, but individual-unit profit attribution is not implemented.
- Help pauses live play. Sound is opt-in. Responsive CSS and reduced-motion rules are present.

## Verification status

At the end of initial implementation, all seven engine tests passed; JavaScript syntax checks and `git diff --check` passed. The HTTP server returned 200 for the page and its JavaScript/CSS resources.

The tests cover routing and displayed depth, ledger reversals, gated capabilities and hedge cost, deterministic replay and position bounds, price-path independence from builds/commands, option premium and one-time settlement, and P&L reconciliation across seeds.

No browser was available through the session's preview tools. Visual layout, actual browser interactions, audio, small-screen rendering, and a complete UI journey have **not** been verified. A preliminary scenario batch showed build differences but did not establish balance; it also preceded the final random-stream separation and is not a current balance baseline.

## Remaining work

- Play the actual UI and verify the complete day/week/weekend/restart flow.
- Test and tune active versus autonomous builds across shared market seeds.
- Make trading interactions and contributions more visible without adding text clutter.
- Add equipment, item combinations, stronger unit identities, and intentional trait interactions.
- Add short opening PvE and actual progression in market complexity.
- Decide persistent exposure, financing, margin, and survival rules.
- Introduce realistic portfolio/correlation mechanics if they improve gameplay.
- Plan authoritative multiplayer only after the duel is worth repeating.

The prototype is a starting experiment. It does not implement the complete design, and its temporary stats or architecture should not silently become permanent requirements.
