# Current mechanics and market audit

**Historical snapshot, superseded:** [Order-book combat and readable unit roles](ORDERBOOK-AND-COMBAT.md) documents the current multi-level FIFO book, per-unit orders and ledgers, 32 identities, expanded traits, compact UI, and new audit. The single-policy implementation and balance numbers below describe the previous version. Reference-price generation and core accounting formulas remain applicable.

Updated October 22, 2026. This is the current implementation reference; it supersedes older prototype notes about three markets, unlimited shops, and absent portfolio risk calculations. Source: `src/engine.js`, `src/roster.js`, `src/company.js`, and `src/league.js`.

## What is implemented

The main arena and recruitment market occupy the left grid track; the lobby has its own right track spanning both rows. The layout uses the available window width and collapses to one column below 1,000px. The rival's actual deployed floor, bench, stars, and active traits appear above the fight. Lobby inspection also shows actual owned units. It does not show a second market.

Four fictional markets are active: Technology/NOVA, Energy/VOLT, Commodities/ORE, and Rates/BOND. The selected-market terminal can pause or resume new quotes. Pausing does not close positions or remove their price risk; existing holdings can still be hedged. BOND is a fictional negatively exposed proxy, not a real interest-rate or bond-pricing model.

Twenty unit identities share one finite recruitment bag across the human company and seven local bot companies. Bots buy, reroll, merge, hold reserves, deploy, and sell through the same company functions. They have preferences rather than free scripted armies. Their combat policy is still simple. Background pairings are local simulations; live spectating and online multiplayer are absent. The human still fights Cobalt repeatedly; the lobby is not yet a rotating eight-player elimination tournament.

## Recruitment and shared supply

[Riot's official patch 13.23 notes](https://teamfighttactics.leagueoflegends.com/en-gb/news/game-updates/teamfight-tactics-patch-13-23-notes/) explain how shared bags support scouting, contesting, and decisions about when to reroll. They also illustrate tier-dependent shop odds. That is a historical source for the design pattern, not a claim about today's TFT tuning. Our bag sizes and weekly odds are original provisional values for a much smaller roster.

| Career / cost | Rarity | Copies per identity |
| --- | --- | ---: |
| Entry / 1 | Grey / Common | 24 |
| Mid / 2 | Green / Uncommon | 20 |
| Lead / 3 | Blue / Rare | 16 |
| PM / 4 | Purple / Epic | 12 |
| Firm Owner / 5 | Gold / Legendary | 9 |

For each of five offers, first choose an eligible cost tier by the week's weights. Then choose an identity in that tier in proportion to its remaining copies. If a tier has no available identities, renormalize weights across the remaining eligible tiers. If none are available, leave an empty offer.

| Week | Entry | Mid | Lead | PM | Firm Owner |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 70% | 25% | 5% | 0% | 0% |
| 2 | 45% | 35% | 17% | 3% | 0% |
| 3 | 25% | 35% | 28% | 10% | 2% |
| 4 | 15% | 25% | 35% | 20% | 5% |
| 5+ | 10% | 20% | 30% | 28% | 12% |

Every displayed offer reserves one copy immediately. Buying moves that copy into ownership; it does not consume another copy. Rerolling returns unbought offers before drawing replacements. A locked shop keeps its reservations. Selling returns the underlying copies. Elimination returns all offers and owned copies exactly once. The visible free-stock count excludes both owned units and all eight companies' current offers.

Three matching identities at the same star merge. A two-star holds three base copies; a three-star holds nine. Merging does not return copies. A sale currently refunds the full base purchase value; this is prototype tuning, not an exact copy of TFT resale rules.

Start with 10 recruitment credits; gain 4 per new day; a paid reroll costs 2. Eight bench slots. Deployed capacity is 3/4/5 in Weeks 1/2/3 onward. Paid leveling remains a saved future concept. Only distinct deployed identities contribute traits; duplicate copies, extra stars, and bench units do not add trait counts.

## Styles and specialties

Each identity has one style and one specialty. Higher thresholds replace the lower effect unless the description specifies an additional effect. The arena's expandable benefits panel shows the active and next thresholds.

| Trait | First threshold | Second threshold | Tradeoff |
| --- | --- | --- | --- |
| HFT, 2/4 | Refresh at least every 2 ticks; priority +0.2 | Every tick; priority +0.6 | Each asset refresh costs $0.002 / $0.004 |
| Systematic, 2/4 | Tilt quotes by 0.25 times the latest move | Multiplier 0.50 | Reversals hurt; absolute tilt capped at $0.15 |
| Macro, 2/4 | Unlock manual directional tilt of $0.28 | Tilt $0.40; position capacity +10 | Wrong directions accumulate exposure |
| Liquidity, 2/4 | Customer fees -25%; displayed size +1 | Fees -50%; size +2 | More size can increase adverse selection |
| Asset Management, 2/4 | Every 4 seconds trim positions to at most 8 units | Every 2 seconds trim to at most 4 | Pays slippage and fees; can cut winners |
| Trading, 2/3 | Press lasts 1 extra second | 2 extra seconds | Requires a Press capability; more fills can lose |
| Research, 2/3 | Estimation-noise scale -25% | -45% | Improves estimates of now, not prediction of tomorrow |
| Engineering, 2/3 | Displayed size +1; priority +0.1 | Size +2; priority +0.2 | Does not improve the correctness of a view |
| Risk, 2/3 | Inventory skew +40%; hedge slippage -15% | Skew +80%; slippage -30% | Costs and directional losses remain |

The complete roster and industry references remain in [TRAIT-RESEARCH.md](TRAIT-RESEARCH.md). These categories are game abstractions. In particular, asset management is not synonymous with hedging, and HFT is not all quantitative investing.

Each unit's capability grade is `1 + 0.12 × (cost - 1) + 0.45 × (stars - 1)`. For each of six capabilities, the strongest deployed grade supplies that capability to a single firm-wide quoting policy. Other identities still contribute traits. **Units do not yet run independent strategies, allocations, order books, or attributable P&L.** Event-source cues identify a contributing capability, not a standalone trader's profit.

## One trading day, step by step

The simulation runs 80 half-second ticks, giving a 40-second day. Both firms receive the same price path and customers. Separate deterministic random streams drive common prices, each asset, customer flow, and measurement noise. An explicit seed reproduces a run; a new match gets a fresh seed. Changing a build does not change the exogenous price path.

### 1. Price generation

Three authored regimes change volatility, drift, informed-flow share, and customer price budgets:

| Regime | Volatility scale | Common drift / tick | Informed share | Customer budget scale |
| --- | ---: | ---: | ---: | ---: |
| Calm | 0.70 | 0 | 18% | 1.10 |
| Directional | 1.00 | +/-0.065 | 32% | 1.00 |
| Unstable | 1.65 | 0 | 55% | 0.85 |

The seed selects a regime and the directional drift's sign. Prices evolve in dollars, not percentage returns. For asset `a`, with uniform independent draws `U`:

```text
common = Uniform(-0.12, 0.12) × regimeVolatility + signedDrift
idiosyncratic[a] = Uniform(-assetVol[a], assetVol[a]) × regimeVolatility
Pnext[a] = max(5, P[a] + beta[a] × common + idiosyncratic[a] + jump[a])
```

Every nineteenth tick has an additional independent jump. Its full uniform width is `assetVol / 0.24`, multiplied by 2.4 in the unstable regime. This fixed schedule is an obvious simplification, not a realistic arrival-time model.

| Asset | Starting price | Idiosyncratic half-width | Common beta | Customer budget width | Requests / tick |
| --- | ---: | ---: | ---: | ---: | ---: |
| NOVA | 100 | 0.24 | 1.20 | 0.38 | 4 |
| VOLT | 75 | 0.18 | 0.70 | 0.30 | 4 |
| ORE | 50 | 0.13 | 0.25 | 0.24 | 3 |
| BOND | 100 | 0.07 | -0.60 | 0.18 | 3 |

Common shocks create covariance and allow some offsetting exposures. Orders do not move prices. There is no separate hidden fundamental value, price discovery, calibration, volatility clustering, or fitted historical correlation matrix.

### 2. Builds become quotes

Default refresh cadence is 4 ticks; a maker reduces it to 2; an execution capability or HFT's second threshold reduces it to 1. A stale quote remains available until refreshed or exhausted.

```text
estimate = currentMark + Uniform(-0.5, 0.5) × noiseScale
trendTilt = clamp(latestPriceChange × SystematicMultiplier, -0.15, +0.15)
quoteCenter = estimate + trendTilt - inventory × inventorySkew
              + manualDirection × convictionStrength
bid = roundDownToCent(quoteCenter - halfSpread)
ask = roundUpToCent(quoteCenter + halfSpread)
```

The firms share a measurement innovation scaled by their research quality; their errors are intentionally correlated. Base noise scale is 0.65, or `0.18 / researchGrade` when equipped, then multiplied by the Research trait's factor. Research is a noisy observation of the current mark, not a forecasting alpha model.

Half-spread is $0.13 balanced, $0.28 defensive, or $0.055 during Press. Defensive stance also halves size. Base size is 4; sizing capability, maker grade, Liquidity, and Engineering increase it. Default per-asset absolute inventory capacity is 30, increased by sizing capability and Macro's second threshold. Base inventory skew is $0.009 per unit, increased by Risk. Direction is neutral/long/short, with conviction strength $0.18 normally or $0.28/$0.40 from Macro. Research or Macro unlocks that control.

Press starts at 10 ticks (5 seconds), extended by Trading and manual-unit grade. Base shared Press/emergency-hedge cooldown is 16 ticks (8 seconds), shortened by manual grade. Stance, directional tilt, and market participation do not use this cooldown. The bot presses automatically when available and inventory pressure is below 60%; it does not use an intelligent discretionary forecast.

### 3. Matching and customer demand

Crossed firm quotes match first, bounded by displayed size and position capacity. The older quote sets the trade price; simultaneous quotes meet at their midpoint. Both sides receive opposite cash and inventory changes, so the transfer cannot create combined wealth at a common mark. These direct crosses currently pay no exchange fee.

Then each asset generates 3 or 4 customer requests per tick, each for 1-4 units. Uninformed customers randomly buy or sell, but have finite price budgets. The budget is `(0.04 + Uniform(0, customerWidth)) × regimeBudgetScale`, above the mark for a buy and below it for a sale. Customers can refuse both firms' quotes.

The informed share follows the latest movement's direction and only accepts a price at least $0.015 favorable to the current mark. This creates simplified adverse selection against stale quotes. These customers do not observe a latent future value.

Customers choose best price, then an authored infrastructure-priority score, then alternating firm priority for exact ties. Orders partially fill across firms when size permits. This is **a two-firm top-of-book matching model**, not a full exchange book with FIFO queues, many price levels, submission latency, cancellation races, and background limit-order liquidity. The priority score is a gameplay abstraction.

### 4. Accounting, hedging, and controls

For signed quantity `q` (positive means bought):

```text
cashChange = -q × executionPrice - fees
inventoryChange = q
equity = cash + sum(inventory[a] × currentMark[a])
dailyNetPnL = equity - 10,000
```

The ledger tracks weighted entry basis, realized closing profits, reversals, and unrealized marks. Per-asset P&L is realized plus unrealized before firm-wide fees and option settlement. Customer fees start at $0.005 per unit, reduced by Liquidity and maker grade. HFT additionally pays quote-refresh fees.

Automatic hedging trims each asset above approximately `12 / hedgeGrade` units, floored at 5 after rounding. Emergency hedge flattens all positions. Both assume external execution at mark plus unfavorable slippage, with $0.01 per-unit commission. Slippage starts at `$0.08 / sqrt(hedgeGrade)` and is reduced by Risk. Asset Management triggers separate periodic trimming. This is paid inventory liquidation, **not** a realistic cross-asset hedge, delta-neutral options desk, or scarce outside hedge venue. A hedge has no immediate free-profit effect.

All markets share the compiled firm policy; there is no capital-allocation optimizer or per-market specialized unit assignment yet. Market participation is the current per-market strategic control.

### 5. Risk display

Inventory pressure is `100 × max(abs(position[a]) / capacity)`. It measures how close a position is to its unit limit. It is not a probability of ruin or a portfolio volatility measure.

The separate risk estimate uses the generating model's covariance. Let `c = sum(position[a] × beta[a])`. Then:

```text
variancePerTick = c² × commonVariance
                + sum(position[a]² × (idioVariance[a] + averageJumpVariance[a]))
estimatedOneSecondSigma = sqrt(2 × variancePerTick)
grossExposure = sum(abs(position[a] × mark[a]))
```

Uniform variance is `width² / 12`; jumps are averaged over their nineteenth-tick frequency. The estimate assumes frozen inventory and the current regime, includes linear covariance, and excludes option value, future trades, fees, drift, changing regimes, and tail-model error. It is approximate, not maximum loss, VaR, an annualized number, or a calibrated forecast. Opposite common exposures can reduce sigma while increasing gross exposure. There is no margin, cash constraint, financing charge, borrow constraint, or forced liquidation engine yet.

### 6. Closing and persistence

The higher net marked equity wins, even if both firms are profitable or both lose. Health damage is `min(25, 8 + floor(abs(PnLgap) / 5))`, with no damage for a gap below $0.005. This conversion is a game rule, not a financial formula.

Each new day starts from $10,000 and initial asset prices with zero inventory. Health, company units, shared supply, credits, and shop locks persist. There is no persistent trading balance sheet or multi-day inventory yet.

The weekend offers a NOVA call, put, or skip. A chosen option costs $8 on Monday and pays `12 × max(sign × (closingNOVA - 100), 0)` at Monday's close. It is not marked intraday; no Greeks, implied volatility, realistic premium model, exercise choices, or option market are implemented.

## Reproducible audit and what it establishes

Run `npm test`, `npm run check`, and `npm run audit:market`. Raw results: [market-audit.json](audits/market-audit.json). Script: `scripts/audit-market.mjs`.

The current audit simulates 12,800 days: six equal-cost, three-slot rosters in all 15 pairings, 100 seeds, both seats, across seed-selected and three explicit regimes (12,000), plus paired input-policy comparisons (800). The same seeds recur across conditions, so these are not 12,800 independent market observations. Assertions check finite scores, per-tick reconciliation, and inventory bounds. These trials exclude recruitment adaptation, options, and skilled human input; they are diagnostic samples, not population win-rate claims or proof of balance.

Selected seed-mixed results (200 runs per pairing, 100 seeds with seats reversed):

| Build | Opponent | Build win rate |
| --- | --- | ---: |
| HFT active | Systematic research | 99% |
| HFT active | Macro active | 95% |
| HFT active | Systematic balanced | 87% |
| HFT active | Liquidity research | 77% |
| HFT active | Portfolio risk | 100% |
| Systematic balanced | Liquidity research | 37.5% |

Under paired inputs, automatic use of Press changed mean P&L by -$5.32 for HFT and +$9.87 for Macro relative to leaving the left player's controls idle. A simple lagged-trend directional policy changed P&L by -$12.15 and -$1.50 respectively. Input can help or hurt; these particular policies are not optimal play. Seat swapping and matched seeds help distinguish persistent build advantages from single-path luck.

**Conclusion:** accounting is mechanically consistent in these checks, and builds meaningfully change execution and exposure. The model is unbalanced: fast quoting is too strong against several alternatives, and frequent paid liquidation makes the tested protection-heavy roster uncompetitive. Passing accounting tests does not establish realistic dynamics or enjoyable balance.

## Next work toward the desired realism

The current game is a coherent, inspectable abstraction, not a very realistic or calibrated market simulator. The next meaningful work is separate per-unit policies and position attribution; richer hidden-value/information behavior; proper event-time book queues and latency; endogenous flow/price response; realistic hedge liquidity and portfolio constraints; option marking; and calibration against chosen reference behavior. These changes should be introduced with build comparisons and readable causal feedback. Simply adding more random assets or more formulas will not establish realism.

Balance priorities: reduce near-universal speed dominance, make protection pay for itself in appropriate regimes without subsidizing every hedge, and test active/autonomous/hybrid builds across equal resources and multiple seeds. Preserve short days and small build-dependent controls. Spatial placement, equipment, opening PvE, and the historical-era progression remain future systems.

## Verification limits

34 automated tests and JavaScript syntax checks pass. Tests cover pool conservation across all eight companies and repeated days, mergers/sales/elimination, traits, routing, direct-cross conservation, accounting, exact Press duration, seeded paths, covariance, and a Happy DOM week/weekend journey. Happy DOM verifies interactions and markup, not actual browser geometry. No browser surface was available for this session; real-browser layout, font rendering, audio, and responsive visual verification remain outstanding.
