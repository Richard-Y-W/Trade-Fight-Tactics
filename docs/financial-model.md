# Current six-product model

The browser now uses the regional profile: ETF, marked daily European call, duration bond, commodity basket, pip-quoted FX and credit bond. Contract multipliers enter cash, realized/unrealized P&L, costs, risk and attribution. Regional totals include allocated costs. Old proxy formulas below apply only to the historical profile. [Exact current assumptions, formulas, migration and limitations](regional-market-architecture.md).

---

# Financial model: current combat pass

The battlefield pass adds local information delivery, actual routing latency, local automatic hedging, support costs and volatility/delay-aware passive spreads. Prefer [positioning-mechanics.md](positioning-mechanics.md) and [financial-consistency.md](financial-consistency.md) for those rules. Base ledger, hidden/public value, expiry and covariance formulas below remain applicable. Support-only firms no longer generate house quotes; old firm-wide support descriptions are superseded.

## Information boundary

The original seeded additive common-factor process now evolves hidden value `s.fundamentals`. Public valuation marks `s.prices` observe the previous tick's hidden value plus independent uniform noise in [-$0.04,$0.04]. Both processes have a $5 lower boundary. Asset paths remain independent of recruited units and commands. This is an authored game observation model, not fitted market price discovery.

Entry researchers observe hidden value one tick late; higher tiers observe current hidden value with bounded error. The error half-width is `config.noise / 2`, and estimates are combined using squared-grade weights. No strategy reads a future value. Without research the firm uses the public mark. Bots use delivered beliefs and observed history, including for opportunity-gated Press. Bots no longer condition directional targets on knowing the scenario name or access the hidden value for trading decisions.

The NPC informed customer may know current hidden value, while uninformed customers use noisy demand around public marks. This deliberate asymmetry creates adverse selection. Outside passive depth is finite and anchored to public marks. Neither fills nor trading volume change the exogenous marks. Execution prices remain actual resting-order prices and may differ from both marks and beliefs.

## Orders and ownership

The existing integer-cent persistent book retains best-price/FIFO priority, partial fills, finite outside ladders, cancel/replace, IOC and incoming self-trade prevention. Ordinary quoting is passive; manual Press may cross. Every trading unit owns its orders and attribution inventory. Firm-wide caps reserve capacity for resting orders. A guard blocks new exposure-increasing offers; it does not delete a position or promise that old orders cannot fill.

## Accounting

```
equity = cash + sum(inventory[a] * public mark[a])
trade cash change = -signed quantity * execution price - fee
unit net = attribution cash + sum(unit inventory * mark)
unit trading net = realized P&L + open-position P&L - fees
```

Reversals close the old position then establish the remaining position's basis. Per-unit basis and realized P&L are now tracked separately from the firm. Offset unit books can have gross exposure while net firm exposure is small; do not sum gross unit exposures and call it firm net risk. Own-account ledgers identify order streams, not counterfactual causal contribution.

Paid hedges close the accounts that own the exposure, at the marked price minus directional slippage, with explicit fees. Their costs are already contained in net P&L; the displayed hedge-cost subset must not be subtracted a second time. Research has activity/accuracy proxies rather than invented P&L. Guarded quotes are counted, not monetized.

## Options

Weekend call/put premiums remain $8 with quantity 12, strike $100, expiry next Monday's close. Payoff is `12 * max(direction * (close - strike), 0)`; net score includes the paid premium.

Volatility PM buys a separate day-expiry straddle: quantity `3 * grade`, premium `1.60 * quantity`, payoff `quantity * abs(NOVA close - 100)`. Opening cost and expiry payoff enter its attribution ledger and firm cash exactly once. It does not submit quotes or independently unlock Press. Option results are separated from trading/holding-move decomposition. No option time value is marked intraday; until expiry the cash score reflects the premium debit. This is explicitly an expiry-only gameplay convention, not fair-value option accounting.

## Linear risk

`covariance1s()` returns an absolute-price-change covariance matrix over two half-second ticks. It is the outer product of common-factor loadings plus non-negative diagonal idiosyncratic, average jump-frequency and observation-noise variances. It is symmetric positive semidefinite by construction. For share quantities q, `sigma² = q' * covariance1s * q`. Dollar weights are not mixed with price-change covariance.

The public observation difference contributes `2 * 0.08² / 12` per asset over the endpoint horizon. Uniform common/independent innovations and average jump frequency follow the authored model. Bounds, scheduled jumps and finite samples make this an approximation, not an exact conditional forecast. Risk excludes options, trading-policy changes, liquidity, financing and model error. It is not maximum loss, margin or a guarantee. Gross, net and largest-asset concentration are also available.

## Events and limits

Events retain legacy types for compatibility and add schema version, monotonic event ID, simulation tick, simulation milliseconds and canonical kind. Commands are stamped immediately; a completed day includes settlement. Quotes name research support, hedges name actual closed owners, and fill payloads include signed quantity and fees. `replayRecord()` exports a JSON-ready trace. Rendering and diagnostics never write to the simulation.

Still absent: calibrated processes, endogenous market impact, price discovery from executions, borrowing/financing, margin liquidation, dynamic option valuation, true cross-instrument hedging and online authority. Fixed-ratio relative value is an experiment with leg risk, not guaranteed arbitrage. Daily cash and positions reset. Existing accounting/queue tests remain mandatory.
