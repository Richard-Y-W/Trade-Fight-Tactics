# Visual learning and financially honest unit feedback

October 22, 2026. This records the user's teaching and readability direction, including the longer discussion they supplied. It extends the [game vision](GAME-VISION.md) and [trait design](TRAIT-RESEARCH.md).

## Core requirement

Players should be able to infer a unit's job by watching it, understand a short description without finance knowledge, and optionally inspect the underlying mechanics. A knowledgeable player should recognize why the depicted action makes sense.

The game should preserve useful financial relationships without requiring a newcomer to learn a finance course before their first match. Animation is part of the explanation, not merely decoration.

## Three levels of understanding

| Level | What it communicates | Where it belongs |
| --- | --- | --- |
| Visual | The unit posts offers, scans, reprices, increases size, or reduces exposure | Unit animation and a matching cue on the affected market |
| Plain English | What the capability does, how it is operated, and its main tradeoff | Short card text, role tags, and Read Unit |
| Technical | Quote rules, limits, costs, timing, and what the model actually represents | Expandable detail, Build guide, and recap |

Players can use intuition first, then learn terminology. Reading remains available and useful without becoming a prerequisite for every live decision.

## Corrections to misleading shorthand in the supplied discussion

Preserve the teaching philosophy without adopting financial guarantees:

- A market maker does not inherently make safe or steady money. Posting both sides can earn spread but can also lose through stale quotes and inventory.
- Many small trades do not automatically mean low risk. Repetition can compound a bad price or position.
- A research unit can improve an estimate without predicting the next move correctly. The current prototype estimates a reference mark; it does not forecast hidden future value.
- A hedge executes an offsetting trade and pays costs. It does not retroactively erase a bad fill, block a rival's legitimate trade, or cancel firm-health damage.
- An option does not automatically profit whenever volatility increases. Strike, premium, expiry, position size, and valuation matter. The current options settle at expiry and have no intraday valuation.
- Hedge Fund remains a broad organizational label, not a protection capability.

Use recognizable roles and bounded claims rather than labels such as “safe money” or guaranteed profit tags.

## Current unit template

Every recruit now has:

1. Career tier, cost, style, specialty, and merged star level.
2. A simple capability description.
3. Two concise role tags, such as Automatic / Quotes or Capacity / Exposure.
4. A “Watch for” description of its visual action.
5. A plain-English tradeoff.
6. Expandable technical detail, using current desk settings when deployed or an explicitly labeled unit-alone preview otherwise.
7. A disclosure that shared capability feedback is not independently attributable unit profit.

Read Unit is available from the shop, trading floor, and bench. Opening detail during local play pauses the duel, following the existing help behavior. This is a prototype convenience, not a planned competitive multiplayer pause rule.

## Role animation vocabulary

| Family | Simple explanation | Current visual cue | Actual engine trigger |
| --- | --- | --- | --- |
| Market maker | Posts buy and sell offers | BUY / SELL tickets, followed by a fill pulse | Quotes refresh; a customer order fills those quotes |
| Research | Helps price the offers | Scan line and a target that settles | A noisy current-mark estimate is computed for a quote |
| Execution / HFT | Reprices quickly and competes for execution | Fast routing lights and repricing pulse | The execution capability refreshes quotes |
| Hedging | Trades away excess exposure at a cost | Shield pulse and shrinking exposure bar; amount reduced and cost shown | A hedge actually reduces inventory |
| Capacity | Supports larger offers and inventory limits | Order-ticket stacks expand; offer size shown | The desk publishes quotes using the capacity capability |
| Active pressure | Tightens offers when the player chooses | Lever movement and pressure light | Press is activated, followed by actual quote/fill activity |

Trait actions are separately identifiable. For example, Asset Management rebalancing can pulse its trait rather than claiming that an unrelated individual earned money. A short echo of the relevant role icon appears on a market tile associated with the action.

These are reusable CSS/SVG role scenes, not final character sprites or a complete art direction. They remain still unless corresponding activity occurs. Bench units do not perform live actions. Reduced-motion mode uses static highlights and text rather than moving effects.

## Event-driven feedback and attribution

The previous periodic unit flash was removed. New event metadata records:

- Which deployed unit supplies the strongest instance of a capability.
- Actual quote refresh, estimate update, capacity use, Press activation, and customer fills.
- Actual inventory before/after a hedge and its slippage-plus-fee cost.
- Whether an effect belongs to a trait rather than an individual.

The event-to-view adapter groups busy activity into compact cues and prioritizes important actions. For example, a hedge takes visual priority over a routine quote update. Aggregation does not mutate the ledger or add financial rewards.

An empty emergency hedge emits no protection cue. The UI no longer announces HEDGED across all three assets merely because the button was pressed. Rejected, unavailable, or inactive capabilities do not receive invented action effects.

## Important implementation limits

The engine still combines units into one firm configuration. Its strongest unit supplies each individual capability; other deployed identities can contribute traits. It does not yet run a separate strategy and order ledger for each trader.

Consequently:

- Unit cues identify a capability contributor, not an exclusive cause of profit.
- The current feedback pass does not comprehensively visualize every direct crossed-quote trade or every supporting contribution.
- Research and risk can help the same fill without an exact causal division of its P&L.
- We do not display invented per-unit profit or “loss prevented” totals.
- Hedge bar motion shows the reduction relative to that action's starting exposure, not portfolio volatility or a complete current-risk measure.
- The firm's net score remains authoritative. Floating execution amounts are edge against the current mark, while inventory valuation and costs can change the net result.

True unit-level economics require per-strategy order ownership, position allocation, shared-cost allocation, and a policy for jointly caused returns. Build that deliberately if individual carries become central to the game.

## Progression and future visuals

Introduce visual concepts gradually: offers and fills first, inventory and repricing next, then protection and directional choices. More advanced pair trades, covariance effects, and option payoff shapes should arrive when the simulation can support them.

Do not add an arbitrage siphon without related instruments and a modeled dislocation. Do not show an option “burst” as an arbitrary combat reward. A future loss-offset animation must show actual portfolio valuation or trade cash flows, including costs.

Keep the short trading day and small terminal. New visuals should help players follow decisions rather than add panels, incessant flashing, or long live explanations.

## Validation

Automated checks cover profile coverage, contributor provenance, actual hedge quantities and costs, no-op hedge behavior, feedback aggregation without ledger mutation, and refusing to animate a benched unit. Existing company, trait, accounting, and week/weekend UI checks remain in place.

These tests do not prove teaching effectiveness. Real-browser rendering, animation pacing, audio, responsiveness, and accessibility still need visual checks. A future playtest should ask a beginner and a knowledgeable player to watch a 15-second clip, describe what each unit did, and explain the main tradeoff. Neither audience has validated this iteration yet.
