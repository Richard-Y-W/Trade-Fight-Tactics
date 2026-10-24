# Current regional iteration: Playtesting

The browser now uses the shared six-market floor, deterministic ownership subslots, market-assigned quotes/research, a marked daily ETF call and duration/spread/pip-aware instruments. Unit roles and finite support are preserved; the Volatility PM now quotes calls, and Relative Value Lead trades the rates/credit relationship when both markets are open. See [regional architecture](regional-market-architecture.md) and [UX, animation vocabulary and current tests](regional-ux-and-validation.md). Human beginner readability testing remains unperformed. Historical notes follow.

---

# Beginner watchability protocol

Status: protocol prepared; no external beginner has been tested. This is a release gate, not a claimed pass.

Show a participant 15–20 seconds of `docs/media/browser-battle.webm` or a live seeded day without explaining finance. Keep sound preference consistent and record reduced-motion settings. Do not explain terms such as FIFO, adverse selection or covariance first.

Ask, in order:

1. Which unit made lots of small trades? What visible evidence told you?
2. Which unit took the most risk? Is that different from the unit that lost most money?
3. Which unit protected positions? Did protection cost anything?
4. Which unit performed best, and how do you know?
5. Which market was your firm winning? Were fills and profit the same thing?
6. Why did the losing firm lose?
7. What would you change before the next day?

Then permit one short tooltip and unit selection, and ask the participant to revise their explanation. Track correct role identification, confidence, time to answer, confusion between marked/realized results, incorrect attribution of support profit and whether links identify actual teammates. Do not penalize missing jargon if the underlying explanation is right.

Provisional gate: at least four of five novices should identify liquidity, protection and the losing exposure from the clip and optional tooltip; none should think a buy fill is free profit or a hedge deletes losses. This threshold is a product choice, not a research-validated universal metric. Repeat on both winning and losing seeds, one research build and a no-research build, plus reduced-motion footage. Do not cherry-pick a profitable clip.

Expert follow-up: verify accounting interpretation, signal latency, queue competition, leg risk and hedging costs against developer state. Debug disclosure deliberately reveals hidden value and is excluded from ordinary usability clips.

Automated browser checks establish interaction/layout correctness, not human comprehension. Failure means simplify visual hierarchy or role cues before adding more metrics, controls or items.
