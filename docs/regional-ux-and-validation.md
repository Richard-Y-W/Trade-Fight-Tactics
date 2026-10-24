# Regional floor UX and verification

## Presentation

Desktop shell: left controls/inspection, central HUD/floor/actions/bench/shop, right standings/scouting. `src/regional.css` is an incremental override of the existing style sheets. At 1920×1080, 1440×900 and 1366×768, the document remains viewport-height, square cells are preserved, and all eight bench slots and five shop offers are visible. Sidebars scroll independently. Narrower screens use a stacked, scrolling fallback rather than shrinking desktop controls beyond use.

The shared floor uses the same deployment coordinates during preparation and battle. A 1.2s opening precedes the full 40s trading clock; rival sprites materialize in their right ownership subslots. Closing removes interactive rival slots and fades their rendered sprites while preserving player positions. Reduced motion skips transition/effect movement. Labels are behind sprites, with explicit safe anchors. Muted market colors identify products, not gains. Green/blue identify firms; performance uses signed numbers and separate overlay data. Locked cells retain their layout and hover explanation.

Actual events drive packets and states: quote → bid/ask tickets; fill → return packet and execution state; research/used quote → signal/link; support_applied → routing/coordination link; hedge → covered-position link; contest → rival competition pulse; signal_result → evaluated next-move state. Quote, fill and net result remain different concepts. Event prioritization is bounded to significant source actions; number labels pool and aggregate marked account changes. A mark-change burst can be unrealized and never multiplies accounting profits. Region captions show your/opponent net product P&L, including allocated costs.

Market selection changes inspection and highlighting, not which books advance. Unit selection opens actual order-stream accounting in the left drawer. The most detailed charts are retained in a secondary drawer. Three primary operational actions maximum; extra actions expand under More controls. Costs/cooldowns remain tied to real commands. Sound starts muted; volume controls remain supported in the left Presentation & audio drawer.

## Reproduction

```sh
npm test
npm run check
npm run check:regional
npm run check:overhaul
npm run check:battlefield
npm run build:renderer
npm run test:e2e
npm run audit:regional
```

Node regression coverage includes original accounting, matching, pool, shop, traits, local support and deterministic simulation, plus regional map counts/contiguity/anchors, progressive legality, compatible swaps, instrument mechanisms, FX/option contract scaling, signed accounting, regional/unit reconciliation, instrument-routed events, option expiry, factor-risk finiteness and same-seed paths independent of formation. Browser tests cover pointer moves/swaps/bench returns, UI inspection, reduced motion, missing character art, complete weeks, ownership reveal/removal, market unlocks, and viewport geometry.

Artifacts: `docs/media/regional-{1920,1440,1366}.png`, `regional-day-{1..5}-combat.png`, `browser-battle.webm`, `regional-day1-replay.json`, `regional-multi-replay.json`; audit at `docs/audits/regional-markets.json`. JSON replays contain actual structured engine events and instrument metadata, not a separate film. The browser WebM is an actual real-time session. The older offline MP4 showcases still use the historical proxy model and are not evidence of new regional behavior.

The 576-duel regional audit uses four deliberately unequal-size/cost reference firms, three regimes, 24 common seeds and both seats against a six-trader diversified reference. It checks account reconciliation on every tick. Its headless timing excludes browser rendering, and win rates are not a balanced tournament. Results show directional/regime-sensitive outcomes and pronounced option/credit tail risk. See implementation-results for measured counts/timings and unresolved tuning.

## Human playtest still required

Show a 15–20s regional combat clip without finance instruction. Ask which unit traded most, carried the result, supplied information, reduced exposure, or took the most risk; which region each firm won; and what evidence supports the answer. Record correct/uncertain answers and time to identify the unit. Repeat using full-name hover and advanced inspection for experienced players. Automated screenshots and passing accounting tests do not establish that beginners can follow the fight or that it is fun.

Final verification: 79/79 Node tests; six Edge browser journeys passed. In addition to the 576 reference-composition duels, the current regional audit executes 360 real drafted-bot duels with shared pool/income/upgrades and checks closing accounting. See `audits/regional-bots.json`; Friday remains a major tuning limitation.
