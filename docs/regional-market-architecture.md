# Shared regional trading floor — current architecture

Implemented 2026-10-23. This iteration supersedes the mirrored-half battlefield. Historical audits and design sections describe earlier rules; use `npm run audit:regional` for the new model.

## Audit and preservation

Starting point: Node ES modules, HTML menus/economy, PixiJS v8 with accessible HTML deployment, five generic proxies, mirrored local coordinates, real FIFO books and per-unit inventory accounts. Existing pool, shops, bench, merges, interest, traits, intervention cooldowns, 80 × 500ms sessions, independent seeded price streams, local finite support, weekend events and tests were reused. No engine migration, new unit roster or item system.

Targeted changes: instrument definitions and marks; configurable book tick scale; contract-aware accounting/inspection; market assignment in quote and research jobs; shared coordinates; desktop shell; per-region rendering and event destinations. Legacy headless fixtures retain the explicit historical proxy profile. The browser and its background duels use `marketModel: 'regional'`, not relabeled proxies.

## Map and progression

`src/markets.js` is the single source for product definitions, colors, labels, compatibility, map and unlocks. Every square belongs to exactly one contiguous market. Eight rows, top to bottom:

```text
EEEEOOOO
EEEOOOOO
EEEOOOOR
EEEEOOOR
CCCCRRRR
CCCRRRRR
CCCFFRRR
DDDDFFFF
```

| Key | Market | Cells | First accessible |
|---|---|---:|---|
| E | Equities / ETFs | 14 | Monday |
| O | Options / Vol | 16 | Tuesday |
| R | Rates | 14 | Wednesday |
| C | Commodities | 10 | Thursday |
| F | FX | 6 | Wednesday |
| D | Credit | 4 | Friday |

Later weeks retain all markets. Dormant regions remain visible and describe their unlock day on hover. No separate tutorial/PvE phase exists in the current application, so Day 1 is the simple introductory equities duel. Deployment limits remain 3/4/5/6/7, total units without role quotas. Area influences available positions only; it never enters customer flow, volatility, payoff, fees or profitability.

## Instruments, not cosmetic aliases

| Region | Instrument | Actual mechanism |
|---|---|---|
| Equities | Broad ETF, starts $100 | Hidden noisy reference; public delayed mark; passive/directional trading |
| Options | European ETF call, K=$100 | Black–Scholes price from spot, IV, rate and time; delta/vega; intrinsic expiry; multiplier 10 |
| Rates | Duration-5 bond proxy | `100 exp(-5 × change in yield)`; explicit rate sensitivity |
| Commodities | Spot basket, starts $50 | Separate innovations and periodic supply shocks |
| FX | EUR/USD, starts 1.1000 | Geometric currency-price dynamics; pip ticks; 1,000 EUR contracts in USD |
| Credit | Duration-4 risky bond | Yield plus credit-spread repricing; mean-reverting spread; one-time default recovery haircut |

Each has its own persistent shared book, depth, customer budgets/flow, public/hidden histories and ledger slot. Options use cent ticks, FX pip ticks. The new canonical order is ETF, call, rates bond, commodity basket, FX, credit: old numeric indexes must not be copied into this schema.

Semantic aliases: NOVA → equity-etf; VOLT and ORE → commodity-basket; BOND → duration-bond; FX → eur-usd. **VOLT is never migrated into options.** Old products' open positions cannot safely become new contracts with different multipliers. There is no persistent save/import subsystem; historical sessions/replays remain historical, and there is no automatic live-inventory conversion. `enableRegionalCompany` marks schema 2, removes legacy mirrored coordinates on entry and assigns eligible owned units to unlocked cells; unsupported recruits remain on the bench. New replay records include model, instrument IDs, tick scales, multipliers and active markets. Original recordings remain available as historical artifacts.

## Assignment, support and shared ownership

An ordinary unit trades or researches the instrument at its tile. The options specialist requires Options. Relative Value Lead requires Rates or Credit and trades both only when both are active, comparing the credit price with its rate-only bond relationship. Its legs execute independently; this is a risky spread strategy, not risk-free arbitrage. Mean reversion excludes options. The field guide and inspection show compatibility.

Both firms use the same 64 coordinates and books. One own unit per tile; a rival may occupy the equivalent tile. Rendering reserves the left half-slot for your unit and right half-slot for the rival, even when one slot is empty. Player placement is never displaced by reveal. Bench-to-board placement, swaps and locked/incompatible rejection are atomic. Scouting remains a snapshot in the right inspector; it does not reveal future opponent changes on the floor.

Each region's label anchor doubles as a small network gateway. Network delay is `floor(Manhattan distance to gateway / 2)` ticks, each 500ms. Local engineering can remove one tick; finite processing queues/managers and existing range/capacity rules still apply. This is a modeled logical network distance, not geographic distance or a profit bonus. Research produces noisy estimates only for its assigned product; only connected traders with estimates for that product consume them. Execution/management and risk links may cross a nearby region boundary. Automated hedging is costly inventory liquidation of covered positions, not a magical shield or a full derivatives delta-hedging engine.

Bots distribute trading units across eligible open regions and place support near traders. This is a transparent heuristic; no bot reads future prices. Unusual player compositions, including support-only firms, remain legal.

## Accounting and risk

For each instrument `a`, cash change is `-quantity × execution price × multiplier - fee`. Equity is cash plus marked contract inventory. Basis stays in quoted price units. Realized and unrealized P&L use the multiplier once. A call premium is a cash flow, not an immediate fictitious loss; open calls carry their model mark. At tick 80, call inventory cash-settles at `max(ETF close - 100, 0)`, without paying premium twice. Short positions use the same signed ledger. The separate weekend ticket retains its documented $8 premium and expiry-only payoff; it is excluded from unit/regional attribution and shown as an other/option adjustment.

Regional P&L includes instrument trading fees and support/refresh costs allocated to the source unit's region. Per-unit net is the marked result of its order stream, **not** its causal marginal contribution to the firm. Support units show estimates, coverage, routing use and inventory trimmed, without invented profit credit. Trade, unit, region and firm totals reconcile in tests/audits, except the explicitly separate weekend-ticket adjustment. Hedge costs are already included in cash/P&L.

Risk inspection uses current call delta/vega, bond DV01, credit CS01, gross/net exposure, concentration and a separate credit jump-loss diagnostic. The displayed sigma is a **local factor stress approximation**, not a calibrated covariance estimate, VaR or maximum loss. It excludes default tails from sigma. Shared rate/credit and ETF/call exposures net before factor shocks. No claim of calibrated institutional realism is made. The illustrative credit default hazard is deliberately exaggerated (0.0001 per ordinary tick, 0.002 in stress), not estimated from real credit data.

## Limits

- One illustrative instrument per region; no ETF constituent basket, FX triangular arbitrage, yield curve or full credit/default settlement model.
- Option pricing assumes European exercise, a simplified IV process, and a one-day horizon compressed to 40s. No option chain, calibrated smile or explicit dividend model.
- External flow and prices are authored stochastic processes, independent of player impact. Customer/synthetic liquidity is an explicit external counterparty; firms need not be zero-sum against each other.
- Cash may go negative; there is no capital-based margin, borrow, financing or forced liquidation model. Contract inventory limits remain the primary constraint. FX and short options therefore need further capital-risk balancing.
- Board badges use initials, ownership color and hover/selection for full identity at smaller viewports. No completed human beginner-readability study or fun certification.
- Local bot exhibition, not networked PvP. No expanded item/equipment system.

Financial references informing the abstractions: [OIC option pricing factors](https://www.optionseducation.org/referencelibrary/faq/option-price-behavior), [OIC Black–Scholes](https://prd-web.optionseducation.org/advancedconcepts/black-scholes-formula), [CME DV01](https://www.cmegroup.com/trading/interest-rates/files/Calculating_the_Dollar_Value_of_a_Basis_Point.pdf), [CME credit spread and risk exposure](https://www.cmegroup.com/articles/2024/using-bloomberg-credit-futures-in-credit-portfolio-risk-management.html). These sources do not validate the game's parameter calibration or balance.

## Source change map

- New definitions, geometry, pricing and factor risk: `src/markets.js`.
- Books, contract ledgers, assignment, fees, settlement: `src/orderbook.js`, `src/engine.js`, `src/market-session.js`.
- Company/schema conversion, bot allocation, deployment and latency: `src/board.js`, `src/company.js`, `src/league.js`, `src/progression.js`, `src/positioning.js`.
- Shell, placement, Pixi/events/fallback and inspection: `index.html`, `src/app.js`, `src/regional.css`, `src/board-ui.js`, `src/floor-pixi.js`, `src/floor-bridge.js`, `src/floor-model.js`, `src/board-overlays.js`, `src/analytics.js`, `src/battle-readout.js`, `src/combat-view.js`, `src/feel.js`, `src/combat-events.js`, `src/catalog.js`, `src/roster.js`, `src/strategies.js`. Browser vendor bundle rebuilt from source; no new third-party art/license requirements.
- Verification: `tests/regional.test.js`, updated `tests/ui.test.js` / `tests/daily-ramp.test.js`, `e2e/regional.spec.js`, adapted `e2e/battlefield.spec.js`, `scripts/audit-regional.mjs`, package scripts, generated audit/replay/screenshot/video artifacts.
- Current documentation: this document, `regional-ux-and-validation.md`, README, CONTEXT and current-update sections in the existing financial/battlefield/readability/results documents.
