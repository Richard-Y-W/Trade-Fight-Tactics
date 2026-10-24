# Regional accounting update

Current profile adds instrument tick scales and contract multipliers; option expiry is intrinsic settlement, FX quotes are pip-sized. Current regional and unit net P&L reconcile to firm equity after fees, with the separate weekend ticket explicitly outside unit attribution. [Current model and risk limitations](regional-market-architecture.md). Prior checks below remain historical context.

---

# Financial consistency of the battlefield pass

The existing matching, basis/reversal accounting, marked equity, option expiry, costs and covariance model remain the financial foundation. See [financial-model.md](financial-model.md) for formulas, with local delivery/routing superseded by [positioning-mechanics.md](positioning-mechanics.md).

Positions now affect the age and delivery time of real quote decisions. Delayed intents store creation observations and are executed only on scheduled arrival. Matching still uses current remaining quantities, price/FIFO, capacity reservations and self-trade prevention. Cancellations are explicit events. The renderer cannot move a financial position or choose a fill.

Private research innovations are now independent per source, with stable seeded streams. For source grades g and noise widths inversely proportional to g, squared-grade weighting produces diminishing aggregate uncertainty. Only linked sources feed a trader. A displayed firm-wide summary is not permission for every trader to access remote information. Bots use public marks for their high-level Press opportunity check; local strategies consume delivered beliefs.

Research production, applied execution routing and management priority debit cash and fees and the support source's attribution account. Quote/hedge fees continue to reconcile. Support units may have negative direct cost P&L; measured support activity is separate from causal profit. Automatic hedges can reduce only connected owners' eligible exposure. Firm-wide manual emergency trimming is explicit and paid. No hedge is a damage shield.

The order pipeline and finite local links add strategic risks. A very fast trader may earn more turnover or accumulate losing exposure. A distant trader receives older information and uses a wider passive spread. A manager-heavy firm is allowed to have insufficient execution. No hidden house trader fills that gap.

The reference/public paths remain exogenous and repeatable across formations; positioning does not manipulate the random price process. Option pricing is still expiry-only, risk remains a linear approximation excluding derivative risk, and financing/margin/market impact remain unimplemented. The 500ms tick scale is a gameplay abstraction, not real exchange latency calibration.

Preserved tests cover cash/equity reconciliation, shorts/reversals, queue/partial execution/cancellation, inventory limits, option premiums/payoff, deterministic paths, signal information boundaries and support cost accounting. New tests cover delayed arrival timestamps, remote-signal isolation, local hedging, support capacity, multiple managers, unusual support-only floors and exact heatmap mapping.
