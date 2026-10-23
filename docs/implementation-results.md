# Combat overhaul: implementation results

This is a playable integrated improvement, retaining the browser/Node architecture and existing recruitment, bench, pool, merges, interest, controls, 40-second days and weekend. It is not a completed implementation of every proposed production feature.

## Delivered

- Versioned replay events with unique IDs, simulation timestamps, command retention, stable source attribution, signed fill quantities/fees, researcher support and actual hedge beneficiaries.
- Separate hidden reference, public marks, delivered beliefs and execution prices. Research can be wrong or delayed; next-public-move assessment is a proxy. Bot decisions use delivered estimates/public history, not the hidden value or the scenario name.
- A featured set of existing identities with meaningful passive, fast execution, discretionary IOC, momentum, reversion, research, inventory-guard, paid-liquidation, two-market relative-value and expiry-straddle behaviors. No roster expansion.
- PixiJS v8 trading floor with verified CC0 Kenney characters, original role-shaped workstations, five event-driven animation states, bounded reusable effects, actual research/hedge/contest links, optional reduced motion, volume control and missing-art/no-WebGL fallbacks. Duplicate page-wide clash effects are suppressed while the canvas is active.
- Per-unit realized/open-position accounting, fees, included hedge-cost subset, gross exposure, active trait partners, build cautions and mechanically grounded advice. Expandable inspections remain open across updates. Research/protection receive activity proxies, not fabricated profits.
- Closing top/lowest order streams, largest open exposure, support activity, largest recorded interaction and advice. These describe measured association, not unsupported causal impact. Equal-sized market lanes replace crowded stacked tiles.
- Developer state disclosure, asset/license inventory, behavior matrix, model formulas, beginner-test protocol, screenshots, actual browser video and regenerated seeded engine replays.

## Verification

| Check | Result / artifact |
| --- | --- |
| Node suite | 60 tests: prior invariants plus replay timestamps, observation separation/no future reads, distinct directional policies, guard behavior, exact straddle expiry, per-unit shorts/reversals, covariance PSD, bounded visuals and research support metadata |
| Browser integration | Three Playwright/installed Edge tests: full five-day/weekend journey with Pixi, selection, expanded accounting, resizing/reduced effects; missing-art fallback; actual real-time battle capture |
| Syntax / formatting | `npm run check`, `npm run check:readout`, `npm run check:overhaul`, `git diff --check` |
| Actual drafted bot audit | [1,750 duels / 3,500 firm-day results](audits/bots-combat-overhaul.json), 50 seeds and seven neighbor pairings over five days |
| Controlled composition audit | [1,080 duels](audits/compositions-overhaul.json), 30 common seeds, both seats, identical autonomous controls, six-credit rosters versus one liquidity benchmark |
| Simulation-only profile | [7,200 warmed four-duel ticks](audits/performance-daily-ramp.json): mean 1.170ms, p95 2.036ms, p99 3.885ms; excludes DOM/render/audio, tick budget 500ms |
| Browser frame samples | [Real-time requestAnimationFrame intervals](audits/browser-frame-times.json); machine-specific browser timing, not GPU-render cost or a promise of 60 FPS |
| Real UI capture | [Actual browser battle](media/browser-battle.webm): real 40-second clock; preparation and closing included; captured in a clean headless Edge context |
| Engine replay | [Monday](media/opening-bell.mp4), [Friday](media/friday-stress.mp4), [manifest](media/manifest.json); separately labeled offline SVG visualization of actual seeded state |

Generated MP4s and the browser WebM are decoded with FFmpeg to check validity. Representative screenshots: [preparation](media/ui-preparation.png), [combat and inspection](media/ui-combat.png), [battle viewport](media/ui-battle-viewport.png), [compact width](media/ui-compact.png), [closing](media/ui-closing.png), [weekend](media/ui-weekend.png). Screenshots were visually inspected; this is not a comprehensive cross-device regression baseline.

Commands: `npm ci`; `npm run build:renderer`; `npm test`; `npm run check`; `npm run check:readout`; `npm run check:overhaul`; `npx playwright install ffmpeg`; `npm run test:e2e`; `npm run audit:bots`; `npm run audit:compositions`; `npm run benchmark:market`; `npm run showcase`. Browser tests expect Microsoft Edge installed. Playwright recording needs its own small FFmpeg download, separate from the offline renderer's development encoder.

The initial browser journey exceeded its timeout when a fake clock simulated every animation frame across a whole week. It was changed to advance one simulation tick per clock jump, while a separate recording test runs the full real-time clock. An initial recording attempt found Playwright's encoder missing; it was installed and the recording completed. The bundled colord package omitted its license file; the upstream MIT text was verified and retained. These were resolved tool/test issues, not silently skipped checks.

## Balance findings, not a balance claim

Drafted firms' profitable-result percentages Monday-Friday: 93.1 / 85.7 / 74.9 / 85.0 / 46.7. Friday mean result is -$19.43; 17.1% of Friday duels have both firms non-positive. Builds still depend strongly on the authored scenario.

Controlled comparison illustrates this: momentum wins 3.3% against the liquidity benchmark in calm sessions but 100% in directional sessions, with mean directional P&L +$193.44. Reversion wins 93.3% in calm but 11.7% in directional sessions, with mean directional P&L -$118.72. The reference liquidity roster is weak under stress; several alternatives beat it in every sampled stress matchup. These extreme results expose tuning work, not healthy counterplay proven across the lobby.

Composition rosters have equal six-credit cost but three or four slots, compare to one benchmark, and share seeds across seats. Per-unit order-stream averages are conditional on sampled teams, not causal unit value. No confidence intervals, full round-robin meta, human-skill estimate or automated-versus-skilled-manual viability claim is made. The old 12,800-day audit is historical and is not presented as a rerun of this model.

## Explicitly unfinished

- Human beginner watchability testing: protocol prepared, no participant results. This remains a release gate.
- Full roster uniqueness: representative policies are integrated; other identities deliberately retain related family algorithms. More differentiated art/action sheets and specialist diagnostics need playtesting.
- True cross-instrument hedging, fitted statistical arbitrage, adaptive model uncertainty, endogenous impact/discovery, financing/borrow/margin, continuous option valuation and Greek risk are not implemented.
- Spatial adjacency and desk assignment, equipment/crafting, paid leveling, opening PvE, era progression, persistent saves, online authority, matchmaking and live spectating remain deferred.
- Research links use actual shared-model support, not spatial allocations. Support accuracy/trim counts do not establish losses avoided or causal alpha.
- The canvas has click selection with accessible HTML counterparts, but richer keyboard canvas navigation, bespoke per-unit characters, a complete screenshot-baseline suite and low-end-device performance tests remain future work.
- Public prices remain exogenous observations. A coherent price/book/ledger model is not calibrated financial realism. Option cash scoring is explicitly expiry-only, not mark-to-market option accounting.

Next priority: run the beginner protocol and a broader equal-slot/equal-cost composition audit, then tune signal advantage and regime sensitivity. Do not add items just to conceal these unresolved questions.
