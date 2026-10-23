# Battlefield validation and human readability

Automated commands: `npm test`, `npm run check:battlefield`, `npm run test:e2e`, `npm run audit:battlefield`, `npm run benchmark:market`. Browser tests use installed Edge and include pointer drag from bench, swaps, return to bench, alternate geometry, scouting, opening timer/formation continuity, market switching, compact layout, missing sprites, reduced effects and a full five-day/weekend journey. Financial tests remain separate from rendering.

Representative captures: [deployment](media/board-deployment.png), [active board](media/board-combat.png), [compact layout](media/ui-compact.png), [closing strip](media/ui-closing.png), [real-time browser battle](media/browser-battle.webm). The browser recording uses the actual simulation clock; offline engine visualizations remain separately labeled.

Human playtest is **not yet performed**. This remains an unpassed release gate. Show 15–20 seconds without explaining finance and ask which unit trades most, which appears profitable, which carries exposure, who supports whom, which side wins fills, where the rival is strongest, and which part lacks support. Then allow one tooltip/inspection. Score conceptual correctness and confusion about volume/profit, not use of jargon. Repeat with a losing composition and reduced motion.

For finance-aware players, ask them to reconstruct a fill from its quote timestamp/latency/FIFO, distinguish realized/open-position results, identify inventory skew and local signal sources, and account for hedge/support costs. Use the optional developer disclosure to verify, not as a normal combat HUD. Do not claim fun or comprehension based on screenshots or passing tests.

The reference-formation audit compares clustered and dispersed HFT, research-supported, defensive and manager-heavy firms over common seeded calm/directional/stress sessions and both seats. It measures P&L, fees, drawdown, fills, quote activity, routing delay and support events, not enjoyment or causal unit value. Costs differ across reference firms; results are diagnostics rather than a balanced meta.
