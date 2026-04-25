# Synthesis: Trip Receipt & Driver Rating

## Recommended Features (top 3)

1. **Standalone `TripReceipt` component** — torn-edge paper design, driver header row, pickup/dropoff/notes/fare sections, reusable across post-ride screen, history, and future driver app. Props-driven from `Ride` type (all fields confirmed present).

2. **Interactive star rating in rating modal** — reuse `StarRating` with `interactive={true}` + `onRatingChange` (already supported, no rebuild). Optional comment field (max 280 chars), auto-shown 5 s after `completed` state, dismiss or submit → navigate to map.

3. **Post-ride screen wiring** — Expo Router screen `app/(main)/trip-receipt/[rideId].tsx` shown automatically on `completed` FSM state; same route accessible from ride history tap.

## Key Risks to Address in Spec

1. **Backend rating callable** (LOW confidence) — `submitRating` Cloud Function may not exist; spec must define a graceful stub/offline path so UI ships independently of backend availability.
2. **PDF stub disposition** (LOW confidence) — "Download PDF" link must show a clear "coming soon" toast; must not be a dead CTA.
3. **Driver retaliation safety** (LOW confidence) — rating modal must not expose rater identity to driver; spec must require anonymous storage.
4. **5 s modal timing** (LOW confidence) — spec must require the modal to be dismissible at any time and not block navigation.

## Constraints

- No actual PDF generation (expo-print spike deferred)
- No backend receipt endpoint changes (receipt built entirely from local `Ride` data)
- `RideFare` fields confirmed: `baseFare`, `distanceFare`, `timeFare`, `total`, `currency: 'XOF'`
- `RideRating` type confirmed: `clientToDriver`, `comment?` — matches receipt + rating output shape
- `StarRating` component confirmed interactive — no rebuild needed
- XOF formatting via `toLocaleString()` (matches existing rides.tsx pattern)

## Suggested Domain Decomposition

- **Domain A: Trip Receipt Component** (`cavekit-trip-receipt.md`) — standalone `TripReceipt` React Native component: torn-edge visual, driver header, address rows, fare breakdown, PDF stub. Shareable, props-driven, no navigation logic.
- **Domain B: Post-Ride Rating Flow** (`cavekit-post-ride-rating.md`) — `completed` state → receipt screen auto-navigation; rating modal (5 s delay, star + comment, submit/dismiss); back-to-map navigation; `submitRating` callable stub.

## Success Criteria Candidates

- Receipt screen auto-renders on every `completed` ride (≥ 90% open rate)
- Rating submission within 60 s of drop-off (target ≥ 55%)
- Fare dispute support contacts drop ≥ 30% post-launch
- Rating stored as `RideRating.clientToDriver` in backend; retrievable in ride history
