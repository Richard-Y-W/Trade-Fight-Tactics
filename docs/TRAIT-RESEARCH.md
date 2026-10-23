# Career tiers and trait design — research and prototype implementation

October 22, 2026. This document refines the [game vision](GAME-VISION.md) and supersedes the six-trait roster in [prototype 0.2's original record](PROTOTYPE-V0.2.md). Research informed the categories; all thresholds, statistics, and game bonuses below are our design choices. They are not empirical estimates of hiring benefits or simulations of named firms.

Latest implementation: [order-book combat and readable unit roles](ORDERBOOK-AND-COMBAT.md) expands this original 20-unit roster to 32 identities, adds Value/Agency styles and Execution/Allocation specialties, replaces execution-priority overrides with FIFO queues, and gives the current role/attribution rules. Thresholds below are historical where that document or the in-game guide differs. [Earlier market math](MARKET-MATH.md) retains reference-price and accounting formulas.

Subsequent presentation work: [visual learning and unit feedback](VISUAL-LEARNING.md) adds simple role descriptions, optional technical detail, and event-driven CSS/SVG scenes. Twenty-five tests now pass; the twenty-test count below records the earlier trait iteration.

## 1. The design structure

Each unit has four separate attributes:

| Attribute | Question it answers | Example |
| --- | --- | --- |
| Career tier / recruitment cost | How senior and expensive is this recruit? | Mid, cost 2 |
| Firm style — major trait | What kind of trading operation does this recruit support? | HFT |
| Specialty — supporting trait | What expertise does this person contribute? | Research |
| Star level | How far has this identity been upgraded by merging? | Two stars |

A Mid HFT researcher and a Lead HFT trader share a style but contribute different expertise. A Mid HFT researcher and a Lead Macro researcher share research expertise while supporting different styles. That overlap creates drafting decisions, substitutes, and hybrid teams.

“Major” and “supporting” describe how a trait contributes to a build, not how valuable or prestigious the underlying job is. A supporting Research threshold can be the reason a hybrid works.

Riot's published TFT guidance uses origins and classes as overlapping trait categories with different effects. The relevant design lesson is overlapping composition incentives and thresholds, not copying particular factions, abilities, odds, or numbers. [Riot's trait reference](https://support.riotgames.com/en-us/tft/events/teamfight-tactics-lore-legends-part-i/).

## 2. The user's career ladder

| Cost | Career label | Color / rarity |
| --- | --- | --- |
| 1 | Entry | Grey / Common |
| 2 | Mid | Green / Uncommon |
| 3 | Lead | Blue / Rare |
| 4 | PM — Portfolio Manager | Purple / Epic |
| 5 | Firm Owner — provisional | Gold / Legendary |

The first four labels came from the user. Firm Owner was suggested tentatively; it is implemented as a placeholder, not a finalized name. Founder, Partner, or CIO are possible alternatives for discussion, not adopted replacements.

This is a fictional progression for a game. Real organizations have different titles, career tracks, and ownership structures; becoming senior in research or engineering does not necessarily mean becoming a portfolio manager or owner.

Three Entry copies merge into a two-star Entry identity, not a Mid recruit. Stars improve that identity's capability grade. Cost tier and star level remain independent.

## 3. What the research says

### Market making and trading technology

Jane Street describes liquidity provision supported by quantitative analysis and close collaboration across trading, research, and technology. Its description explicitly combines automation with human judgment. This supports a game in which automated and active decisions coexist rather than representing a simple beginner/expert split. [Jane Street overview](https://www.janestreet.com/what-we-do/overview/).

Optiver's research description covers hypothesis testing, simulation, signal discovery, pricing/forecasting, production deployment, and changing market conditions. That suggests research units should improve information or model behavior, while still being vulnerable when relationships change. [Optiver research](https://www.optiver.com/what-we-do/research/).

### Systematic investing is broader than HFT

Man AHL describes a systematic investment business involving researchers, developers, and traders, with models moving through research, backtesting, and execution. It also describes an evolution beyond its initial trend-following focus. Systematic does not mean “trades as fast as possible.” [Man AHL](https://www.man.com/ahl?language=en-gb).

AQR discusses several distinct long/short styles, including value, momentum, carry, defensive, trend, and volatility, across asset groups. These offer future build possibilities beyond speed and prediction. Any in-game diversification benefit needs a supporting risk/return model rather than a guaranteed safety buff. [AQR research](https://www.aqr.com/insights/research/white-papers/understanding-alternative-risk-premia).

### Macro combines economic judgment and quantitative tools

Citadel's fixed-income and macro group describes quantitative modeling alongside macroeconomic and monetary-policy analysis, across rates, currencies, commodities, equities, and credit. That supports an active directional style with research and risk specialists, rather than treating quant and discretionary work as mutually exclusive. [Citadel fixed income and macro](https://www.citadel.com/what-we-do/fixed-income-and-macro/).

Citadel, the investment manager referenced here, should not be conflated with Citadel Securities, the separate market-making business. We are borrowing broad operational concepts, not creating branded in-game factions.

### BlackRock adds asset management and portfolio infrastructure

BlackRock describes itself as an investment manager and fiduciary. Its business offers an inspiration beyond a proprietary trading desk: an operation organizing portfolios for clients. [BlackRock overview](https://www.blackrock.com/corporate/about-us/who-we-are/about-blackrock).

Its Aladdin materials describe portfolio construction, data, risk analytics, operations, and reporting as connected capabilities. That supports rebalancing, scenario analysis, and portfolio-risk tools as gameplay directions. BlackRock should not simply be represented as “a hedge fund with more money.” [BlackRock Aladdin for asset managers](https://www.blackrock.com/aladdin/institutions/industry-segments/asset-managers).

### Financing and operations are another source of builds

Goldman Sachs Prime Services describes financing, securities lending, portfolio/risk support, and access to exposures. These suggest future treasury, collateral, borrow, and prime-services mechanics. Adding a generic “prime broker” unit without financing or margin rules would miss much of what makes that role distinctive. [Goldman Sachs Prime Services](https://www.goldmansachs.com/what-we-do/ficc-and-equities/prime-services).

### A hedge fund is not automatically hedged

The SEC's Investor.gov description notes the flexibility of hedge-fund strategies and the potential use of leverage and short selling. “Hedge Fund” is too broad to imply low risk or one particular trading behavior. If it later becomes a faction/affiliation, its bonus needs a deliberate theme such as a flexible mandate, not automatic protection. [Investor.gov hedge funds](https://www.investor.gov/introduction-investing/investing-basics/investment-products/private-investment-funds/hedge-funds).

## 4. Prototype firm styles

The five style families are intentionally simplified gameplay schools. They are not mutually exclusive real-world categories: HFT can be systematic, macro can be systematic, and asset managers can use quantitative strategies. We allow hybrids instead of claiming these are a clean industry taxonomy.

Count only distinct deployed identities. Bench units, extra copies, and extra stars do not add trait bodies. Styles activate at **2 / 4** identities.

| Style | At 2 | At 4 | Cost / weakness |
| --- | --- | --- | --- |
| HFT | Quote refresh at least every 2 ticks; execution-priority score +0.2 | Refresh every tick; priority +0.6 | Each refreshed asset quote costs $0.002 / $0.004. Speed does not fix a bad price. |
| Systematic | Automatic quote-center tilt equal to 0.25 × the last price move | Tilt multiplier 0.50 | Tilt is capped at ±$0.15; reversals can hurt. This version represents a trend-following sleeve only. |
| Macro | Unlock directional control with ±$0.28 quote tilt | Tilt grows to ±$0.40; inventory limit +10 | The player must choose a view. A wrong view can attract losing inventory. |
| Liquidity | Customer fee −25%; displayed quote size +1 | Customer fee −50%; size +2 | More displayed size can increase adverse selection and inventory. No guaranteed extra profit. |
| Asset Management | Rebalance every 4 seconds toward maximum absolute inventory of 8 per asset | Every 2 seconds toward 4 per asset | Rebalancing pays slippage and fees. It may cut winning positions. This is a simplified inventory target, not covariance-aware asset allocation. |

The primitive capability of a unit still matters. A premium execution unit can already refresh every tick without the HFT threshold; HFT also contributes priority. A risk specialist may already trim inventory, while Asset Management supplies a periodic, tighter target. These overlaps need playtesting to ensure additional units remain worthwhile.

## 5. Prototype specialties

Specialties activate at **2 / 3** distinct deployed identities, allowing them to be meaningful in a three-slot opening and to bridge multiple styles.

| Specialty | At 2 | At 3 | Why it creates a build decision |
| --- | --- | --- | --- |
| Trading | Press window +1 second | Press window +2 seconds | Supports active desks but requires a unit that supplies Press |
| Research | Signal noise −25% | Signal noise −45% | Supports pricing across HFT, macro, and systematic builds; does not reveal future prices |
| Engineering | Displayed quote size +1; priority +0.1 | Size +2; priority +0.2 | Converts infrastructure investment into execution capability, with inventory tradeoffs |
| Risk | Inventory skew strength +40%; hedge slippage −15% | Skew +80%; slippage −30% | Supports a protected desk or a more aggressive hybrid; does not eliminate risk |

Exact effects are visible in the in-game Build guide and trait tooltips. The bonuses are applied to simulation parameters, not to a post-hoc profit multiplier.

## 6. Current 20-unit roster

The identities cover all 5 styles × 4 specialties exactly once. Each style has four identities; each specialty has five. This is a deliberate small roster for the fast prototype, not a final content count.

| Cost / seniority | Unit | Style | Specialty | Individual capability |
| --- | --- | --- | --- | --- |
| 1 Entry | Junior Market Maker | Liquidity | Trading | Automatic quoting |
| 1 Entry | Junior Macro Trader | Macro | Trading | Press control |
| 1 Entry | Risk Analyst | Asset Management | Risk | Automatic and emergency hedging |
| 1 Entry | Signal Analyst | Systematic | Research | Price estimates and directional tilt |
| 2 Mid | Microstructure Researcher | HFT | Research | Sharper estimates and tilt |
| 2 Mid | Execution Trader | Asset Management | Trading | Quote size and inventory capacity |
| 2 Mid | Execution Engineer | Liquidity | Engineering | Automatic quoting |
| 2 Mid | Risk Trader | Macro | Risk | Press control |
| 3 Lead | Portfolio Risk Lead | Systematic | Risk | Hedging |
| 3 Lead | Electronic Trading Lead | HFT | Trading | Automatic quoting |
| 3 Lead | Macro Research Lead | Macro | Research | Price estimates and tilt |
| 3 Lead | Allocation Research Lead | Asset Management | Research | Hedging |
| 4 PM | Low-Latency PM | HFT | Engineering | Fast refresh and execution priority |
| 4 PM | Systematic PM | Systematic | Engineering | High-grade price estimation |
| 4 PM | Portfolio PM | Asset Management | Engineering | Capacity |
| 4 PM | Liquidity PM | Liquidity | Risk | Stronger active quoting windows |
| 5 Firm Owner | Systematic Founder | Systematic | Trading | Premium execution |
| 5 Firm Owner | HFT Founder | HFT | Risk | High-grade hedging |
| 5 Firm Owner | Liquidity Founder | Liquidity | Research | High-grade price estimation |
| 5 Firm Owner | Macro Founder | Macro | Engineering | Strong active quoting windows |

These are fictional role identities. Higher-cost recruits have a stronger grade in their individual capability, not guaranteed profitability or a claim that seniority predicts market success.

## 7. Example builds to try

### Three-slot fast/active hybrid

Microstructure Researcher + Electronic Trading Lead + Junior Macro Trader.

Activates HFT 2 and Trading 2. Automated quotes and improved pricing run in the background; the player can choose when to use the longer Press window. This requires a Lead recruit, so it is a possible shop outcome, not a guaranteed opening.

### Three-slot systematic research

Signal Analyst + Portfolio Risk Lead + Macro Research Lead.

Activates Systematic 2 and Research 2. The desk gets automatic trend tilt, lower signal noise, and an individual hedge capability. It remains exposed to reversals and hedge costs.

### Three-slot portfolio/risk hybrid

Risk Analyst + Execution Trader + Risk Trader.

Activates Asset Management 2 and Risk 2. There is larger capacity, periodic rebalancing, cheaper hedging, and Press. Protection can support activity, but all protection has costs.

### Three-slot research specialist

Signal Analyst + Microstructure Researcher + Macro Research Lead.

Activates Research 3 across three different styles. It gives up a major style threshold to specialize in information. This should be a viable alternative to always stacking a single style, but is not yet balanced against other builds.

### Five-slot systematic/HFT hybrid

Signal Analyst + Systematic PM + Microstructure Researcher + Low-Latency PM + Junior Macro Trader.

Activates Systematic 2, HFT 2, Research 2, and Engineering 2, while retaining a manual pressure control. It combines styles and support packages instead of maximizing one trait. Its lack of a dedicated hedge unit is a genuine vulnerability.

## 8. Directions researched but deferred

| Future build | What could make it distinctive | Simulation work needed first |
| --- | --- | --- |
| Statistical arbitrage / relative value | Trade divergence between related instruments | Paired residuals, relationship estimates, multi-leg fills, correlation/basis risk |
| ETF / index specialist | Basket execution and tracking decisions | An index/basket, tracking error, basket costs; creation/redemption if represented |
| Volatility / options desk | Trade nonlinear exposure and volatility views | Time-varying option valuation, expiry, premiums and Greeks with explicit costs |
| Trend / managed futures | Follow persistent moves across asset groups | Multiple horizons, turnover costs, reversals; current Systematic is only a toy version |
| Value / fundamental research | Different information horizon and valuation error | Hidden-value process and model-specific signals |
| Event-driven desk | Prepare for uncertain corporate or economic events | Public/private event signals, event resolution, clear counterplay |
| Treasury / prime services | Finance positions, manage borrow and collateral | Financing, margin, borrow availability, liquidation rules |
| Institutional allocator | Target weights and risk across a portfolio | Correlations, covariance or scenario risk, realistic allocation costs |

Do not add all of these as more bonus labels now. Each should create a distinct decision or interaction before it earns a place in the roster. Keep the fast prototype focused.

## 9. Implementation and verification

- `src/roster.js` now stores career label, style, specialty, and trait metadata.
- `src/engine.js` consumes HFT refresh costs, Systematic trend tilt, Macro conviction, and periodic Asset Management rebalancing.
- The shop shows career labels and retains rarity colors. Floor/bench cards show both traits.
- The trait panel separates Firm Styles from Specialties. A Build guide explains exact thresholds and costs outside the fight.
- Original internal IDs and company/merge rules are retained. Floor capacity remains 3 / 4 / 5 by week; paid leveling remains deferred.
- Twenty tests pass, including category coverage, specialty thresholds, hybrid activation, Macro control unlock, HFT costs, rebalancing, accounting, and the existing UI week/weekend journey.
- Real-browser visual and interaction verification remains outstanding; the automated UI test uses Happy DOM.

The present simulation still aggregates unit capabilities into one firm configuration. It does not yet simulate each individual trader's orders or attribute profit to a particular unit. The research-based naming and trait structure should not be mistaken for a newly realistic financial engine.
