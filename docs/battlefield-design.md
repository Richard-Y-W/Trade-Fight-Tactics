# Current shared regional floor

The mirrored-half design below is historical. The current browser uses one 8 x 8 floor: exact contiguous product regions (14 equities, 16 options, 14 rates, 10 commodities, 6 FX, 4 credit). Both firms can occupy the same tile in separate deterministic subslots. Units route to real instruments by tile; locked/unsupported deployment is rejected. [Current rules](regional-market-architecture.md), [UX/tests](regional-ux-and-validation.md).

---

# Battlefield redesign: audit and architecture

Starting point: 60 headless tests and three browser checks; retained PixiJS character/workstation system, persistent shared FIFO books, accounting, hidden/public observations, 32-unit pool, bench, merging, interest and 40-second days. Existing floor is two fixed rows with no persistent positions; support is firm-wide and diagnostics dominate vertical space.

Implementation order: company-owned configurable 8×8 geometry; legal drag/drop and swaps; explicit 500ms-tick routing delays and capacity-bounded local support; stable preparation/combat positions; snapshot ghosts; shared selected exchange and measurable tile overlays; compact result and collapsible analytics; tests/audits/screenshots.

Preserve strategy rules and ledger invariants. No sector territories, role quotas, mandatory diversification, items, new engine or artificial profit buffs. Tile positions are an abstraction of network connectivity, not geography. Player and opponent use identical local coordinates measured outward from the center boundary. The exchange is a visual overlay and never invalidates a legal tile. Detailed mechanics and validation follow in the accompanying positioning/results documents.
