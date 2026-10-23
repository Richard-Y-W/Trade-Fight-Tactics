# Savings, rivalry, hover explanations, and profitability

Latest reference: [fast beta pacing, AI, stars and feedback](FAST-BETA-PACING.md) supersedes the older weekly capacity, four-market count and audit figures below. Savings and contest semantics remain applicable.

October 22, 2026. Current refinement of [order-book combat](ORDERBOOK-AND-COMBAT.md). This supersedes that document's unbounded inventory skew, aggressive background replenishment, constant hedge trimming, sidebar width, and audit figures. The shared bag, weekly capacity and 32-unit roster remain.

## Units contest actual opportunities

Both firms already trade in the same books. Now a customer fill records a contest when a rival-owned, eligible order was also available. The winner is the unit that actually filled first. A better quote earns PRICE EDGE; an older order at the same price earns QUEUE EDGE. Only the first contested fill per customer request emits the marker, to avoid pretending every fill is a new battle. A large order may subsequently fill the other firm's quote too.

Green/blue market ribbons and travelling unit icons identify the winner, losing contender, quantity won, and reason. These are execution events, not random combat rolls or profit bonuses. Direct fills against rival-owned orders still show DUEL. Winning volume can still lose money if the asset moves against the resulting inventory.

## Hover explanations

A delegated tooltip system works for deployed and benched units, opposing recruits, recruitment offers, trait chips, style/specialty tags, and the income preview. Keyboard focus also opens explanations; Escape and scrolling dismiss them. Tooltips are placed inside an open dialog when needed so they remain visible above the modal.

Unit explanations include the specific description, combat role, behavior, markets affected, and counter. Traits show their plain-English purpose, both thresholds, active status based on the player's deployed roster, and costs. Counts exclude reserves, duplicates, and extra stars. All current trading units operate across all four markets: no fictional Technology/Energy affinity is claimed. Research and protection support the firm across markets.

The desktop lobby is now 290px, or 265px on medium desktop windows, with larger labels, spacing, and a thin scrollbar. The app's maximum width is 1,640px. Below 1,000px the lobby stacks beneath the main area.

## Recruitment savings interest

```text
interest = min(5, floor(savedRecruitmentCredits / 10))
nextDayIncome = 4 + interest
```

Use the closing saved balance, before adding new income. Examples: 9 saved gives +4; 10 gives +5; 20 gives +6; 50+ gives +9. Unit purchases, sells, and rerolls update the next-day preview. Interest is awarded once through the existing next-day transition, including Monday after the weekend choice. Eliminated firms receive no income. All bot companies use the same rule.

Interest is recruitment currency, separate from trading P&L and the $10,000 daily trading bankroll. It cannot change who won the financial duel. Paid leveling remains deferred; deployment capacity still increases automatically by week.

## Why too many desks were losing

The previous simulation combined several harsh behaviors:

1. The outside liquidity provider replenished by sending marketable orders, repeatedly sweeping stale firm quotes. That made routine replenishment an aggressive adverse-selection agent.
2. Unbounded inventory skew could move a reducing quote through fair value. A heavily long desk might keep selling below its own mark merely because it wanted less inventory.
3. Desks without a researcher had a noise scale of 0.65, making pricing errors large relative to the ordinary $0.13 half-spread.
4. Automatic protection repeatedly liquidated small excesses, paying slippage and commission each time.

The changes preserve genuine cash/inventory accounting:

- Ordinary trading-unit orders and outside liquidity replenishment are passive: crossing quotes are adjusted one cent away from the best opposite order. Press retains IOC taking, and informed customers can still exploit stale quotes.
- Inventory skew is bounded to 60% of the current half-spread. Trend and manual conviction can still deliberately bias quotes; wrong views remain risky.
- The baseline estimation-noise scale is now 0.24. Research still improves quality through the existing diminishing-returns formula.
- Automatic protection and periodic rebalancing have a six-unit trigger buffer. They trim to the original target only after that buffer is exceeded. Manual emergency flattening remains immediate and paid.

No cash reward was added to manufacture profit. There is no floor at zero P&L, and losses still affect health. Negative rounds remain appropriate when quotes are stale, directions are wrong, or inventory is expensive to unwind. Both profitable firms and both losing firms can still meet.

## Evidence and limits

The 12,800-day diagnostic was rerun. [Raw audit](audits/market-audit.json) now records each side's profitable-result share, both-profitable share, and both-nonpositive share, alongside P&L and wins.

Across the six original equal-cost builds and seed-mixed pairings, 60.9% of firm results were profitable; both firms were profitable in 43.7% of duels, and both were nonpositive in 21.9%. Fixed-regime profitable firm-result shares were:

| Regime | Profitable firm results |
| --- | ---: |
| Calm | 98.0% |
| Directional | 51.5% |
| Unstable | 39.6% |

For example, Systematic balanced versus Liquidity research now averages +$9.85 versus +$8.01 in the seed-mixed sample; both are profitable in 51.5% of those duels. This addresses the frequency of loss-only fights without guaranteeing positive returns.

These are authored-game scenarios, repeated matched seeds, simple policies, and six existing rosters. They do not establish realistic market calibration, the balance of all 32 units, or optimal human performance. HFT remains strong, some protection/research compositions still underperform, and further balancing is needed. Reference prices remain exogenous; the simulator does not include real funding or full price discovery.

43 automated tests and syntax checks pass. New checks cover savings thresholds and cap, pre-income calculation, eligibility on elimination, contested price/FIFO outcomes, passive orders, hedge buffers, and hover explanations. Existing tests continue to cover accounting, risk reservations, unit ledgers, supply conservation and the UI week/weekend journey. Browser surfaces remain unavailable in this session; actual rendered layout and visual effects have not been independently verified.
