# Phase-aware update

The shared regional board now grows during combat and yields height to readable drafting during preparation. Bench/shop use existing CC0 character sprite crops alongside role symbols; no new third-party art was introduced. Unit board statistics are compact, with full names and detail in inspection. Both firms remain visible during results. [Current design and measured artifacts](continuous-game-loop.md).

---

# Current regional iteration: Visual design

The browser now uses the shared six-market floor, deterministic ownership subslots, market-assigned quotes/research, a marked daily ETF call and duration/spread/pip-aware instruments. Unit roles and finite support are preserved; the Volatility PM now quotes calls, and Relative Value Lead trades the rates/credit relationship when both markets are open. See [regional architecture](regional-market-architecture.md) and [UX, animation vocabulary and current tests](regional-ux-and-validation.md). Human beginner readability testing remains unperformed. Historical notes follow.

---

# Trading-floor visual system

Dark green trading room, neutral cream typography, ownership green/blue. Role silhouettes carry meaning independently of color: twin quote monitors, fast server screens, research antenna, risk shield, directional lever, capacity stacks and V-shaped option payoff.

`floor-pixi.js` uses PixiJS v8, nearest-neighbor 16px CC0 characters at 2× scale, procedural pixel workstations, reusable containers and a fixed pool of 24 effect graphics. The canvas shows rival units above public market stations and player units below. Accessible HTML floor cards, keyboard controls, inspection and shops remain available.

Five reusable states: idle, action, success, stress and synergy. Simulation events select temporary states; timeout returns them to idle. Success at execution reflects current-mark edge after execution fees, not guaranteed eventual realized profit. The unit's numerical badge remains actual marked net P&L. Research stress indicates an assessed wrong next-public-move direction, not fabricated damage.

Tickets connect units to markets. Research links come from actual quote support metadata. Hedges link to the position owners actually closed. A contested fill connects the winning unit to the outplayed rival. Relative-value legs connect the two actual markets. No money, health or matching depends on these visuals.

At most ten prioritized unit events are selected per update and at most 24 effect objects are live. Repetitive quote activity loses priority to risk, contests and fills. There are no profit multipliers or arbitrary damage shields. Existing exact headline numbers and marked-change bursts are retained.

Less motion disables traveling effects and temporary canvas states; the OS reduced-motion preference is also honored. Sound remains opt-in, with a separate volume slider. Missing character textures preserve recognizable procedural workstations; unavailable WebGL preserves the existing DOM unit scenes. Local bundled rendering code avoids a runtime CDN dependency.

Public marks and ownership scores remain separate. Market cards now use equal-sized lanes to prevent small stacked tiles from putting large numbers over market names. Expanded accounting, developer state and important-moment logs are optional. Spatial adjacency gives no bonuses in this pass.

Build: `npm ci && npm run build:renderer`. The committed bundle supports the existing installation-free local play path. Browser QA commands and artifacts are recorded in implementation-results.md.
