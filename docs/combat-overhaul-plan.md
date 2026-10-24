# Shared-market iteration assessment (2026-10-23)

Audited existing entry points, Pixi/HTML deployment, books/ledgers, roster, league, economy, events/replays, tests and prior plans before edits. Starting baseline: 69 Node tests and four browser tests, five proxy assets and mirrored halves. Preserved matching, deterministic streams, pool/economy and local support. Targeted changes implemented: viewport shell; structured regional map/unlocks; distinct priced instruments with tick/contract conventions; market-assigned jobs; shared ownership subslots and reveal; actual-event regional effects. [Current architecture and limitations](regional-market-architecture.md), [validation](regional-ux-and-validation.md).

The legacy five-proxy profile remains explicit for historical headless fixtures, not the browser. No automatic open-inventory migration. Prior assessment below is historical.

---

# Combat overhaul: implementation assessment

Baseline inspected 2026-10-23: README/context, current and historical design notes, all simulation/UI subsystems, recruitment and league modules, replay generator, audits and 52 automated tests. Baseline suite: 52/52. Four-duel headless benchmark: mean 0.986ms, p95 1.659ms, p99 1.941ms; excludes browser rendering.

## Preserve

Plain ES modules and Node test runner; persistent integer-cent FIFO books; partial fills, IOC, cancellation and self-trade prevention; cash and inventory ledger; shared unit pool, bench, merging and interest; 40-second days and daily market/slot ramp; field guide; truthful event effects; deterministic independent random streams; offline replays. No C++ rewrite, framework migration or paid leveling. No item system in this pass.

## Architecture and gaps

`engine.js` owns market evolution/accounting, `market-session.js` owns venue interaction, `roster.js` compiles shared capabilities/traits, `company.js` owns recruitment, `league.js` owns bot drafting and exhibition duels. `app.js` renders HTML; CSS/SVG cues and a presentation-only observer explain orders. Replays render seeded states offline with resvg/FFmpeg.

Matching/accounting are stronger than the information model. Both firms currently quote around the same exact valuation mark; research only scales noise, and AI exploits knowledge of the authored session. Public observations, hidden value and execution prices need separation. Most named units share six policies. Risk is a linear common-factor approximation, not margin or maximum loss. No market impact, calibrated stochastic model or financing exists.

Readability gaps: numerical unit cards dominate the floor, support links mostly require text, winning volume can look like winning money, inspection lacks realized/unrealized/cost decomposition, and closing results lack grounded diagnosis. Browser visual QA has not previously been available.

## Integrated implementation order

1. Version/timestamp events without breaking consumers, preserve stable sources and record a replay trace.
2. Add public observations and noisy private research; remove mark-aware AI decisions. Differentiate existing representative identities through distinct policies, not another roster expansion.
3. Add a PixiJS v8 combat canvas with CC0 characters, role-shaped workstations, five animation states, bounded real-event effects and a non-WebGL fallback.
4. Extend unit accounting/diagnostics and closing highlights, expose active trait partners and short actionable advice. Retain build-dependent controls and accessible HTML inspection.
5. Verify financial invariants, signal information boundaries, policy behavior, full browser journeys, responsive screenshots, reduced motion and missing-art fallback. Rerun controlled audits and headless benchmarks; regenerate engine replays.

Complete integrated behavior/render/analysis slices first. Defer sophisticated price impact, continuous option pricing, spatial bonuses, external human usability certification and full multiplayer. Record any additional incomplete work in implementation-results.md rather than shipping decorative stubs.
