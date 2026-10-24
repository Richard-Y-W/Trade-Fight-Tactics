# Continuous match loop and phase-aware presentation

Current iteration, 2026-10-23. Supersedes manual start/next-day progression from the regional-floor pass. The six-product financial model, map, roster, pool, traits, inventory accounting and daily capacity/unlocks are preserved.

## Starting audit

The browser already had prep, opening, live, close and weekend presentation states, 80 deterministic financial ticks per day, guarded engine settlement, real regional books, unit-owned accounting, a bench/shop and Pixi renderer. However, opening used its own timeout, live trading its own interval, and next-day progression waited for a click. The right/left rails and fixed center rows left drafting cramped. Phase/market selection caused Pixi scene reconstruction; the shop and bench were also rebuilt when merely entering combat.

The integration reuses these systems. No financial-engine rewrite, roster expansion, framework migration or new rendering-only financial state was introduced.

## One authoritative lifecycle

`src/lifecycle.js` owns legal transitions, elapsed active time, pause, round generation, phase durations, legal actions and the 80 trading callbacks. It has no DOM, rendering or accounting dependencies. `app.js` supplies entry callbacks and updates its existing UI phase alias exclusively from this controller.

```text
initializing -> prep -> opening -> live -> closing -> results -> advance
                        ^                                   /    |    \
                        |                                prep weekend complete
                        |                                      |
                        +-------------------- prep <--- explicit choice
```

Actual legal edges are defined in the module, not inferred from the diagram. There is no public arbitrary phase setter. Ready early only exits prep; Continue now only exits settled results. Neither can jump over settlement. A completed match waits for New match and never automatically restarts.

| Phase | Default duration | Entry work / available actions |
|---|---:|---|
| Initialization | Explicit setup | Wire existing components and prepare initial company |
| Preparation | 30,000ms | Recruit, reroll, lock, sell, deploy, scout; optional Ready early |
| Opponent reveal | 1,200ms | Lock operations, construct actual day once, expand board, reveal rival |
| Market open | 40,000ms | 80 financial steps; build-dependent operating commands |
| Market close | 750ms | Confirm engine settlement, apply main/background HP once, freeze financial state |
| Results freeze | 3,000ms | Keep both formations visible; inspect or Continue now |
| Round advance | 750ms | Fade rival; route to next prep, required weekend choice or completion |
| Weekend | Explicit choice | Call, put or Stay Liquid; no timeout default and no automatic skipping |
| Match complete | Explicit restart | Hold final board/result; New match starts a new generation |

Durations live in `DURATIONS` and can be overridden through `createLifecycle({durations})`. Combat accepts 30–45s and always processes all 80 financial steps. Non-default combat length changes presentation compression, not the financial engine's 500ms modeled tick convention. Reduced motion removes opening/closing/advance delays; it never removes trading ticks or the three-second results hold.

The browser uses one 250ms scheduler and feeds monotonic `performance.now()` deltas to the lifecycle. It catches up elapsed time independently of animation frames. Manual ready/skip/pause flush elapsed time before acting. Pausing discards paused elapsed time. Reset invalidates the old generation without installing a second interval. A browser stall may batch financial steps; presentation prioritizes/aggregates their real events. Background tabs are not separately auto-paused: use Pause when leaving this local match.

## Settlement, freeze and economy

The existing engine still owns tick-80 option settlement, account marks and the final settlement event. Live callbacks stop at 80. On entering closing, the app's `resultCommitted` guard applies HP damage/background settlement exactly once and records the closing report. Results and advance never step the simulator, place orders, change positions or update final P&L. Rival sprites remain visible throughout closing/results and fade only during advance.

Only entering the next preparation from advance awards weekday income, prepares bots, refreshes offers according to lock rules and applies unlocks. A weekend waits for a required choice; entering preparation from that choice awards the next week's ordinary income once and carries the selected premium ticket to the next opening. Reset creates a fresh company. Buy/deploy/sell/reroll/lock are phase-gated and their buttons are disabled outside prep. Operating commands are live-only.

An empty floor does **not** block the timer or receive free units: it enters the day with no trading orders. The player can lose or win relative to the rival's actual P&L; zero activity does not manufacture profit. Dialog inspection pauses prep/live/results and resumes on closing the last dialog only when inspection initiated the pause. A manually paused match remains paused.

## Layout and readability

`src/phases.css` provides an incremental responsive layer over the existing shell. At desktop widths, sidebars use `clamp(210px,16vw,310px)`, leaving the center dominant. Prep gives more height to a 90–110px staging bench and approximately 184–236px five-card shop. Combat reduces them to roughly 78–92px and 80–102px; the square floor takes the released space. The HUD is approximately 48–60px.

The center has four rows: HUD, floor, bench, shop. The floor is a size container; board width and height are both `min(100cqw,100cqh)`. Surplus horizontal space contains compact market/overlay controls and actual formation/order-stream information, rather than a padded empty board panel. Bench and board share border/background materials. The full-width bench deliberately retains readable names instead of forcing eight tiny slots into the square's narrower width.

Prep cards show 14–16px titles, 17–19px costs, CC0 character sprites with role symbols, traits and a short plain-English line. Bench names remain 12px with visible stars and native sell/deploy controls. During combat, the shop becomes locked title/price cards. Expand temporarily restores details by taking space from the board, without overlaying controls or scrolling the document. It preserves offer identities and defaults back to full shop at the next prep. Smaller than 1100px uses an intentional stacked scrolling layout.

Grid-track resizing takes 350ms; reduced motion disables it. The same canvas stays mounted. Pixi updates existing unit containers and only creates/removes units whose identity actually changes; phase changes do not reconstruct the player's formation. The map redraws on genuine geometry/unlock changes, not on selection. The HTML grid restores focused tile coordinates across ownership updates. Phase-only shop/bench updates change availability and CSS, retaining existing elements. Actual recruitment, merges or progression may legitimately update roster elements.

## Combat and results presentation

Existing actual quote/fill/signal/support/hedge/contest events still drive role-specific effects. Persistent unit badges now show concise marked net or short support counters; larger panels provide full names and fill counts. No visual profit multiplier exists. Closing report facts show actual top order-stream net, largest open gross exposure, largest regional P&L gap and a recorded protection action when one exists. These are observations, not invented counterfactual support profits.

Financial events and replay records include a round ID. The browser includes match generation, week and day, so even same-seed resets receive a distinct presentation identity. The renderer resets event cursors, pooled labels and packets on round changes; no stale events animate into the next day. A small prep cue names the new day and actual newly opened regions. Final score animation is brief; both firms' settled values remain unchanged during review.

## Files and verification

- `src/lifecycle.js`: pure phase controller and configuration.
- `src/app.js`: lifecycle integration, guarded settlement/economy callbacks, persistent drafting components, readable summaries and contextual floor information.
- `src/phases.css`, `index.html`: phase-aware desktop/mobile layout and presentation.
- `src/floor-pixi.js`: incremental sprite scene, scoped pooled effects, reveal/hold/fade.
- `src/board-ui.js`: keyboard focus continuity during ownership changes.
- `src/engine.js`, `src/combat-events.js`: additive round identity metadata; trading mathematics preserved.
- `src/floor-bridge.js`: phase/round/render identity metrics in the existing debug view.
- `tests/lifecycle.test.js`: timing, legality, pause/reset, complete/weekend, real-engine freeze/HP/income and configurable full-length combat.
- Existing UI/browser tests adapted to the new authoritative boundaries; `e2e/loop.spec.js` measures and screenshots prep/combat/results/next-prep at all three desktop targets, verifies retained elements and renderer identities, and tests optional shop expansion.

Run `npm test`, syntax checks, `npm run build:renderer`, and `npm run test:e2e`. Screenshots: `docs/media/loop-{1920,1440,1366}-{prep,combat,results,next-prep}.png`. Geometry/font/renderer observations: `docs/audits/phase-layout-{width}.json`. `browser-battle.webm` records an actual real-time day through automatic next preparation, not an accelerated mockup. Final results and inspected dimensions are recorded in implementation-results.

## Honest limitations

This remains a local bot exhibition with a fixed primary rival. The existing Friday stress balance, missing margin/financing/borrow, simplified product models and no network authority are unchanged. Human beginner comprehension/fun has not been measured. Small screens intentionally scroll; standard desktop viewports do not. The clock is in-memory and does not persist a match across reloads. Browser frame-time measurements include recording overhead and are not a universal 60 FPS guarantee.
