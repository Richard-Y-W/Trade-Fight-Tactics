# Current regional visualization

Orders now target per-region gateways on one shared floor. Ownership uses fixed left/right half-slots inside each tile, not two board halves. Unit badges use initials with full names/accounting on hover/inspection. Opening reveals the rival, closing fades it, and player placements persist. Market colors represent product identity; signed net P&L and overlays represent outcomes. [Event vocabulary and verification](regional-ux-and-validation.md).

Historical presentation notes follow.

---

# Tactical combat visualization

The persistent deployment board is the battlefield. Pixi renders the exact stored positions, while a transparent HTML tile grid provides pointer dragging, keyboard navigation, inspection and no-WebGL fallback. The opponent is above, the player below. Character/workstation assets retain their documented CC0/original provenance.

The selected exchange is a small layer at the center boundary, not a forbidden row or a sector lane. Its header shows the selected public mark and actual best book prices. Changing selected market changes displayed packets/footprints; all open books continue simulating. Detailed market charts, depth and P&L comparisons remain available in the Market heatmap drawer.

Preparation shows a copied scouting formation with translucent units and snapshot date. Clicking a different local firm explicitly captures a new known deployment; other changes do not mutate the snapshot. At opening the actual rival replaces the ghost in the same coordinate system. A 1.2-second grid/exchange illumination precedes the 40-second simulation timer. Reduced-motion settings skip this delay.

Actual route intents travel toward the exchange; delivered quotes use two-color bid/ask tickets; fills return from the selected market; cancellations return a subdued warm packet. No submission is labeled as profit. Research pulses come from actual local quote-support metadata, execution/manager pulses from paid support events, and hedging links name the positions actually closed. Quiet events are aggregated with a fixed 24-graphic pool.

Unit badges show marked net P&L and filled quantity, research next-move assessment proxies or risk interventions. Up to eight pooled `NET Δ` labels amplify meaningful unit-account changes. They include inventory marking and costs and are not realized-cash guarantees. Existing exact firm scores and optional synthesized audio are retained.

Main screen: scoreboard, board/overlays, market tabs, short result, traits, bench and shop. Right rail: compact control terminal, collapsed Follow the edge, scouting and lobby. Active roster details and full market tiles are expandable. The closing strip leaves the board visible; detailed accounting and diagnostics remain optional and do not prescribe a composition.
