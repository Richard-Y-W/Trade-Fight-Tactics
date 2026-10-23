# Fast beta: daily ramp, AI behavior, stars, and feedback

October 22, 2026. Current refinement of [economy and rivalry](ECONOMY-AND-RIVALRY.md). This supersedes earlier weekly deployment limits, four-market descriptions, star-grade constants, bot-control rules, and audit figures.

## User decisions to preserve

Keep the first playable beta short and progressively more interesting. Add capacity and market complexity within the first trading week. A longer production match, with slower pacing across multiple weeks/eras, remains a future goal. Paid leveling remains a saved concept, not an implemented resource sink. Items are the next design milestone after the combat loop is verified; do not implement them yet. Trade Fight Tactics remains an internal working name.

## Daily progression

| Day | Floor capacity | Open markets | Session |
| --- | ---: | --- | --- |
| Monday | 3 | Technology, Energy, Commodities | Calm recovery |
| Tuesday | 4 | Same three | Calm recovery |
| Wednesday | 5 | Add Rates | Directional |
| Thursday | 6 | Add Currencies | Calm, wider market coverage |
| Friday | 7 | All five | Unstable stress session |

Currency ticker FX is a fictional $80 proxy, idiosyncratic half-width 0.10, common beta -0.20, customer budget width 0.26, and three requests per tick. It is not a real exchange-rate or multicurrency balance-sheet model.

Shop odds now advance through the existing five authored tier-weight rows by **day**, so higher careers can appear during the short beta. The finite shared supply, bench, merging and interest rules remain. Locked offers stay locked across a day change. Only newly drawn offers use the new odds.

Unopened markets are absent from the map and cannot receive quotes, customer orders, fills, or manual activation. Their reference processes may still be generated internally for reproducibility. Newly unlocked markets default to enabled; pausing a different market does not accidentally keep future unlocks paused.

Health damage is capped at 18 per day so a company starting at 100 can experience the complete first-week ramp. Existing weekend options and continuation remain available; later weeks retain seven slots, five markets and the final shop-odds row. This is an optional continuation, not the finished longer-match progression design.

## Why the bot concern needed its own audit

The previous fixed-roster market audit was not an audit of the companies the lobby actually bought. Background simulations also automated Press only for the right firm, while the left bot received no active input. Draft selection could overvalue role coverage or support units without enough trading capacity.

Changes:

- Both firms in every background pairing now receive explicit AI control. The human side of the main fight remains player-controlled.
- Bots use Press when the visible book offers an apparent edge, rather than whenever the cooldown ends.
- Floor selection prioritizes enough trading units, useful research/protection, trait thresholds and stars, while penalizing duplicate identities and excessive protection stacking. All purchases still use actual credits and the shared bag.
- In a directional session, capable AI desks use observed four-tick price history to target a modest signed inventory. They temporarily withhold offers that would build exposure against the observed direction until the target is met. No future prices are read. Human Systematic compositions receive the same rule-driven directional inventory behavior; their manual controls remain available.
- Protection executes at the assigned protector's own grade, so upgrading a weaker protector can improve its costs even beside a stronger one.

The AI is a heuristic, not an optimized institutional strategy. Reversals, stale observations and inventory exposure can still lose money. The market remains an authored exogenous reference process with finite order-book execution.

## Evidence from actual bot companies

Run `npm run audit:bots`. [Baseline](audits/bots-before-daily-ramp.json) and [current](audits/bots-daily-ramp.json) each use 50 seeds, seven actual shared-pool bot companies, five days, and each company versus its next neighbor: 1,750 duels / 3,500 firm results per report. No elimination occurs during this diagnostic, so each company reaches every day. These are repeated matched scenarios, not independent observations of real markets.

| Day | Current profitable bot results | Current mean P&L |
| --- | ---: | ---: |
| Monday | 95.7% | +$22.50 |
| Tuesday | 87.6% | +$18.91 |
| Wednesday | 96.9% | +$72.19 |
| Thursday | 89.1% | +$31.74 |
| Friday | 45.0% | -$21.28 |

The old diagnostic already showed positive calm-session performance, but only 47.9% profitable on its directional day and 34.9% on its unstable day. The baseline held three deployed units and four markets throughout. The current report changes market counts, shop/floor progression, stars, drafting and control policy together; it is not a clean causal experiment isolating the AI change. The higher Wednesday score also highlights how favorable the authored trend regime can be for a history-following policy. Do not claim all compositions are balanced or all AI firms always profit. Friday remains deliberately risky and needs further playtesting.

The separate 12,800-day [fixed-build diagnostic](audits/market-audit.json) was also rerun with five markets. It keeps three-slot rosters, mixes human-style and AI policies across mirrored seats, and does not model daily recruitment. Its limits are stated in its method field; use the actual-bot report for claims about lobby behavior.

## Modest star improvements

Grade is centralized in `unitGrade`: `1 + 0.12 × (careerCost - 1) + 0.25 × (stars - 1)`. At a fixed career, stars add 0 / 0.25 / 0.50 rather than the older 0.45 increments.

- Market makers: larger own offers; improved maker execution costs when supplying that firm capability.
- Active traders: larger own orders and improved intervention parameters.
- Research: each unit contributes more estimation power under the diminishing-returns formula.
- Protectors: cheaper slippage for the markets assigned to that actual protector.
- Anchors: larger own ladders and improved shared capacity when supplying the sizing capability.
- Execution: larger own offers and earlier within-tick submission.

Grade improves capabilities, not guaranteed profit. Taking more size also increases possible losses. Styles still count distinct deployed identities, not stars. Hover explanations and Read Unit technical detail explain star effects.

## Feedback research and implementation

[Pichlmair and Johansen's game-feel survey](https://arxiv.org/abs/2011.09201) distinguishes physicality, amplification and support; it relates amplification to communicating event importance. [Lin et al.'s impact-feedback study](https://arxiv.org/abs/2208.06155) examines action games and suggests sound coherence, hit stop and camera control matter there. These findings motivate our design choices; they are not proof of dopamine effects or evidence that a trading game needs camera shake. The GDC Vault page for *Juice It or Lose It* redirected to maintenance in this session, so no claim is made to have watched that talk.

Our application:

- Two ranked marked-P&L bursts per tick, with larger changes receiving modestly larger type, quick expansion, easing and a short fade. They display actual changes in asset P&L before firm-wide costs, explicitly marked as such. They can include unrealized gains/losses.
- The headline score remains the exact current net equity score; presentation does not delay settlement or alter accounting.
- FLOW streak badges count recent ticks winning real contested customer orders. They never multiply money, change fees or modify probability.
- Optional sound rises modestly with a real flow streak, and the positive cue requires a net equity increase after costs. Sound remains off by default.
- One short rivalry cue per tick connects the actual winning deployed unit to the outplayed rival. The winning card highlights; the losing card reacts. Only genuine contest events cause this effect. It is a visual representation of execution competition, not direct health damage.
- Large screen shake and simulation hit-stop are omitted to preserve market readability and timing. Reduced-motion preferences suppress travel/clash/burst effects.
- A unit without capacity reports WAITING FOR RISK ROOM instead of pretending to submit quotes.

## Validation and remaining work

49 automated tests and syntax checks pass. New checks cover the full daily schedule and UI journey, unopened-market invariants, both-sided AI and opportunity gating, bot floor selection, all capability grades, individual protector efficiency, and presentation events that leave simulation state unchanged. Existing supply, accounting, risk, interest, queue and hover checks remain.

The [representative benchmark](audits/performance-daily-ramp.json) measures four simultaneous seven-unit-per-side, five-market duels: 7,200 warmed four-duel ticks, mean 1.084ms, 95th percentile 1.725ms and 99th percentile 2.089ms against a 500ms simulation tick. Run `npm run benchmark:market`. This is machine-specific simulation time, excluding the browser, DOM effects, rendering and sound; it is not an FPS result.

Browser visual verification remains unavailable in this session. Real-browser animation timing, responsive readability and crowded late-day floors still need playtesting. Next: assess the beta loop and balance, then design the item system. Longer production matches, era progression and paid floor leveling remain documented future work.
