# Shared-region overlays

The six market colors are identity colors, not positive/negative returns. Board overlays retain actual per-unit activity, marked account net, contract-scaled gross exposure, contests and selected-product fills. Region captions show your/rival net product P&L including allocated costs. Area never weights any of these metrics. [Current details](regional-market-architecture.md).

Historical notes follow.

---

# Board overlays versus market heatmaps

`board-overlays.js` maps measured account/event values to the owning unit's current tile, mirrored for the rival. No value is inferred from which firm is winning. Intensity is normalized to the largest absolute displayed value; it compares current board units, not an absolute score across different days.

| Overlay | Value at a unit's tile |
| --- | --- |
| Activity (default) | Cumulative executed quantity |
| Net P&L | Attribution-account cash + inventory valued at public marks, including costs and any owned expiry contract |
| Exposure | Sum of absolute inventory × public price; gross exposure, not maximum loss or portfolio volatility |
| Execution competition | Customer quote contests won minus contests lost, using actual price/FIFO contest events |
| Selected-market activity | Executed quantity in the selected asset, from the per-unit per-asset fill counter |

Low-opacity ownership tints preserve characters; loss/negative contest balance uses a warm tint, exposure uses amber. Selection exposes actual local support links. The selected-market mode highlights where executions occurred, not a mandatory market assignment. A unit with no fills may still be quoting or supporting.

The separate market heatmap/charts drawer retains each asset's public price trace, both firms' asset P&L before firm-wide costs, and executed-volume comparison. Its volume is distinct from profit and may include non-customer executions. The central best bid/ask is derived from the same persistent book. Board exposure colors do not claim to depict real exchange geography or collateral/margin.
