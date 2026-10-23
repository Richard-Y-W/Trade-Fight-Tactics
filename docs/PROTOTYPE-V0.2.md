# Prototype 0.2 — company, recruitment, and combat feedback

Historical implementation snapshot, October 22, 2026. [Current mechanics and market audit](MARKET-MATH.md) supersedes the market, recruitment-pool, scouting, and risk-model limitations below. [Prototype 0.1](PROTOTYPE.md) is also retained as history.

**Subsequent roster refinement:** [Trait research and career tiers](TRAIT-RESEARCH.md) supersedes the six-trait table and unit names below. Current units use Entry / Mid / Lead / PM / provisional Firm Owner, five style families at 2/4, and four specialties at 2/3. The shop/company/lobby rules here still apply. HFT now charges refresh costs, Macro can unlock directional tilt, Systematic can follow recent moves, and Asset Management periodically rebalances. There are now twenty passing tests. The older table is retained as the initial 0.2 design record.

## Product decisions from this iteration

- Keep a fast local prototype as the immediate goal; do not expand into a complete production game yet.
- Use week-based deployment capacity now: **3 units in Week 1, 4 in Week 2, 5 from Week 3**. These exact values are provisional tuning choices.
- Save resource-funded company leveling and extra floor space as a future concept. No leveling purchase or XP system exists now.
- Keep **Trade Fight Tactics** for internal code and documentation. Choose a new public name before publication or inviting outside players. This is an explicit user direction.
- Keep three asset tiles while validating readability and the duel. More assets are possible, but adding a tile requires actual economic interactions, not just another box.

## What changed

### End of day

The blocking dialog is gone. A winner announcement appears inside the market arena. Wins get green confetti; losses use restrained blue falling particles. The rest of the company remains visible. Next Day advances explicitly, and an optional small breakdown is available inside the arena result. Reduced-motion preferences disable particles.

### Right rail and terminal

The right rail shows eight named firms in a **local bot exhibition**: the player, Cobalt, and six other bots. The other bots execute three paired simulations on the same day's external price path and customer-flow scenario, with their own quotes and positions. Their scores are calculated, not decorative random numbers. Their health updates at the close.

Clicking a firm inspects its units and active traits. Live spectating is not implemented. This is not connected multiplayer or a finished elimination tournament: the player still duels Cobalt, the primary match ends when either of those firms reaches zero health, and eliminated side bots stop being paired. The rail is groundwork for a future lobby.

The player's compact terminal sits below the market. Units continue to determine its available controls. The layout, recruitment descriptions, stats, and labels use larger, higher-contrast typography. `src/prototype.css` contains this iteration's layout and readability overrides.

### Company and deployment

Recruits go to an eight-slot company bench. Only deployed units execute and count toward traits. During preparation, units can be deployed, reserved, swapped, or sold. A full floor can swap a reserve with the selected deployed unit; if no deployed unit is selected, the last one is replaced. The bench and floor have enforced capacity limits.

Start with 10 recruitment credits and receive 4 when advancing to another trading day, including the Monday after a weekend. Trading bankroll and recruitment credits remain separate. There is no paid leveling, interest, or XP.

### Shop and rarity

Five offers are drawn from 20 unit identities. Reroll costs 2 credits. Lock preserves unpurchased offers through the next daily refresh. A purchased slot stays empty until a reroll or unlocked refresh. Duplicate purchases are allowed. Each offer is an independent draw; there is no shared finite recruitment pool yet.

| Week | Common / grey | Uncommon / green | Rare / blue | Epic / purple | Legendary / gold |
| --- | --- | --- | --- | --- | --- |
| 1 | 70% | 25% | 5% | 0% | 0% |
| 2 | 45% | 35% | 17% | 3% | 0% |
| 3 | 25% | 35% | 28% | 10% | 2% |
| 4 | 15% | 25% | 35% | 20% | 5% |
| 5 onward | 10% | 20% | 30% | 28% | 12% |

Rarity is recruitment tier, with cost equal to tier (1–5). The week odds are original provisional tuning values, not copied shop tables. Color is supplemented by a visible rarity name and cost.

### Merging and stars

Three copies of the same unit identity and star merge automatically, across floor and bench, into one unit at the next star, up to three stars. A deployed copy is retained preferentially, preserving deployment where possible. Nine one-star copies can recursively become one three-star unit. A full bench can still buy a copy if the resulting merge frees space; rejected purchases do not charge credits.

Star level is independent of rarity. Sell value preserves the recruitment cost of the underlying copies: `tier × 3^(star − 1)`.

Each unit's capability grade is `1 + 0.12 × (tier − 1) + 0.45 × (star − 1)`. The strongest deployed grade of a capability is used; duplicate copies do not add unlimited independent versions of that capability. Upgrades affect actual execution settings, such as research noise, quote capacity, hedge target/cost, execution priority, or Press duration/cooldown. These are composition-wide capabilities rather than individually modeled desks with attributable profit.

### Traits

Every unit has two traits. Count distinct deployed identities only: duplicate copies and extra stars do not count as additional trait bodies, and benched units do not count. Thresholds are 2 and 4.

| Trait | 2 distinct identities | 4 distinct identities |
| --- | --- | --- |
| Electronic | Refresh at least every 2 ticks | Refresh every tick |
| Liquidity | Customer fee −25% | Customer fee −50% |
| Protection | Inventory skew strengthened 40% | Skew strengthened 80%; hedge slippage −25% |
| Research | Signal noise −25% | Signal noise −45% |
| Discretionary | Press window +1 second | Press window +2 seconds |
| Capacity | Inventory limit +5; quote size +1 | Inventory limit +10; quote size +2 |

Thresholds modify the simulation, not a cosmetic score. The current trait effects include authored numerical bonuses that represent operational advantages; this is a game abstraction, not a claim that hiring two researchers causes a particular real-world percentage improvement.

## Unit roster

| Tier | Units |
| --- | --- |
| Common | Spread Engine, Flow Trader, Inventory Clerk, Junior Analyst |
| Uncommon | Signal Lab, Block Desk, Smart Router, Floor Broker |
| Rare | Risk Officer, Liquidity Team, Macro Strategist, Treasury Team |
| Epic | Colocation, Adaptive Model, Prime Broker, Flow Specialist |
| Legendary | Photon Link, Sentinel Risk, Frontier Lab, Rainmaker |

The six underlying capability families remain automated quoting, discretionary pressure, research, hedging, capacity, and premium execution. These 20 identities are an initial recruitment set, not 20 separate fully modeled trading algorithms. Items and equipment combinations are still future work.

## Simulation realism

The prototype preserves some useful financial relationships:

- Cash plus marked inventory defines equity.
- Buying/selling transfers cash and changes inventory, with basis and realized P&L tracked.
- Firms compete for common customer orders by price and execution priority.
- Quotes can cross and transfer positions directly between firms.
- Stale pricing and accumulated exposure can produce losses.
- Inventory hedging pays slippage and fees; more capacity can increase risk.
- Options have explicit premium and terminal intrinsic payoff.

Important simplifications remain:

- Price paths are synthetic, externally generated, and not calibrated to real assets.
- Orders do not move the reference price. There is no deep order book or exchange queue model.
- All customers trade; they have no reservation-price or demand-elasticity model.
- “Informed” customer direction is a simple proxy, not a calibrated adverse-selection model.
- Signals observe a noisy reference mark rather than a rich hidden-value process.
- Capacity, priority, and traits are authored game abstractions.
- No covariance-based portfolio risk, full margin/liquidation, borrow/financing model, or dynamic option valuation exists.
- Inventory and the trading bankroll reset daily. Options settle at the close, not intraday.

It is **financially motivated game math**, not a realistic market simulator. The next realism work should be justified by a gameplay problem: e.g. reservation prices to prevent free fills at arbitrarily unattractive quotes, or correlated exposures so hedging creates richer composition choices. Avoid adding complexity solely to claim realism.

## Architecture and validation

New modules:

- `src/roster.js`: units, rarity labels, trait counts, and compiled build capabilities.
- `src/company.js`: recruitment economy, offers, reserves, deployment, merging, selling, and weekly floor capacity.
- `src/league.js`: local bot loadouts, paired simulations, and health settlement.
- `src/prototype.css`: updated layout and readable company/shop styles.

The existing DOM-independent simulation remains in `src/engine.js`; the app consumes compiled deployed-unit configurations. Markets and customer flow remain on random streams independent of build decisions. The local UI and most company state are still held in memory; no saves or online server exist.

Run the local game with `npm run dev`. Install development test dependencies with `npm ci`, then run `npm test` and `npm run check`.

Tests include company transactions, recursive merging, full-bench behavior, swaps and weekly limits, shop odds/locks/reroll costs, distinct-identity traits, meaningful upgrade effects, local bot settlement, and existing accounting/replay invariants. A Happy DOM UI test exercises recruiting, deployment, locking, pause, live controls, inline results, day advancement, bot inspection, help, the weekend draft, next-week capacity, option premium, and restart.

Happy DOM is a development-only test dependency, not a rendering browser. Browser preview tools reported no available browser in this session. Pixel layout, animation timing, audio, and responsive rendering still require a real browser check. The user's screenshots establish issues in the earlier version; they do not verify this revision.

## Originality and naming notes

U.S. Copyright Office guidance distinguishes game ideas and methods from protected expression such as artwork and written text. This supports using genre concepts without copying a game's assets, writing, or distinctive presentation. It is not a guarantee of clearance: the Tetris/Xio decision illustrates that a close visual copy can infringe even when the developer characterizes the copied features as rules. Trademark concerns are separate and include confusion about the source of a game.

Use original art, wording, UI treatment, numerical tuning, unit identities, and source code. The market battlefield and build-generated terminal should establish their own identity. The user explicitly directed a new public-facing name later; keep the current name internal. No legal clearance search has been performed, and this record is general U.S. context rather than a legal opinion about the finished game.

Primary sources consulted October 22, 2026:

- [U.S. Copyright Office — Games](https://www.copyright.gov/register/tx-games.html)
- [Tetris Holding v. Xio Interactive — court opinion](https://www.govinfo.gov/content/pkg/USCOURTS-njd-3_09-cv-06115/pdf/USCOURTS-njd-3_09-cv-06115-0.pdf)
- [USPTO — Likelihood of confusion](https://www.uspto.gov/trademarks/search/likelihood-confusion)
