# Synthesis: Unified Booking Modal

## Recommended Features (top 3)

1. **Single `sheetMode` atom in `useUIStore`** (ENG-2, ICE 9.0) — Replace `locationModalOpen` + `activeBottomSheet` booleans with `sheetMode: 'idle' | 'search' | 'booking' | 'matching'`. Eliminates the race condition where both flags are briefly inconsistent during the dismiss/reopen cycle. This is the prerequisite for everything else.

2. **Destination row tap → keyboard-first inline search** (UX-2, ICE 8.7) — Tapping the destination row in mini/peek snaps the sheet to full and gives focus to the search `TextInput` in a single frame (~200 ms). No modal stack, no white flash. The defining micro-interaction of the feature.

3. **Fare pre-fetch on destination commit, not on booking mode mount** (ENG-3, ICE 8.3) — Fire `estimateFare()` the moment the user selects a destination so the fare resolves during the search→booking animation. Booking mode opens with price already populated — no spinner ever visible.

## Key Risks to Address in Spec

| Risk | Confidence | Must become acceptance criterion |
|------|-----------|----------------------------------|
| Discoverability: users may not tap the destination row to enter search (no explicit affordance) | LOW | Spec must require a visible tap target / chevron on the destination row, not just a pressable area |
| Keyboard + snap point collision: keyboard dismiss at full-search snap — which snap to return to? | MEDIUM | Spec must define the keyboard-dismiss snap behavior (return to peek, not mini) |
| God component: unified sheet may become unmaintainable if both location search and fare state are inlined | MEDIUM | Spec must enforce sub-component decomposition: `SearchModeContent` and `BookingModeContent` as separate exported components |
| Low-end Android animation degradation during mode transition | MEDIUM | Spec must require the mode transition to complete in ≤ 16 ms per frame on a mid-range Android device |

## Constraints

- **Runtime:** Expo SDK 54, Reanimated 4.x, RNGH v2, `@rentascooter/shared` Zustand stores
- **Platform:** Must function on low-end Android (entry-tier Dakar devices); performance budget matters
- **No new navigation:** All transitions must stay within the existing route stack; no new route files
- **Preserve existing gestures:** Horizontal carousel scroll inside the sheet must remain non-dismissible (existing R2 gesture arbitration must be retained)
- **Backward compat:** `useBooking`, `useMatching`, `useLocationHistory`, `useAutocompleteLocation` hooks are unchanged; only their mounting point moves

## Suggested Domain Decomposition

Two existing domains need extending — no new kit file needed:

| Proposed change | Kit to EXTEND |
|-----------------|--------------|
| 3 snap points (add mini), unified search/booking modes, destination row becomes interactive, `sheetMode` state atom | `cavekit-booking-sheet-ux.md` — Add R10 (unified mode machine), update R2 (3 snap points), update R3 (interactive destination row) |
| LocationModal retired as standalone overlay; its content migrates into the unified sheet's search mode | `cavekit-location-search.md` — Update R7 (LocationModal becomes search-mode sub-component of the unified sheet) |

## Success Criteria Candidates

- Tapping the destination row from mini/peek state opens the search input inline within ≤ 200 ms (no new modal, no route push)
- The animated mode transition (search → booking) completes in ≤ 16 ms per frame on Android mid-range
- A full-codebase search finds zero references to `LocationModal` being mounted as a standalone overlay (all search-mode entry points go through the unified sheet)
- `useUIStore` has no `locationModalOpen` field; all sheet-state reads use `sheetMode`
- Booking mode opens with fare already resolved (no loading state visible) when the estimated route has `distanceM > 0`
