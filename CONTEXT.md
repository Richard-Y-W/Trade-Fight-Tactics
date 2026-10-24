# Latest implementation: automatic match loop

2026-10-23: newest iteration adds an authoritative lifecycle (30s prep -> reveal -> 40s trade -> close -> 3s settled results -> automatic advance). Weekend choice waits; completion waits for restart. Preparation/combat use different layout sizing with stable canvas, sprites and drafting components. Both firms stay on the floor during results. See docs/continuous-game-loop.md and the newest section of docs/implementation-results.md. The six-product regional model and previous financial limitations are preserved. Prior notes follow.

---

# Latest direction: shared regional floor

2026-10-23: newest user specification supersedes prior no-sector / mirrored-half rules. Current implementation uses one shared 8 x 8 irregular financial product map, progressive Equities/Options/Rates+FX/Commodities/Credit unlocks, real contract/pricing differences, market-assigned units and three-column viewport UX. Internal name remains Trade Fight Tactics; public name changes later. Paid leveling and longer matches remain future concepts. See docs/regional-market-architecture.md and docs/implementation-results.md for source-of-truth mechanics and honest limitations. Historical context below is preserved.

---

# Trade Fight Tactics — start here

## Current handoff: watchability and repository showcase

**Latest battlefield pass supersedes the older “no spatial bonuses” decisions below.** Persistent configurable 8×8 deployment (9×8 option), pointer drag/click swaps and bench returns, mirrored halves, local support/routing, scouting snapshots, short opening transition, shared selected exchange, real board overlays and optional right-side analytics are integrated. No sector territories or role quotas. Total fast-beta capacity remains 3/4/5/6/7; markets 3/3/4/5/5. Research, execution, risk and manager support now have finite range/capacity; delayed intents snapshot their decision inputs and arrive on the actual timeline. Support-only compositions are allowed without a phantom house trader. Current rules: [positioning-mechanics.md](docs/positioning-mechanics.md); current validation/limitations: [implementation-results.md](docs/implementation-results.md). New suite has 69 Node tests and four browser tests. Friday/position balance remains problematic; beginner testing is still unperformed. Items and paid leveling remain deferred.

**2026-10-23 combat pass supersedes the older model notes below.** Preserve the Node/browser architecture, recruitment and 40-second loop. New modules: versioned replay events, public/hidden observation separation, representative strategy policies, per-unit accounting/diagnostics and a PixiJS v8 combat floor. Existing identities now include momentum, reversion, relative-value quotes, inventory guarding and an expiry-only straddle. No items, adjacency bonuses, paid leveling or multiplayer added. CC0 Kenney characters plus procedural workstations; bundled dependency notices retained. See [current financial model](docs/financial-model.md), [behavior matrix](docs/unit-behavior-matrix.md), [implementation results](docs/implementation-results.md) and [asset provenance](docs/assets-and-licenses.md). Automated suite now has 60 Node tests; Playwright checks real Edge/WebGL. Human beginner comprehension is still an unpassed release gate. Read current results rather than interpreting historical audits as current balance.

The user authorized committing and pushing the complete prototype to the existing GitHub repository, with an engaging README and battle videos. The README now links reproducible Monday and Friday **offline engine replay videos**, explicitly distinguished from application screen recordings. See `docs/media/manifest.json` for configurations, scores and event-trace digests. Regenerate with `npm run showcase`. Native capture approval timed out and no browser surface was available; real-browser UI QA remains outstanding.

Current priority is **watchability and interpretability before the item system**: make it easy to identify which units work together, which are struggling and why. `src/battle-readout.js` adds Follow the edge: select either firm's deployed units, inspect actual order-stream results and holdings, and highlight active shared-trait partners. Both firms' net results are decomposed into trades/costs, holding-price moves and option/other. Shared research and protection explain their actual support mechanics without fake profit attribution. The three most recent sampled contest/trim/limit moments remain expandable.

The current assessment and exact explanation math are in [Watchability and simulation](docs/WATCHABILITY-AND-SIMULATION.md). Matching and accounting support serious prototype playtesting, but prices/information remain game-authored and strategies are not balanced or calibrated. 32 identities share six behavior families. Do not describe this as an exchange-grade or very realistic simulator. The existing four-duel benchmark averages 1.084ms, excluding rendering. The actual-bot audit contains 1,750 duels; Friday has 45% positive firm results. Current automated suite: 52 tests. Current canonical pacing is 3/4/5/6/7 daily floor slots and 3/3/4/5/5 markets.

The older implementation paragraphs below are historical snapshots. Prefer this handoff, the README and the current pacing/order-book/watchability documents when values conflict. Keep the internal working name for now; change it before public launch.

This is the short context handoff for the project. Updated October 22, 2026. Full discussion: [game vision](docs/GAME-VISION.md). Current implementation: [prototype 0.2](docs/PROTOTYPE-V0.2.md). Run instructions: [README](README.md).

Latest roster refinement: [career tiers, trait research, and current build design](docs/TRAIT-RESEARCH.md).

Latest presentation refinement: [visual learning and unit feedback](docs/VISUAL-LEARNING.md).

Latest implementation: [order-book combat and readable roles](docs/ORDERBOOK-AND-COMBAT.md). This supersedes the single-policy market described in [the earlier math walkthrough](docs/MARKET-MATH.md). The earlier document retains reference-price and accounting formulas.

## Latest user decisions — preserve these

- Keep the first prototype fast-paced; do not build a full-length production game yet.
- Current priority: compact, appealing layout and mechanics polish. The user now explicitly wants tiny truthful unit-to-market animations on both sides to teach roles. Earlier deferral of animation work is superseded by this request. Keep the lobby clear of cards, the opposing floor/bench above combat, and the player's floor close to the market.
- Add an accessible full unit/trait catalog, richer descriptions, and more styles/specialties. Translate carry/tank/support jobs into execution, inventory capacity, protection, and information rather than generic profit or damage buffs.
- Add a genuinely shared limited unit supply and cumulative style/specialty thresholds, inspired by TFT's drafting structure. All local companies must consume the same supply. Exact bag sizes and bonuses are provisional tuning.
- Aim for coherent, eventually realistic market interactions; explain the implemented math honestly. Accounting tests alone do not establish market realism or balanced compositions.
- **Current fast-beta pacing:** capacity increases daily: Monday 3, Tuesday 4, Wednesday 5, Thursday 6, Friday 7. Markets open 3/3/4/5/5. This supersedes the older weekly 3/4/5 tuning. Shop tier odds advance daily too.
- **Future goal to remember:** scale into longer full matches with more gradual progression across weeks/eras once the short beta is proven. Items are next after the current loop is verified; do not add them yet.
- **Future concept to remember:** spend resources to level up the company and unlock additional desk/floor space to field more traders. Save this idea; do not implement paid leveling now.
- **Naming:** Trade Fight Tactics is an internal working name for code and documentation. Change the public name before publishing or bringing in outside players.
- The end-of-day winner should appear in the center arena with simple result effects, not a blocking full-screen modal.
- The right rail should show the lobby and other matches, with eventual inspection/spectating. Keep labels honest about local bots versus connected players.
- Add readable typography, rerolls, a company bench, distinct deployment limits, merging, unit rarity, week-dependent shop odds, and trait thresholds. Only deployed units execute.
- Career/cost labels: **1 Entry, 2 Mid, 3 Lead, 4 PM (Portfolio Manager), 5 Firm Owner (provisional)**. Stars from merging remain independent of career tier. The five-cost title is not finalized.
- Give units overlapping major/supporting identities so specialist and hybrid builds emerge. The current experiment uses **styles** (HFT, Systematic, Macro, Liquidity, Asset Management) and **specialties** (Trading, Research, Engineering, Risk). Styles activate at 2/4; specialties at 2/3.
- Finance research should inform behaviors, including non-quant institutions such as asset managers. Do not treat a hedge fund as automatically low-risk or all quantitative investing as HFT. Exact trait families/bonuses are prototype design choices, not user-finalized industry categories.
- **Teaching/readability:** a newcomer should infer a unit's job from animation and plain English; optional detail should remain coherent to someone who knows finance. Use three layers: visible action → simple explanation → technical mechanics. Animations must follow actual simulation events. Avoid “safe money” claims, fake protection, and invented per-unit profit.

## The user's vision

A TFT-inspired competitive game where a trading desk fights through a shared market. Recruit units and combine strategies, technology, and protection. The composition determines how the desk trades, which risks it can support, how autonomous it is, and which buttons appear in a compact terminal.

Some builds should run mostly automatically; others give the player meaningful active decisions. Hybrid builds should work. The player should feel they operate the desk without manually entering every order or managing a huge financial dashboard.

Two firms watch the same market heatmap. Your side is green; the rival is blue. You can dominate one stock/sector while losing another. Prices, quotes, information, execution, inventory, and hedges create the interactions. Actions should visibly redirect or deny opportunities, change exposure, or offset losses.

Trading battles last 30–45 seconds and are called days. Weekends end a stage/week and offer a short special event, scarce recruit/technology acquisition, options carousel, or PvE challenge. Opening PvE is brief: everyone starts after a market crash and develops a build as liquidity returns. Later stages introduce electronic trading, advanced quant tools, and AI themes.

The game should be fun first while rewarding quantitative understanding. Risk/reward and synergies should arise from actual mechanics, including eventual portfolio and derivatives interactions.

## Presentation priorities

- The Finviz-style heatmap supplied by the user is the battlefield reference.
- Little live text: movement, colors, signed numbers, units reacting, protection, and order-flow effects explain the fight.
- Green and blue identify firms; they do not mean rising/falling prices.
- Balatro-style number feedback, rhythm, combos, and sound should make operating and watching the desk satisfying.
- Use a coherent art direction and custom assets; avoid a collage of generic AI trading illustrations.
- Put mathematical explanations in optional detail and recaps.

## Important boundaries

- Firm = overall organization. Desk = active board/composition. Units = its recruited capabilities. Earlier discussion used “desk” inconsistently; preserve the user's board-as-desk intent.
- More small trades do not automatically mean less risk.
- Manual play must create opportunities for decisions rather than free extra profit from clicks.
- Automation should be a viable playstyle.
- A hedge offsets exposure at a cost; it does not magically cancel an opponent's trade.
- Do not confuse execution edge, realized profit, unrealized gains, market share, and net score.
- Earlier assistant suggestions about engine, exact content counts, intervention limits, and match length are not confirmed requirements.

## Current state

**Current reference:** [fast beta pacing, AI, stars and feedback](docs/FAST-BETA-PACING.md). Daily floor/market unlocks, five markets including Currencies, actual shared-pool bot auditing, both-sided background AI, better floor selection, opportunity-gated Press and observed-history inventory targets are implemented. Stars add +0.25 grade per level and improve their actual role. Marked-P&L bursts, optional sound, visual flow streaks and actual unit-to-rival clash cues leave the ledger unchanged. 49 tests pass. Actual bot audit: roughly 88-97% profitable results Monday-Thursday across the tested seeds; Friday stress session 45%. Longer production matches and items remain future work. This supersedes older weekly limits, four-market counts and earlier audit figures below.

**Latest refinement:** [economy, rivalry, hover help, and profit tuning](docs/ECONOMY-AND-RIVALRY.md). The user wants units visibly besting rivals at real opportunities, a wider lobby, intuitive hover explanations for units/traits/styles/specialties, savings interest, and fewer loss-only duels. Implemented customer-flow contests by price/FIFO; custom hover cards; a 290px desktop lobby; +1 interest per 10 closing credits, capped at +5, plus +4 base income. Trading units and outside liquidity now quote passively, inventory skew is bounded, baseline noise is reduced, and automatic trims use a six-unit buffer. The new diagnostic finds 60.9% profitable firm results in the mixed sample, with much greater risk in unstable sessions. 43 tests pass. These changes supersede earlier balance figures below. Paid leveling remains deferred.

**Latest update:** 32 units, seven styles (added Value/Agency), six specialties (added Execution/Allocation), searchable Field guide tabs, compact 1,560px app, player floor directly below the market, per-unit marked order-stream P&L/activity, and actual green/blue action travel. The simulator now uses persistent multi-level price/FIFO books, partial fills, cancellation, IOC orders, outside depth, and per-unit order/position attribution. Research combines quality with diminishing returns; protectors trim actual positions. Firm-wide constraints/support remain. 39 tests and syntax checks pass. Four-duel simulation ticks average 0.287ms on this machine, excluding rendering. The rerun audit remains unbalanced. Prices remain exogenous; no calibrated realism or market-impact claim. The paragraphs below retain the previous implementation context where not superseded by this update.

A local JavaScript browser prototype exists. Run `npm run dev`, then open http://127.0.0.1:5173. No installation is needed beyond Node.js 22+.

It now has four fictional markets (Technology, Energy, Commodities, and a negatively exposed fictional Rates proxy), 20 recruitable identities in five career/rarity tiers, five rotating offers, reroll/lock controls, an eight-slot bench, 3/4/5 weekly floor slots, and three-copy star merging. All eight companies share finite bags of 24/20/16/12/9 copies per identity by cost. Displayed offers reserve copies; sells and elimination return underlying copies. Bots purchase, merge, and hold a real bench through the same system. Every unit has one of five styles and one of four specialties. Bonuses change quote refresh/priority, noise, trade pressure, sizing, inventory skew, trend response, directional controls, or periodic rebalancing. The active/next-threshold panel explains benefits and costs. The terminal sits below the market; inline results replace the modal. The rival's actual floor and bench appear above the fight. A separate right grid track contains the local eight-firm exhibition, background simulations, and inspection. Live spectating and rotating human matchmaking are not implemented.

Trading days remain 40 seconds. Accounting, inventory limits, health damage, five-day weeks, and call/put/skip weekends remain. Recruitment starts at 10 credits and grants 4 each new day. Twenty identities share six capability families; they are not twenty separate sophisticated trading models.

Units now have simple descriptions, role tags, tradeoffs, Read Unit detail with an expandable technical section, and six reusable role scenes. Actual quote/estimate/fill/hedge/capacity/Press events drive their cues. Bench units do not animate live, and an empty hedge shows no fake protection. This is an initial CSS/SVG animation pass, not final character art. Capability-source metadata does not provide independently attributable unit P&L.

Calm/directional/unstable regimes alter authored prices and customer behavior. Customers have finite price budgets, stale quotes can be adversely selected, and crossed firm quotes transfer cash/inventory. New quotes can be paused per market without erasing inventory. Risk display distinguishes inventory pressure, approximate one-second model sigma, and gross exposure. No fitted market calibration, deep exchange book, independent unit trading policies, market impact, margin, or realistic option pricing exists yet. Units share a compiled firm policy.

It does not yet have online PvP, item crafting, spatial placement mechanics, opening PvE, persistent balance sheets, paid leveling, or era unlocks. 34 tests pass, including supply conservation, financial accounting, covariance, and a Happy DOM UI journey through a week and weekend. Syntax checks pass. A reproducible 12,800-day audit finds major imbalance (HFT ahead of several alternatives; protection-heavy roster too costly), not just random outcomes. Raw results and limitations are linked from the math document. Happy DOM is a development-only dependency (`npm ci` before tests). Real-browser rendering and responsive QA remain outstanding because no browser surface was available.

The math is financially motivated game logic, not a calibrated market simulator: inventory/equity, quote routing, costs, and option payoff are modeled; reference prices are synthetic, trading has no price impact, customers lack reservation prices, and covariance/margin/dynamic options are absent. Preserve this distinction in future descriptions.

Godot/GDScript with an optional C++ simulation was discussed, but no production engine is committed. The browser version was chosen to test the duel quickly. No benchmark showed C++ is needed.

## Next useful work

Playtest the full UI, improve visual cause and effect, compare autonomous and active builds on shared scenarios, then add equipment and a brief opening PvE. Make the duel worth repeating before building full online lobbies or a large content roster.

## Source limits

This record uses the pasted conversation and subsequent clarifications. The supplied ChatGPT share URL could not be fetched; no unseen content from it is claimed. Consult the full vision document for open questions and distinctions between user direction, suggestions, and temporary prototype choices.
