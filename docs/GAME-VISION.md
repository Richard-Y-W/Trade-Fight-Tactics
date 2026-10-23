# Trade Fight Tactics — game vision and conversation record

Recorded: October 21, 2026. Working title: **Trade Fight Tactics**.

Latest pacing decision: [Fast beta pacing](FAST-BETA-PACING.md). Ramp within the first week (3/4/5/6/7 units; 3/3/4/5/5 markets), preserve longer full matches as a future goal, improve stars and truthful financial feedback, and defer items until this combat loop is verified.


Latest October 22 refinement: the user wants a more compact combat screen, more styles/specialties, a browsable unit/trait catalog, and tiny unit-to-market actions from both floors to teach carry/protection/support roles. [Order-book combat and readable roles](ORDERBOOK-AND-COMBAT.md) records the implemented 32-unit roster, FIFO matching, individual order streams, and verification/realism limits. This supersedes the earlier instruction to defer animation work.

October 22 implementation update: [current mechanics and market audit](MARKET-MATH.md) documents the widened arena, separate lobby track, rival floor/bench scouting, shared limited recruitment bag across eight companies, scaling style/specialty bonuses, fourth market, and exact simulation math. The current prototype is not calibrated market realism; the audit exposes substantial build imbalance. Prioritize mechanics and readability over further animation work. The broader vision below includes future systems, not only implemented features.

## October 22 refinements — latest direction

The user subsequently requested an inline arena winner announcement with simple result effects, a right-hand lobby/other-match view, readable text, rerolls, rarity tiers and weekly shop probabilities, traits activated by deployed-unit counts, merging, and a company bench separate from its deployed trading floor. Prototype 0.2 implements the first version of these systems; see [the current implementation record](PROTOTYPE-V0.2.md).

The user explicitly clarified that this should stay a **fast-paced first prototype**. Floor capacity should increase automatically by week for now. Current tunable values are 3 units in Week 1, 4 in Week 2, and 5 from Week 3. Save the idea of spending resources to level up and unlock more desk space for later; do not add paid leveling now.

The user then proposed career labels for recruitment costs: **Entry / Mid / Lead / PM / Firm Owner**, with the five-cost title tentative. They asked for research beyond quant into asset management and other financial operations, and for overlapping major/supporting traits that enable hybrid builds. [Trait research and the current roster](TRAIT-RESEARCH.md) records the primary sources, design reasoning, current five-style/four-specialty system, and deferred richer strategies. These categories and numerical bonuses are our prototype proposal, not an assertion that real financial roles divide cleanly this way.

The user also emphasized a teaching sweet spot: visible unit behavior should let beginners infer roles, readable descriptions should explain them, and deeper mechanics should still make sense to finance-literate players. [Visual learning and feedback](VISUAL-LEARNING.md) records that direction and the initial event-driven unit animation/detail implementation. Some shorthand in the supplied write-up—such as “safe money” and a hedge automatically canceling damage—was deliberately corrected rather than adopted as a financial guarantee.

**Trade Fight Tactics remains the internal project/documentation name. The user intends to change the name before publication or bringing in outside players.**

The original discussion below is preserved as the design record. Where it calls traits, bench rules, or rarity unresolved, refer to these latest decisions and the prototype 0.2 document for the current experiment. Other-market spectating and full multiplayer remain future work.

This document preserves the design discussion pasted into the conversation and the subsequent clarifications. It describes the intended game, including ideas that are not implemented. See [PROTOTYPE-V0.2.md](PROTOTYPE-V0.2.md) for the current playable, [PROTOTYPE.md](PROTOTYPE.md) for the first version's historical record, and [CONTEXT.md](../CONTEXT.md) for a short handoff.

## 1. The pitch

Build a trading firm, recruit and equip a desk, and compete against another firm through one shared simulated market. Each trading day is a short, watchable battle. Your build changes how you trade, how much risk you can support, which tasks run automatically, and which controls appear on your terminal.

The intended experience combines:

- TFT-style drafting, composition, upgrades, economy, scouting, and adaptation.
- Market-making combat: bids, asks, customer flow, competing quotes, inventory, information, execution, and hedging.
- Portfolio interactions that create real tradeoffs between risk and reward.
- A small amount of meaningful live control, shaped by the player's build.
- Balatro-inspired satisfaction from numbers, timing, animation, sound, and combinations activating.
- A shared market heatmap where both firms' strengths and failures are visible.

The priority is a **fun competitive game that happens to be quant-heavy**. Players should be able to learn the deeper mechanics by reading, but combat should be understandable without reading paragraphs while the clock runs.

## 2. What came directly from the user

These are the strongest anchors for future implementation:

1. Players build different trading operations through purchasable strategies, units, technology, and hedges.
2. Players have influence over bids, asks, sizing, and risk, but do not manually manage every individual trade.
3. The build determines the available controls and what those controls can accomplish.
4. Autonomous algorithmic builds and more active player-operated builds should both exist. Hybrid builds should also be possible.
5. Risk and reward should interact mathematically. A hedging composition should change what exposure a player can reasonably take.
6. Two opponents watch the same market screen. One build can outperform in technology while another wins in energy or commodities.
7. Trading battles last approximately **30–45 seconds**.
8. Rounds are trading days: Day 1, Day 2, and so on. Stage-ending special rounds are weekends.
9. Opening PvE should be brief and straightforward, giving players time to learn and form a build.
10. Everyone begins from a common post-crash recovery setting. The world becomes more sophisticated as the match progresses, eventually reaching advanced technology and AI themes.
11. Weekends can offer limited options, units, strategies, or other desirable acquisitions, and can also contain special events or PvE challenges.
12. Unit contributions should be satisfying and visible: a unit earns money, takes exposure, gets helped by equipment, or is getting beaten.
13. Numbers should feel exciting to watch, like watching a Balatro score build.
14. The supplied Finviz-style heatmap is a visual reference for the battlefield.
15. Combat should use little text. Movement, ownership colors, signed numbers, and reactions should communicate what is happening.
16. The player's side is **green**, the opponent's side is **blue**.
17. Actions should interact dynamically: one action can divert, interrupt, deny, offset, or otherwise change the opportunity available to the other side.
18. Art should be appealing and coherent, without the appearance of a collection of unrelated AI-generated assets.

These anchors are more authoritative than earlier assistant suggestions about exact unit counts, action limits, engine choice, or screen organization.

## 3. Terminology

The conversation developed the vocabulary organically. Some assistant replies used “desk” for an individual unit; the user's later clarification described the whole board as a desk. Use this working convention until deliberately revised:

| Term | Meaning |
| --- | --- |
| Firm | The player's overall organization, identity, capital, health, and eventual match progression |
| Desk | The active board/composition the player assembles and operates |
| Unit | A recruited trader, team, algorithm, specialist, or infrastructure capability |
| Strategy | A rule or trading behavior; potentially a unit identity, equipment, or an unlock |
| Technology / item | Equipment that modifies a unit's capabilities or behavior |
| Trait | A shared identity or interaction between units; exact activation rules remain open |
| Terminal | The compact live control panel generated by the active build |
| Market tile | An asset or market area in the shared combat view |
| Day | One trading battle plus its associated preparation and settlement |
| Week | A group of trading days, ending in a special weekend phase |
| Weekend | A draft, acquisition opportunity, special market event, or PvE challenge |

Multiple specialist desks inside a larger trading floor were discussed as a possible later organizational layer. That is not a requirement for the first playable.

## 4. The match loop

The intended loop is:

**Recruit and equip → build a desk → configure a small set of controls → compete in a shared market → settle → inspect what worked → adapt → weekend opportunity → repeat.**

### Preparation

Buy and sell units, improve a composition, equip technology or strategies, scout rivals, and choose initial capital/risk allocation. The player should understand what their purchases let them do.

### Trading day

Both firms operate in the same market for 30–45 seconds. Units handle routine execution. The player observes their desk and makes a few consequential adjustments through its terminal.

### Close

Value positions, account for costs, show the outcome, and apply the round consequence. A short recap can explain decisive events with more detail than the live screen.

### Weekend

Pause the normal duel loop for a short event or acquisition. Keep it connected to the firm's next decisions rather than a long separate game.

### Match length and lobby size

Eight-player lobbies and roughly 20–30-minute matches were early suggestions. Four-player MVPs, ten-minute matches, and 15–20 rounds were also discussed. None of those numbers is settled. The strongest timing requirement is the short trading battle. Total pacing must be established through playtests.

## 5. The shared market is the combat system

Two independent random-profit simulations would miss the central idea. The firms should actually compete for opportunities.

The market needs three possible sources of activity:

1. Firms post resting bid and ask quotes.
2. External customers buy and sell against available liquidity.
3. Firms may take opposing liquidity when their capabilities detect an opportunity.

Better prices can attract customer orders. Better execution can win scarce opportunities or update quotes before an informed trader exploits them. Better information can improve pricing or identify stale opposing quotes. Inventory constrains how much a firm can continue buying or selling.

Both firms can profit, or both can lose, while one still wins the duel. Customer activity supplies economic opportunity; the duel need not be strictly zero-sum. Direct trades between firms must nevertheless conserve cash and inventory before any explicit costs.

### A representative fight

Technology moves upward. A research unit detects the move; its firm's quotes shift. The slower opponent sells too cheaply and accumulates a short position. Its player reduces size or uses a hedge. Meanwhile, that opponent's energy specialist may be capturing more profitable customer flow in another tile.

The outcome comes from prices, information, execution, exposure, and player decisions interacting. The player should be able to see which interaction is occurring.

### Actions that counter or affect other actions

| Action | Interaction | Suggested visual |
| --- | --- | --- |
| Improve a quote | Divert customer flow from the rival | Streams switch from blue to green |
| Refresh quickly | Remove an exploitable stale quote | An incoming opportunity disappears or misses |
| Take opposing liquidity | Consume displayed size and transfer exposure | A pulse connects firms through the asset |
| Accumulate inventory | Run into capacity and restrict future fills | Pressure meter fills and quote activity fades |
| Pull or widen quotes | Reduce participation and surrender opportunities | A stream narrows or pauses |
| Hedge | Offset exposure while paying a cost | A protective effect absorbs part of a subsequent loss |

These are design examples. A hedge protects a position; it does not automatically cancel an opposing transaction. Market rules should explain the visual interaction.

## 6. Autonomy, active builds, and the terminal

This is one of the central differentiators: **players build how much of the desk they operate themselves**.

### Autonomous build

Invests in algorithms, execution infrastructure, automatic quoting, and risk routines. Most skill expression occurs in composition, configuration, and choosing when to override. Watching the desk operate should be satisfying even with few inputs.

### Active build

Provides more opportunities for deliberate player intervention: changing quote pressure, taking an informed position, adjusting exposure, or responding to an event. The player gets the satisfaction of running the operation without entering every order.

### Hybrid build

Automates routine execution while reserving a few important decisions for the player. Automation can free attention to operate a second capability.

### Interface constraints

- Avoid an unrestricted trading terminal with many independent parameters.
- Aim initially for a few high-impact controls, approximately two to four prominent buttons where the build warrants them.
- Controls should come from capabilities, rather than being identical for all builds.
- Advanced purchases may automate an existing chore instead of adding another button.
- A more active build should not win simply because clicking more grants a profit multiplier.
- Automation should not be an inferior mode that everyone abandons once mechanically skilled.

Earlier suggestions included spread/size sliders, stance switches, risk targets, signal confidence, delta targets, and a budget of three major interventions per day. These are possible implementation choices, not agreed requirements. The user subsequently emphasized a small button-based terminal and limited micromanagement.

## 7. Units, traits, items, and upgrades

Units should have identifiable trading functions and vulnerabilities. Examples discussed include:

| Unit or capability | Role | Tradeoff |
| --- | --- | --- |
| Scalper / market maker | Frequent spread capture | Toxic flow and accumulated inventory |
| Execution specialist / exchange link | Fast updates, routing, priority | Infrastructure cost; speed cannot fix a bad model |
| Research / predictive model | Better estimates and signals | Cost, model error, regime changes |
| Risk manager / hedger | Control or offset exposure | Fees, premium, reduced directional upside |
| Statistical arbitrage | Trade relative mispricing | Execution needs and correlation breakdown |
| Directional / macro trader | Position for an expected move | Drawdown and concentration |
| Options / volatility specialist | Change nonlinear exposure | Premium, decay, and volatility assumptions |

These are candidate roles, not a final roster.

### Traits and compositions

Potential families include HFT, liquidity provision, quantitative research, risk management, cross-asset arbitrage, volatility trading, and directional macro. Hybrid compositions should be possible.

The guiding principle is for synergies to change the operation's economics. Research plus fast execution can exploit a short-lived signal. A hedge can support more aggressive quoting. Correlated or offsetting exposures can change portfolio risk.

Generic trait bonuses may still be useful for readability, but the original attraction was that the math itself creates interactions rather than every synergy being an arbitrary percentage buff.

### Items

Items can be technology, data/research, or strategies. Examples discussed:

- Colocation, FPGA accelerator, faster connection, smart routing.
- Alternative data, forecasting models, volatility estimators.
- Adaptive quoting, inventory skew, delta hedging, statistical arbitrage.

A basic market maker might become a speed-focused unit, an information-focused unit, or a protected liquidity provider depending on equipment. The user also proposed combining items and visibly improving performance.

Component recipes, slot counts, transfer rules, and whether strategies live on units or in a separate equipment layer are unresolved. The first prototype currently represents several technologies and strategies as recruitable units; this is temporary.

### Unit upgrades and positioning

TFT-style star upgrades were suggested, improving a unit's core role while equipment changes how it performs that role. No upgrade system is committed or implemented.

A functional pipeline was also suggested: data → research → risk → execution → market. Placement or adjacency could affect latency and support. A literal hex board is not required unless positioning produces meaningful decisions. The current board is only a row of slots.

## 8. Risk, reward, and financial mechanics

The desired depth includes inventory exposure, adverse selection, information quality, execution speed, capital allocation, correlated assets, hedging, and eventually derivatives.

Many small trades are not inherently safe. Repeatedly trading at bad prices can create large losses. Safety needs actual inventory controls, good pricing, offsetting positions, or protection.

Lower volatility is not automatically a better strategy. Hedging should support different decisions, not make maximum protection universally optimal. Research can fail. Correlations can change. A calm-market winner should have vulnerabilities in another environment.

### Portfolio interaction example from the discussion

For two assets:

```text
portfolio variance = wA² σA² + wB² σB² + 2 wA wB ρAB σA σB
```

Equal weights, volatilities of 20% and 25%, and correlation −0.60 give approximately 10.31% portfolio volatility. This was an illustration of diversification, not an implemented mechanic or a fixed in-game parameter. Signed positions and regime-dependent correlations would matter in an actual portfolio engine.

### Information asymmetry

A possible future model has a hidden fundamental value and firm-specific noisy estimates:

```text
firm estimate = hidden value + estimation error
```

Research affects error, execution affects response time, and the player decides how strongly to act. Exact information visibility and whether the shared display shows a reference price, traded price, or estimate remain design questions.

### Reading risk

The player wanted to see risk alongside reward. Potential advanced displays discussed include exposure, portfolio volatility, margin, scenario losses, and option Greeks. These belong in optional detail where useful; they should not overwhelm the main screen.

## 9. Winning and survival

Earlier discussion considered raw profit, risk-adjusted results, market dominance, health damage, margin calls, forced liquidation, and direct bankruptcy. The latest working recommendation was:

- Use understandable net trading results to decide a duel.
- Make excess exposure dangerous through actual limits and liquidation costs.
- Use firm health for multi-round survival.
- Treat market share, execution quality, and hedge effectiveness as explanations or secondary feedback, not automatically additional victory scores.

A per-day Sharpe-ratio contest was discouraged because very short rounds make such estimates noisy and difficult to read. This does not prohibit longer-horizon performance measures later.

The final health formula, carryover balance sheet, leverage rules, comeback mechanics, and catastrophic-loss protection remain open. The current daily bankroll reset is a prototype simplification, not a settled long-term economy.

## 10. Opening recovery, eras, and PvE

Everyone begins with comparable resources in a world where the market has just crashed. Opening PvE should be short, similar in purpose to TFT's introductory neutral rounds: learn the basics, get resources, and start choosing a direction.

A suggested three-round onboarding sequence was:

1. Reopening: bids, asks, and customer fills.
2. Returning activity: changing prices and inventory.
3. Uncertain recovery: position sizing and protection.

The user did not ask for a large separate PvE campaign.

The world can then progress through simplified thematic eras:

| Phase | Theme | Possible additions |
| --- | --- | --- |
| Opening | Post-crash recovery | Basic quoting, low complexity, first recruits |
| Early | Expansion / traditional trading | More markets, diversification, specializations |
| Middle | Technology and electronic trading | Automation, research, derivatives, cross-asset strategies |
| Late | Quant arms race / AI-stock themes | Sophisticated models, crowding, changing correlations, counters |

These are gameplay eras inspired by finance, not a literal historical curriculum. Liquidity recovery must not imply prices are guaranteed to rise; otherwise the opening has a predictable dominant directional bet.

Players share the world's progression but choose different firm identities. New technology becoming available should not force everyone into the same build.

Other PvE examples included a crash stress test, a retail-flow surge, a predatory algorithm that attacks stale quotes, and liquidity/correlation shocks. Announce the general challenge without revealing the exact future path.

Seasonal themes such as electronic trading, credit crises, AI booms, and volatility were suggested as distant content possibilities. They are not current scope.

## 11. Weekends and the carousel

The user proposed calls and puts as carousel-style acquisitions, then expanded the idea to acquiring desirable traders, algorithms, strategies, and teams.

Candidate weekend formats:

- **Derivatives draft:** limited calls, puts, straddles, or protection.
- **Talent acquisition:** a scarce specialist or rare unit.
- **Technology acquisition:** an unusual upgrade or item component.
- **Stress event:** a short PvE challenge that tests the desk and offers rewards.

Earlier suggestions included rotating these formats and letting lower-ranked firms choose earlier. Those rules are unconfirmed.

Options should have explicit economics, for example:

```text
call net payoff = multiplier × max(close − strike, 0) − premium
put net payoff  = multiplier × max(strike − close, 0) − premium
```

Their value depends on existing exposure as well as the expected market move. A put might protect one firm and express a bearish view for another.

Whether positions remain exposed to weekend news is unresolved. If the game carries them across the break, changes in value should be resolved consistently at reopening. The current prototype closes inventory daily.

## 12. Visual language and combat readability

### The heatmap reference

The user supplied an image of a Finviz-style stock heatmap: sectors contain differently sized stock rectangles, with red/green daily performance. The proposed adaptation is a shared arena with a small number of asset tiles, not a copy of the entire financial website.

Initial guidance was to use three to six large readable areas with stable positions and sizes during combat. The map can grow later if readability survives.

### Ownership and market movement

The user's final color preference is green for their firm and blue for the rival. Those colors identify ownership, not whether an asset moved up or down. Price movement can use a sparkline, arrow, or small signed percentage. Firm outcomes use signed amounts and reactions.

A stock rising does not imply the green player is winning: a short position or stale sell quote can lose during that rise.

### Low-text combat

Favor:

- Tiles pulsing or moving when something happens.
- Visible streams showing captured or diverted order flow.
- Quote activity, inventory pressure, and protection activating.
- Short numerical bursts and a clear total.
- Units reacting when their capability contributes.

Reserve detailed explanations for hover/focus, an optional inspector, and the post-day recap. A short label such as “HEDGED” or “TECH ↑” is different from a live paragraph describing adverse selection.

The earlier assistant repeatedly proposed detailed live text, dashboards, and explanatory panels. The user's later correction was to make the fight less text-heavy; future work should follow that correction.

### Balatro-style satisfaction

Aggregate many executions into legible cascades. Use rhythm, rising tones, number scale, brief pauses, and meaningful unit activation to make a profitable combination feel powerful. A hedge offsetting a loss can be satisfying too.

Do not display fictitious rewards that the accounting never earned. Distinguish execution edge, realized profit, unrealized inventory gains, and total net results. A rising score can coexist with increasing exposure.

### Art direction

Directions discussed included a retro financial arcade, stylized pixel desks and CRTs, illustrated cards, bold silhouettes, restrained palettes, and custom financial symbols. The present olive/charcoal/lime interface is a first visual experiment, not a user-approved final style.

The main preference is visual cohesion and character without generic AI-generated trading art. Reusable desk assets, simple custom icons, typography, animation, and sound can carry the first version. Elaborate 3D characters are not a requirement.

## 13. Technology discussion and what actually happened

The user asked whether C++ was needed for speed and how to handle graphics. An earlier assistant recommended Godot for 2D/UI, GDScript for presentation/game flow, and an independent C++20 simulation integrated later. Unity/C#, LÖVE/Lua, C++ with lightweight libraries, and browser/TypeScript were also discussed as alternatives.

Those were recommendations, not a final engine decision. No benchmark established a need for C++.

When asked to start building, the empty repository was used to create a dependency-free JavaScript browser prototype with a Node static server. Its simulation and presentation are separate modules so the combat can be evaluated before choosing a production stack.

Future online competition should use an authoritative server: clients submit permitted commands; the server controls matching, accounting, information access, settlement, and outcomes. Replayable seeds and event logs were proposed for debugging and explanations. The current client is not secure multiplayer infrastructure.

## 14. Design questions still open

| Question | Why it matters |
| --- | --- |
| Exact unit / item / strategy split | Determines drafting, equipment, and readable identities |
| Trait thresholds and stacking | Creates composition incentives and balance constraints |
| Manual intervention rules | Must reward timing without making constant input mandatory |
| Target audience and input devices | Affects terminal complexity and reaction requirements |
| Number of markets | Trades strategic coverage against 40-second readability |
| Private versus public information | Controls scouting, deception, and fairness |
| Placement and capital allocation | Should be added only if they create meaningful decisions |
| Daily reset versus persistent positions | Changes hedging, weekend risk, and snowballing |
| Health, margin, and liquidation rules | Determines survival and comeback opportunities |
| Multi-player lobby structure | Pairwise duels versus a lobby-wide market have different balance implications |
| Shared unit pool and shop odds | Important to an eventual autobattler economy |
| Weekend selection order and scarcity | Determines contest and comeback mechanics |
| Era unlock schedule and randomness | Must teach while preserving build freedom |
| Production engine | Choose after measuring the playable prototype |

## 15. What to validate next

1. Can players watch a day and identify where they won or lost without reading a long explanation?
2. Do an autonomous composition and an actively operated composition both feel satisfying?
3. Do live controls change opportunities rather than merely add clicks?
4. Do units and equipment produce recognizable combinations and counterplay?
5. Can players understand the cost of risk and protection?
6. Does a losing player have an obvious, interesting change to try tomorrow?
7. Do people voluntarily play several matches rather than describe it only as educational?

First prioritize a compelling duel and clear feedback. Then add equipment, opening PvE, and the wider match economy. Full online lobbies and extensive content should follow evidence from playtests.

## 16. Source and confidence notes

The source is the conversation pasted by the user, the later user corrections, and the checked-in prototype source. The shared link supplied was:

https://chatgpt.com/share/6ad990cd-dd64-83ea-b68f-1fa1b3a8d00c

Fetching that link failed. This document does not claim to include additional material available only behind that link. Earlier pasted messages contained links and references to outside products; those have not been treated as verified research or competitive analysis.

Enthusiastic assessments in the conversation were brainstorming, not validation of commercial demand, balance, originality, or technical performance. Exact numbers in examples were illustrative unless explicitly listed as current prototype rules in [PROTOTYPE.md](PROTOTYPE.md).
