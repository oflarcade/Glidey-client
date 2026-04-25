# PM Assumption Analysis — Trip Receipt Screen & Driver Rating Flow

**Feature:** Post-ride receipt screen (torn-edge paper design) + driver rating flow
**Market:** Senegal (XOF currency)
**Tech:** Expo 54, RN 0.81, React 19, TypeScript strict, existing rideStore FSM, Expo Router

---

## Assumption Register

| # | Category | Assumption | Confidence | Fast Test / Experiment |
|---|----------|------------|------------|------------------------|
| 1 | **Value** | Riders in Dakar want a detailed fare breakdown (line items + discount/payment tags) after every trip — not just a "you paid X" summary | LOW | Intercept test: show two receipt variants (summary-only vs. itemized) to 10–15 beta riders; measure which they screenshot or share more, and whether support tickets about fare disputes drop |
| 2 | **Value** | A 1–5 star rating with an optional comment field captures enough signal to meaningfully improve driver quality over time | MEDIUM | Run a 4-week cohort: collect ratings + comments, then correlate star scores with repeat-booking rate per driver; if Pearson r < 0.3, the signal is noise and the format needs rethinking |
| 3 | **Usability** | Auto-showing the rating modal 5 seconds after drop-off is the right timing — riders are still engaged and not already walking away | LOW | A/B test: 5 s vs. 15 s vs. "rate when you open the app next time"; compare modal dismissal rate and rating submission rate per condition |
| 4 | **Usability** | The torn-edge paper visual clearly reads as a "receipt" to Senegalese riders, most of whom are unfamiliar with digital receipts in that format | LOW | Guerrilla usability test: show the screen to 5 non-tech riders without any label; ask "what is this screen for?"; pass threshold = 4/5 identify it as a payment summary |
| 5 | **Feasibility** | The backend `Ride` document already carries all data needed for the receipt (driver info, fare line items, discount tags, pickup/dropoff addresses, payment method) with no new API work | MEDIUM | Audit: read the `Ride` type in `@rentascooter/shared` and cross-check with backend ride document schema; identify any missing fields (e.g., discount codes, payment method label) before sprint start — the existing `ridesService` only exposes `getRideHistory` with no fare-breakdown shape confirmed |
| 6 | **Feasibility** | A standalone `<TripReceipt />` component can be built once and reused without modification across three surfaces (post-ride modal, ride history screen, driver app pop-up) despite each surface having different data-loading context and navigation constraints | MEDIUM | Spike: wire the component into all three surfaces in a single branch; if prop drilling or context coupling requires more than 2 adapter wrappers, extract a headless hook and keep the visual separate |
| 7 | **Feasibility** | "Download PDF" is achievable in Expo 54 without ejecting (e.g., via `expo-print` + `expo-sharing`) and will produce a visually correct XOF-formatted PDF on both iOS and Android | LOW | Time-boxed spike (2 hours): generate a PDF of the receipt on a physical Android device; verify XOF formatting, torn-edge graphic, and that Sharing works on both platforms before committing to the feature |
| 8 | **Viability** | The rating system will not create driver retaliation risk (drivers seeing low scores and refusing future rides from specific riders) — a significant safety concern in the Senegalese market where social dynamics are tight-knit | LOW | Policy + tech review: confirm whether driver-facing app exposes the rater's identity alongside the score; if yes, anonymise before launching; consult 2–3 local drivers in focus group before enabling ratings in production |
| 9 | **Ethics** | Collecting optional free-text comments at end of trip is compliant with Senegal's data protection law (Loi n° 2008-12 sur la Protection des Données Personnelles, enforced by CDP) and does not require additional consent beyond the existing terms | MEDIUM | Legal review with local counsel: verify whether free-text ride comments constitute "personal data processing" under CDP rules and whether the existing privacy policy covers it; do not ship comment field without sign-off |
| 10 | **Go-to-Market** | Riders will trust a digital receipt enough to use it as proof of payment (e.g., for expense reimbursement or employer claims) — creating a genuine retention incentive | LOW | Intercept survey with 10 Dakar-based riders who work in formal employment: "Would you submit this screen/PDF to your employer for reimbursement?"; if >60% say yes, invest in PDF quality; otherwise deprioritise the Download CTA |
| 11 | **Strategy** | Surfacing the receipt in driver history (driver app pop-up) does not create a legal or operational liability if a driver disputes the system-calculated fare shown on their copy | MEDIUM | Define the single source of truth: confirm with backend team that the fare shown on the driver pop-up is always identical to what the rider paid; document the dispute resolution flow before exposing fare data to drivers |
| 12 | **Team** | The existing `StarRating` component (already imported in `rides.tsx`) is production-ready for interactive input — not just display — and can be reused for the post-ride rating without a full rebuild | HIGH | Code audit: read `packages/ui` StarRating implementation; check whether it exposes an `onPress` / `onChange` prop or is display-only; if display-only, budget 1 day to extend it before sprint planning |

---

## Priority Order for Validation

1. **#5 Feasibility — fare breakdown in Ride type** — blocks all implementation; validate in day 1 of sprint
2. **#12 Team — StarRating interactive capability** — blocks rating UI; 30-minute code audit
3. **#8 Ethics/Viability — driver retaliation risk** — high human harm potential; needs early driver focus group
4. **#9 Ethics — CDP compliance for comments** — legal blocker; needs counsel before comment field ships
5. **#3 Usability — 5 s modal timing** — cheap A/B once feature is live; low cost to iterate
6. **#7 Feasibility — PDF generation** — time-box spike before committing; drop the CTA if spike fails
7. **#4 Usability — torn-edge receipt legibility** — 1-day guerrilla test before final design handoff
8. **#1, #2, #10** — value assumptions; validate post-launch with analytics and cohort data

---

*Generated: 2026-04-22 | Analyst: PM Assumption Analyst (Claude Code)*
