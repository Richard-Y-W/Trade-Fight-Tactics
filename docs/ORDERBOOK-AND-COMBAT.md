# Order-book combat and readable unit roles

Latest refinement: [savings, rivalry, hover explanations, and profitability](ECONOMY-AND-RIVALRY.md) supersedes older quoting behavior, hedge frequency, lobby width, and audit figures below. The order-book structure and role design remain applicable.

October 22, 2026. Current implementation reference. This supersedes the single-policy/top-of-book implementation in [MARKET-MATH.md](MARKET-MATH.md); that document retains the underlying reference-price, accounting, option, recruitment, and risk formulas as a historical explanation.

## Design decision

Keep the 40-second day and JavaScript prototype. Add meaningful order-book mechanics before changing languages. The relevant bottleneck is strategic behavior and readability, not current simulation speed. The game now has real persistent resting orders with unit ownership, multiple price levels, partial fills, cancellation/replacement, FIFO queues, finite outside liquidity, and immediate-or-cancel orders.

This is an improved exchange abstraction, not a calibrated realistic market. The reference price is still exogenous. The book determines execution prices and available liquidity; it does not determine the reference price used to mark inventory. No claim of full market impact or price discovery should be made.

## Research and its application

- [Nasdaq Canada's official functionality guide](https://www.nasdaq.com/docs/2023/10/11/Nasdaq-Canada-Functionality-Guide.pdf), sections 5-6: price, time, and venue-specific priority/order instructions. Our deliberate simplification is displayed price/FIFO priority with self-trade prevention. Faster units submit earlier within a tick; they never jump an older resting order at the same price. This does not reproduce all Nasdaq priority rules.
- [Fodra and Labadie, inventory constraints and directional market making](https://arxiv.org/abs/1206.4810): supports modeling directional preferences and inventory management through quoting decisions. Our inventory skew is a small authored approximation, not an implementation or calibration of their optimization model.
- [Riot's official role and targeting discussion](https://teamfighttactics.leagueoflegends.com/en-sg/news/game-updates/teamfight-tactics-patch-15-4-notes/): illustrates why visible, distinct combat jobs matter. The translation below is our game design inference, rather than a financial interpretation endorsed by Riot.

## Role translation

| Game role | Implemented financial action | What the player sees | Counter / cost |
| --- | --- | --- | --- |
| Liquidity carry | Owns a two-sided resting quote stream | POST tokens, then FILL; volume and marked stream P&L | Stale quotes and adverse selection |
| Active carry | Normally quotes; during Press submits tightly limited IOC orders | Lever/Press, immediate fills or expired attempts | An empty book or wrong direction wastes the window |
| Liquidity anchor | Posts two price levels and contributes position capacity | Deeper order ladder and DEPTH tokens | Larger fills and inventory during shocks |
| Information support | Improves common pricing estimates; emits actual estimate events | SCAN tokens and estimate count | Cannot provide liquidity or know future prices |
| Protector | Closes excessive inventory at a paid external venue | TRIM tokens, units reduced, cost | Slippage, commission, and sacrificed upside |
| Execution carry | Owns a rapidly refreshed quote stream | Fast POST/FILL tokens | Cancel/replacement loses queue position; quote overhead |

An anchor is not a literal damage sponge: larger inventory is actual exposure. A protector cannot erase an opponent's legitimate trade. Carries earn from executions and subsequent valuation, not damage converted into invented money. Units can support hybrid builds through their separate style/specialty identities.

Six behavior families are shared across 32 identities. This is not 32 independently sophisticated trading algorithms. Units in the same family differ through grade, star, traits, and resulting firm support. Every deployed trading unit nevertheless owns its submitted orders and ledger stream; weaker units no longer silently disappear behind the strongest capability source. Research units combine estimation quality with diminishing returns: noise is proportional to `1 / sqrt(sum(researchGrade²))`, followed by the Research trait multiplier.

Support-only openings use an unattributed basic house quoting policy. Their profit is not falsely displayed as the researcher's profit.

## Tick and matching sequence

1. Advance the authored reference-price process and take fixed measurement draws. Builds and controls do not change this external path.
2. On the first tick and every second tick, cancel/replenish outside liquidity with three levels on each side. Sizes are 4, 8, and 12; price distances start at `0.12 × regimeVolatility`, then increase by $0.16 per level. Background submissions can execute against stale firm orders.
3. Research emits current-estimate support events. Automatic protectors trim every four ticks, or above 80% inventory pressure; Asset Management retains its separate periodic rule.
4. Schedule each trading unit's quote refresh. Execution units refresh every tick; makers and anchors at most every two; manual units at most every three, improved by firm infrastructure. A house policy defaults to every four. Each unit cancels its own remaining orders before repricing.
5. Submit refreshes in an authored within-tick arrival order based on unit role and infrastructure. Exact cross-firm ties alternate by tick. This is not a measured network-latency simulator.
6. Each submitted order consumes eligible opposite orders by best price and then FIFO. Execution uses the resting order's price. An incoming order that would self-trade has its remaining quantity canceled. IOC remainders expire. Other unmatched orders persist until filled or canceled.
7. Generate the existing bounded customer requests. They sweep eligible book levels, including outside depth, and can remain unfilled. Resting orders reserve per-side position capacity before new orders are admitted; firm-wide per-asset limits also apply at every execution. External hedge trades cancel the affected resting orders so obsolete capacity reservations cannot remain displayed.
8. Refresh indicative firm quotes, mark inventory, update risk and activity counters, decrement controls, then close after 80 ticks.

All trading units currently operate in all four markets. There is no spatial assignment or per-unit market targeting control yet. Quote sizes divide the firm size by the square root of the number of currently refreshing trading units, multiply by the individual grade, then round. This shares throughput with diminishing scaling rather than granting every extra unit the entire original desk's volume. Anchors add a second level $0.12 farther from their center.

Firm-wide traits still affect noise, inventory limits/skew, costs, and execution support. They modify unit behavior; they do not directly multiply profit. Value adds $0.015/$0.030 required edge per side at 2/4 identities. Allocation adds 1/2 displayed units and 5/10 inventory capacity at 2/3 identities. Agency lowers execution fees 15%/30% at 2/4 identities. Execution specialty improves within-tick arrival and reduces refresh fees 20%/40% at 2/3 identities.

Maker fills pay the compiled per-unit fee. A taker pays twice that fee. Direct player-to-player fills create equal/opposite positions and cash transfers, minus fees. External participants are modeled counterparties, not conservation-tracked player accounts.

## Expanded roster and guide

32 identities, seven styles, six specialties:

- Styles: HFT, Systematic, Macro, Liquidity, Asset Management, **Value**, **Agency**.
- Specialties: Trading, Research, Engineering, Risk, **Execution**, **Allocation**.
- Added identities: Value Apprentice, Order Clerk, Valuation Analyst, Agency Trader, Patient Capital Lead, Liquidity Routing Lead, Value Portfolio PM, Execution Services PM, Execution Analyst, Allocation Assistant, Capital Allocation Lead, Execution Risk Lead.

All traits have a plain-language summary, threshold benefits, and costs. All units have a specific description, behavior-family explanation, combat role, counter, and visual instruction. The header's **Field guide** has Units / Traits / Combat roles tabs, text search, and a firm-style filter. Unit cards open the detailed existing inspector. Only traits relevant to the deployed roster appear on the main board; the complete list stays in the guide.

The shared bag, company bench, original weekly odds, star merges, and automatic weekly floor capacity remain. New identities have the same finite tier-based supply as existing ones. Paid leveling remains deferred.

## Visual and accounting semantics

The app is capped at 1,560px, with a compact 220px lobby, a roughly 310px desktop market, smaller scoreboard, and a denser control terminal. The player's deployed floor is immediately below the market, ahead of the terminal. The opposing floor remains above the fight; benches stay distinct. Relevant traits stay visible; detailed thresholds and book depth are expandable.

Event-driven role tokens travel from the actual green or blue deployed unit to the market where it acted. POST, SCAN, DEPTH, FILL, TRIM, and direct DUEL labels correspond to actual events. At most two selected actions per side are emitted each tick, with a cap on active tokens; this deliberately compresses many executions. A DUEL means an actual fill against a rival-owned order. Both floors highlight real actions. Reserves do not perform combat actions. Reduced-motion preferences suppress travel effects.

Each trading unit has a virtual attribution ledger: cash flows, fees, and signed inventory from its orders. Its displayed P&L is `ledgerCash + sum(ledgerInventory × currentReferenceMark)`. Paid inventory-closing trades are allocated to the unit streams that hold the positions. Quote-refresh costs are allocated to the refreshing unit. These ledgers sum to firm P&L before explicitly separate option cash flows. This is actual order-stream attribution, not causal/counterfactual attribution of all benefits. A research unit's effect is deliberately shown as estimates, not invented research profit. Protectors show quantity trimmed and paid cost.

The selected market exposes three bid/ask depth levels. If a firm has no resting order on a side, its displayed bound is indicative with zero displayed size; it is not executable depth. The expandable book is the source of executable depth.

## Speed and validation

On this session's machine, a simulation benchmark ran 9,600 four-duel ticks: mean **0.287ms**, 95th percentile **0.541ms**, 99th percentile **1.122ms**, against a 500ms game tick. This excludes browser rendering and effects, is machine-specific, and is not an FPS measurement. It gives no current reason to rewrite the simulator in C++.

39 automated tests pass, including FIFO/price priority, multi-level sweeps, partial fills, cancellation and IOC semantics, self-trade prevention, unit-ledger reconciliation through hedges and controls, actual unit sources, expanded trait effects, shared supply, and a DOM journey through catalog tabs/filtering and a trading week. JavaScript syntax checks pass.

The existing audit was rerun for 12,800 simulated days. [Raw results](audits/market-audit.json) use repeated matched seeds, six existing equal-cost builds, both seats, and four regime conditions; they are not independent real market observations or a full audit of the expanded roster. HFT active beats Macro active in 69% of the seed-mixed sample; Macro active beats Liquidity research in 53%. Other matchups remain badly lopsided, including protection-heavy builds. Better order-book structure does **not** establish balanced gameplay.

No browser surface was available through computer use. DOM interactions and HTTP serving were checked; actual visual rendering, animation quality, responsive overlap, and frame rate need real-browser verification. Do not claim pixel-perfect QA.

## Remaining realism and balance work

Prices remain exogenous, information is an authored noisy current mark, the outside ladder replenishes predictably, and hedging still assumes an external venue. There is no fitted order-arrival process, endogenous reference-price impact, full margin/funding model, calibrated option market, persistent trading bankroll, hidden-fundamental forecasting engine, spatial allocation, or institutional multi-asset optimizer. The 40-second experience is intentionally compressed. The new queue mechanics make liquidity competition concrete without claiming those missing systems.

Next balance work should evaluate all seven styles and active/autonomous/hybrid policies at equal resources, reduce automatic-liquidation churn, and test stale-quote risk across regimes. Independent order ownership now makes that work inspectable. Add market-impact and funding models only with explicit behavioral targets and tests; avoid adding complexity simply to claim realism.
