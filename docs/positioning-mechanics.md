# Current regional positioning

The current shared map has no player/opponent halves. Units choose products by region. Routing distance is floor(Manhattan distance to that region's gateway / 2) ticks, plus the existing processing queue and infrastructure effects. Research only produces the region's product estimate; a structural connection does not deliver estimates for other products. Same existing finite local support rules; no profit bonus from tile area. [Full rules](regional-market-architecture.md).

Historical mirrored-half rules follow.

---

# Positioning and financial effects

Positions are local `{col,row}` coordinates. Row 0 touches the center boundary, row 3 is the back of a half-board. Player global rows 4–7 mirror opponent rows 3–0. Default geometry is 8×8; 9×8 is selectable during preparation. Neither sectors nor roles own tiles. All deployments use the existing total capacity progression. Bench, floor and merge transactions retain unique instance IDs and positions.

## Actual routing timeline

One simulation tick = 500ms. An order intent snapshots prices, delivered beliefs, history, stance and inventory at creation. Its arrival is scheduled explicitly:

```
network ticks = local row
processing ticks = 1 for ordinary dispatch jobs beyond the first four, otherwise 0
native execution traders bypass that processing queue
network ticks after engineering = max(0, network ticks - 1) if connected
processing ticks after management = max(0, processing ticks - 1) if a token is available
latency ms = 500 * (adjusted network ticks + adjusted processing ticks)
arrival tick = creation tick + latency ms / 500
```

Jobs are matched on arrival, never at creation. Current capacity is checked at arrival. Price and FIFO priority remain intact; a legacy within-tick submission rank breaks simultaneous arrivals, not existing queues. It is a rank, not an extra negative time. Market pauses and emergency risk changes cancel applicable in-flight intents. Intents still in flight at the closing bell do not execute after settlement.

Faster access supplies more current decisions, not free profit. Positions and fees arise from actual fills. Passive half-spreads scale by `max(1, regime volatility) * sqrt(1 + delay ticks)` to account for information age and volatility; Press retains its advertised tight IOC limit. The existing bounded inventory reservation skew is retained. This is a deliberately coarse game-time network model, not calibrated microsecond exchange latency.

## Local support

Manhattan range is two tiles. Sources select nearest eligible trading policies, then stable instance ID for equal distance. There are no role limits; multiple sources and hybrid units remain legal.

| Source | Maximum targets | Actual effect / cost |
| --- | --- | --- |
| Research family | 2 | Only connected quotes receive estimates. Independent source noise scales with grade; squared-grade weighting gives diminishing aggregate uncertainty. Each asset estimate costs $0.001. |
| Execution Engineer / Execution Services PM | 2 | At most one connected source removes one network tick; each routed job using it costs $0.002. Additional engineers extend coverage rather than stacking negative latency. |
| Risk family | 3 | Risk Analyst blocks new exposure-increasing offers above 18 shared units only for connected traders. Automatic hedges close connected owners' positions at explicit slippage/fees. |
| Portfolio PM / Allocation Research Lead | 3 | Each manager can prioritize two congested dispatch jobs per two-tick window, costing $0.002 per applied priority. Multiple managers have finite, separate coverage/tokens; redundant managers are not a profit multiplier. |

Selected trait thresholds remain firm-wide as documented. Local links govern the additional unit support. Grade may improve existing role capabilities; it does not expand every radius automatically. Some manager/infrastructure identities retain their original hybrid trading or risk policy.

Manual emergency hedging remains an explicitly paid firm-wide override. Unattributed house-account positions introduced through diagnostic trade helpers are monitorable; support-only compositions no longer create autonomous house quotes. Eight managers are legal when total capacity permits; the fast-beta progression still ends at seven deployed units normally.

Pointer dragging, click-to-arm then tile placement, arrow-key grid navigation and Delete-to-bench use the same validated company operation. Preview shows range, reachable links, base network delay and minimum delay after infrastructure; congestion depends on dispatch order. No recommended formation is generated. The board freezes at opening and does not move units during combat.
