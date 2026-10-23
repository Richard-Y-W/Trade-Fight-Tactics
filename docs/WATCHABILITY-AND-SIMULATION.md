# Follow the edge

Historical assessment from the prior pass. The 2026-10-23 overhaul adds hidden reference observations, distinct policies and Pixi/browser verification. Prefer [financial-model.md](financial-model.md) and [implementation-results.md](implementation-results.md) for current model and validation facts. The attribution principles below still apply.

Current implementation assessment, October 2026. This document supplements the current [pacing](FAST-BETA-PACING.md) and [order-book mechanics](ORDERBOOK-AND-COMBAT.md). Older documents describe earlier prototypes.

## What changed

The live **Follow the edge** panel separates both firms' results into **Trades & costs** and **Holding moves**. Select any deployed unit on either floor to pin its order-stream result, positions and role. Active shared-trait teammates receive a linked outline and can be selected directly. Shared research and protection are explained explicitly; they do not receive fictional profit credits.

The last three important price/FIFO contests, inventory trims or quote-limit events remain available under **What just happened**. Commentary admits one event per four-second beat so frequent fills do not overwrite each other immediately. It is sampled commentary, not a complete trade blotter. Winning flow is explicitly distinguished from earning money.

The panel remains available at the closing bell. It complements the short inline result rather than introducing another results modal. Colors identify firms, not profitability.

## Accounting behind the explanation

For account j, marked net result is its actual cash flows plus its current positions valued at the reference marks. These are attribution accounts, not separately funded firms.

```
unit net = account cash + sum(account inventory[a] * current mark[a])
holding moves += sum(inventory BEFORE tick[a] * (new mark[a] - old mark[a]))
trades & costs = marked net - cumulative holding moves
firm net = trades & costs + holding moves + option / other
```

Trades & costs includes execution edge, hedge slippage, trading fees and refresh costs. It is not realized P&L: a newly opened position's execution edge is marked immediately. Holding moves includes gains or losses while exposure remains open, including positions later closed. House-policy accounts are included in firm totals. Options are shown separately because they have no intraday marking in this prototype.

The observer starts before the first tick, snapshots inventory after each observation, and handles multiple observations within a tick without double counting. The app observes after manual actions as well. Tests reconcile all ticks across calm, directional and unstable sessions, including an option, and compare with an unobserved duplicate simulation. This layer cannot change orders, prices or P&L.

Unit ledgers describe whose order stream owns positions. They do **not** answer the counterfactual question "how much more did the team make because this researcher existed?" A protector's costly closing trades are allocated to the position owners; its activity records the amount trimmed and cost. A research unit reports shared estimate quality. Trait connections indicate real deployed threshold membership, not that one unit caused a particular teammate's win.

## Is the simulation good enough?

**For a playable strategy prototype: yes. For a financially realistic or competitively balanced release: no.**

| Layer | What works | Remaining limit |
| --- | --- | --- |
| Order matching | Persistent integer-cent limit books, price/FIFO, partial fills, IOC, cancellation and self-trade prevention | Tiny synthetic venues; coarse 500ms strategy ticks; no exchange-calibrated latency |
| Accounting | Cash/inventory conservation, closing and reversal cost basis, fees, costly hedge trades and option expiry | Daily bankroll resets; no financing, borrow, margin liquidation or persistent solvency model |
| Competition | Real shared customer orders, unit-owned queues, rivals winning price/queue contests and taking stale liquidity | Outside ladder is replenished by rules; demand and flow are authored |
| Information | Better research reduces noisy current-mark estimation | No hidden fundamental process or genuinely predictive private signals; bots can observe the game mark |
| Prices | Reproducible common-factor, asset-specific and jump scenarios; builds face comparable paths | Exogenous, uncalibrated marks; executed orders do not discover or move prices |
| Risk | Actual inventory caps and a common-factor linear inventory volatility estimate | Estimate excludes options, dynamic policies, liquidity stress and model error; not a loss bound |
| Units | 32 identities, individual quote/position streams, stars, six behavior families, real trait thresholds | Many identities vary grade and trait coverage rather than implementing a distinct strategy; support and limits are shared |
| AI | Shared-pool recruitment and upgrades, both-side active policies, opportunity-gated Press | Greedy roster selection; simple observed-trend policy knows the authored session type; no robust adaptive opponent model |

Luck still matters because price paths and customer arrivals vary. It is not just an independent random P&L roll: quotes, queue position, fees, exposure and constraints determine the resulting cash flows. However, accounting correctness does not establish strategic balance. A profitable build in an authored drift regime has not proved real predictive skill.

The existing actual-bot audit covers 1,750 duels / 3,500 firm-day results across 50 seeds, seven neighboring bot pairings and five daily configurations. Profit rates are 95.7%, 87.6%, 96.9%, 89.1% and 45.0% Monday-Friday. Seeds repeat across pairings/days; this is a diagnostic, not an independent statistical trial. Friday mean P&L is -$21.28 and 17.1% of Friday duels have both firms non-positive. Those are tuning signals, not evidence of calibrated market realism. The fixed-roster audit also finds composition imbalance and mixes human-like and automated intervention policies.

The existing simulation-only benchmark averages 1.084ms per four-duel tick (p95 1.725ms, p99 2.089ms), with seven units per side and five markets. The tick budget is 500ms. This excludes DOM, effects and audio, and does not establish browser FPS. C++ is not justified by this result.

## Next modeling and playtest work

1. Test whether players can identify the profitable carry, exposure source and support contribution after watching one day. Compare automatic focus with manually selected units; keep explanations compact.
2. Run paired-seed, seat-swapped composition tests with identical intervention policies. Compare drawdowns, fees, turnover, risk and win rates rather than optimizing every bot to make money.
3. Introduce hidden fundamental value and fair, noisy/delayed observations so research can provide meaningful information without access to an exact tradable mark. Give every strategy the same observation rules.
4. Separate public trade prices, executable quotes and valuation marks; add controlled inventory-sensitive outside depth or market impact. Preserve conservation and reproducible replays.
5. Add financing/borrow/margin only if they produce understandable decisions within a 40-second day. Add option marking before advertising a volatility or Greeks-based strategy.
6. Give selected unit families genuinely different policies before adding another large roster or the item system. A second trait badge alone is not a new combat behavior.

## Showcase provenance and validation limits

`npm run showcase` renders two MP4s and GIF previews from actual engine states, using the same attribution observer. The layout is an offline SVG replay visualization, **not an application screen recording**. Both sides use autopilot; all units are one star. The manifest records seeds, rosters, scenarios, market counts, exact final scores and a SHA-256 digest of each engine event trace. The sessions are illustrative, not randomly sampled balance evidence. Each video contains the full 40-second day plus a closing hold.

The encoder decodes each completed MP4 as a validity check. PNG posters permit layout inspection. Native capture access timed out and the browser tool exposed no tabs, so this change has automated DOM verification and offline-render inspection, not live-browser responsive QA. Real UI screen recordings remain follow-up work.
