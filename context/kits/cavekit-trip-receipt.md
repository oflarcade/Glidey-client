---
created: "2026-04-22"
last_edited: "2026-04-22"
---

# Cavekit: Trip Receipt Component

## Scope
A standalone, shareable trip receipt component that renders a completed ride as a paper-receipt-style visual summary. The component is presentation-only: it accepts ride data as props, has no internal navigation, no backend calls, and no awareness of its host screen. It is designed to be reusable across the post-ride screen, the ride history screen, and (in the future) a driver-facing app. Covers the receipt visual structure, layout sections, and the PDF download stub.

## Requirements

### R1: Receipt Component Structure
**Description:** The component renders a completed ride as a single visual receipt made up of a fixed set of sections arranged vertically, driven entirely by the ride data passed in.
**Acceptance Criteria:**
- [ ] A driver header row is rendered at the top containing, in this order: a driver avatar (photo when available, initials fallback otherwise), driver name, total fare amount in XOF, trip distance, a payment tag, and a discount tag rendered only when a discount was applied to the ride.
- [ ] A section labelled "PICK UP" is rendered below the driver header, showing the pickup location for the ride.
- [ ] A section labelled "DROP OFF" is rendered below the pickup section, showing the destination location for the ride.
- [ ] A section labelled "NOTED" is rendered below the drop-off section if and only if a rider note is present on the ride; the section is fully omitted when no note exists (no empty placeholder).
- [ ] A section labelled "TRIP FARE" is rendered below the address sections and contains, as distinct line items, the base fare, the distance fare, and the time fare from the ride's fare data.
- [ ] The TRIP FARE section ends with a visually distinct line labelled "Amount Paid" that shows the total fare in XOF.
- [ ] All monetary values displayed in the receipt are shown in XOF with thousands-separator formatting consistent with the ride history screen.
- [ ] When a field required by a section is missing from the ride data, the section either renders a safe empty representation or is omitted without crashing.

**Dependencies:** Consumes the shared `Ride` type (`driverInfo`, `pickup`, `destination`, `fare.baseFare`, `fare.distanceFare`, `fare.timeFare`, `fare.total`, `fare.currency`, `route`).

### R2: Standalone and Shareable Design
**Description:** The component is a pure presentational unit that can be embedded in any host screen without modification.
**Acceptance Criteria:**
- [ ] The component accepts ride data through its props and does not read from any global store to obtain that ride data.
- [ ] The component does not trigger any navigation action (no route changes, no screen dismissals).
- [ ] The component does not perform any network or backend calls.
- [ ] The component can be rendered on the post-ride screen, on a ride history detail view, and on a hypothetical driver-app summary screen without any code change to the component itself.
- [ ] The component exposes no side effects beyond the PDF stub interaction described in R3.

**Dependencies:** None.

### R3: PDF Download Stub
**Description:** A "Download PDF" text link is visible on the receipt, but actual PDF generation is deferred; tapping the link communicates that the capability is not yet available.
**Acceptance Criteria:**
- [ ] A text link with the label "Download PDF" (localised to French and English) is rendered on the receipt.
- [ ] Tapping the link shows a transient "coming soon" message to the user.
- [ ] Tapping the link does not produce any file, does not open a browser, and does not make any network call.
- [ ] The link is never a dead tap: a visible feedback is always shown when tapped.

**Dependencies:** None.

### R4: Torn-Edge Paper Visual Treatment
**Description:** The receipt visually reads as a paper receipt via a scalloped or perforated edge treatment on its top and/or bottom edge.
**Acceptance Criteria:**
- [ ] The top edge, the bottom edge, or both edges of the receipt card display a scalloped, perforated, or torn visual treatment that is clearly distinct from a straight edge.
- [ ] The torn-edge treatment is part of the receipt's visible boundary (not a separate decoration floating away from the card).
- [ ] The torn-edge treatment renders correctly at the device widths supported by the rest of the client app.
- [ ] The torn-edge treatment is consistent whether the receipt is rendered on the post-ride screen or on the ride history screen.

**Dependencies:** None.

## Out of Scope
- Actual PDF generation, file export, or server-rendered receipt URLs.
- Any backend API call from the component (including fetching the ride itself — ride data must arrive as props).
- Navigation logic, route wiring, or screen lifecycle (owned by the host flow — see `cavekit-post-ride-rating.md`).
- Dispute or refund flows, chargeback buttons, support contact CTAs on the receipt.
- Tipping UI.
- Driver-to-client rating or any rating UI on the receipt itself (owned by `cavekit-post-ride-rating.md`).
- Dark mode theming.
- Push notification triggers associated with receipt display.

## Cross-References
- See also: `cavekit-post-ride-rating.md` — Hosts this component on the post-ride screen and gates the rating modal that overlays it.
