# UX Specification: Unified Booking Modal
**Component:** `UnifiedBookingSheet`
**Replaces:** `LocationModal` + `BookingSheet`
**Status:** Draft
**Date:** 2026-04-20
**Author:** Designer (oh-my-claudecode)

---

## 0. Design Tokens (reference)

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#FFC629` | Book Now CTA, active states |
| `dark` | `#1A1A2E` | Sheet background, primary text |
| `white` | `#FFFFFF` | Text on dark, card backgrounds |
| `border-radius` | `12px` | Buttons, cards, input |
| `font` | Poppins | All text in the sheet |
| `handle-color` | `#E0E0E0` | Drag pill |
| `chevron-color` | `#666666` | Trailing affordance icon |
| `error-red` | `#E53E3E` | Fare error, cancel link |
| `payment-grey` | `#A0A0A0` | Payment placeholder text |

Sheet heights (from bottom of screen, excluding safe-area inset):

| Snap | Height | Purpose |
|------|--------|---------|
| mini | 155 px | Collapsed summary bar |
| peek | 330 px | Carousel + CTA visible |
| full | 580 px | Search input or full booking detail |

---

## 1. State Machine

### 1.1 Mode × Snap Point Matrix

```
                ┌─────────┬─────────┬──────────┐
                │  mini   │  peek   │   full   │
 ───────────────┼─────────┼─────────┼──────────┤
  idle          │    ●    │         │          │
 ───────────────┼─────────┼─────────┼──────────┤
  search        │         │         │    ●     │
 ───────────────┼─────────┼─────────┼──────────┤
  booking       │    ●    │    ●    │    ●     │
 ───────────────┼─────────┼─────────┼──────────┤
  matching      │    ●    │    ●    │    ●     │
 └──────────────┴─────────┴─────────┴──────────┘

  ● = valid state
```

**Invalid combinations (never enter):**
- `idle` at peek or full
- `search` at mini or peek (keyboard requires full height)

### 1.2 Transition Table

```
FROM                    TO                      TRIGGER
────────────────────────────────────────────────────────────────────────
idle / mini             search / full           Tap destination row in mini bar
                                                — or — programmatic open (app launch)

search / full           booking / peek          User selects a destination from
                                                history list or autocomplete results

booking / peek          search / full           User taps destination row
                                                (chevron › affordance)

booking / mini          search / full           User taps mini destination row

booking / peek          booking / full          Pan gesture up past threshold
                                                (velocityY < -150 or translationY < -60)

booking / full          booking / peek          Pan gesture down past threshold
                                                (velocityY > 150 or translationY > 60)

booking / peek          booking / mini          Pan gesture down from peek

booking / any           matching / same-snap    User taps "Réserver maintenant" CTA

matching / any          booking / peek          System event: search cancelled
                                                — or — user taps "Annuler la recherche"

matching / any          [DriverReveal overlay]  System event: driver matched
                                                (rideState === 'matched')

search / full           idle / mini             User dismisses keyboard + drags below
                                                mini snap threshold (fast downward flick:
                                                velocityY > 800)

booking / any           booking / any           Dismiss gesture BLOCKED — requires
                                                explicit Cancel or navigation action
```

### 1.3 Keyboard-dismiss snap rule

When the user dismisses the keyboard while in `search / full` mode **without** selecting a destination:
- If a destination is already set → transition to `booking / peek`
- If no destination is set → remain at `search / full` (results stay visible; do not collapse)

Rationale: collapsing to mini when no destination is set leaves the user stuck. Staying at full lets them re-type or pick from history.

---

## 2. Per-mode Layout Specifications

### 2.1 Sheet Chrome (all modes)

```
┌─────────────────────────────────────────┐  ← sheet top edge
│            ▬▬▬▬▬                        │  handle bar: 36×4 px, #E0E0E0,
│                                         │  centered, 10 px from top
│  [mode content area — see below]        │
│                                         │
│  [safe-area padding bottom]             │
└─────────────────────────────────────────┘
```

- Sheet: `position: absolute`, bottom-anchored, `borderTopLeftRadius: 20`, `borderTopRightRadius: 20`
- Elevation: Android `elevation: 16`, iOS `shadowOpacity: 0.12`
- Background: `colors.background.primary` (white in light mode)
- Handle bar: `width: 36, height: 4, borderRadius: 2, backgroundColor: #E0E0E0`
- Handle zone height: 28 px (handle pill + padding), always rendered, always draggable

---

### 2.2 Search Mode — full snap only

**Trigger:** destination row tapped from any booking snap, or app opens with no destination.
**Keyboard:** opens immediately on mode entry (programmatic focus, ~1 frame delay).

```
┌─────────────────────────────────────────┐  580 px from bottom
│            ▬▬▬▬▬                        │  handle (not draggable while keyboard up)
│                                         │
│  ┌─────────────────────────────────┐    │  ← SearchInput row: full width,
│  │ 🔍  Où allez-vous ?           ✕ │    │    borderRadius: 12, height: 48
│  └─────────────────────────────────┘    │    active: border #FFC629 1px
│                                         │
│  [RESULTS AREA — scrollable]            │
│                                         │
│  ─── EMPTY STATE (no query typed) ───   │
│                                         │
│  Recherches récentes                    │  section label: caption, #666
│  ┌─────────────────────────────────┐    │
│  │ 🕐  [Recent destination 1]      │    │  LocationHistoryRow: height 52,
│  ├─────────────────────────────────┤    │  hitSlop ensures ≥44 pt tap target
│  │ 🕐  [Recent destination 2]      │    │
│  ├─────────────────────────────────┤    │
│  │ 🕐  [Recent destination 3]      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─── LANDMARK CHIPS (below history) ─── │
│  ┌──────────────┐ ┌──────────────────┐  │
│  │  📍 Plateau  │ │  📍 Almadies    │  │  chip: paddingH 16, paddingV 10,
│  └──────────────┘ └──────────────────┘  │  borderRadius 20, border #E0E0E0
│                                         │
│  ─── AUTOCOMPLETE STATE (query typed) ──│
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📍  [Result name]               │    │  SearchResultRow: height 52,
│  │     [Result address / subtitle] │    │  two-line layout
│  ├─────────────────────────────────┤    │
│  │ 📍  [Result name]               │    │
│  │     [Result address / subtitle] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [keyboard — 300 px approx]             │  results scroll above keyboard;
└─────────────────────────────────────────┘  KeyboardAvoidingView wraps content
```

**SearchInput anatomy:**
- Left icon: magnifier (`search` from `@rentascooter/ui` Icon)
- Center: active `TextInput`, placeholder "Où allez-vous ?", Poppins Regular 15
- Right: clear (✕) button — appears only when `searchQuery.length > 0`; `hitSlop: 12`; tap clears query and keeps search mode active

**Landmark chips:**
- Two fixed chips: "Plateau" and "Almadies"
- Tap a chip → resolve as a destination exactly like selecting a history item (calls `placeDetail` then transitions to booking mode)
- Chip disappears once a query is typed (replaced by autocomplete results)

**Keyboard-aware layout:**
- Use `KeyboardAvoidingView` with `behavior: 'height'` on Android, `'padding'` on iOS
- Results list `ScrollView` must be bounded above the keyboard so no result row is ever clipped or hidden behind it
- `keyboardShouldPersistTaps: 'handled'` on the results ScrollView

**Search error state:**
- Replaces results list with a single centered message:
  `"Erreur de recherche — vérifier la connexion"`
  Style: `typography.body`, color `#E53E3E`, centered
- No retry button; the user can re-type to retry (query change re-fires the autocomplete hook)

---

### 2.3 Booking Mode — mini snap (155 px)

```
┌─────────────────────────────────────────┐  155 px from bottom
│            ▬▬▬▬▬                        │  handle bar
│                                         │
│  ┌─────────────────────────────────┐    │  destination row — full-width Pressable
│  │ 📍  Almadies Corniche …   1 200 XOF  ›│  hitSlop ensures ≥44 pt
│  └─────────────────────────────────┘    │  (tap → search/full transition)
│                                         │
└─────────────────────────────────────────┘
```

**Destination row (mini):**
- Left: pin icon (`location-pin`, size 20, color `#FFC629`)
- Center: destination name, truncated to 20 chars + ellipsis (`numberOfLines: 1`)
- Right side A: fare chip — lowest available XOF option, `backgroundColor: #F5F5F5`, `borderRadius: 8`, `paddingH: 8`, `paddingV: 4`, `typography.caption`, `color: #1A1A2E`
- Right side B: chevron `›` icon, size 18, color `#666666`
- Full row is a `Pressable` (tap target ≥ 44 pt enforced via `minHeight: 44`)
- `onPress` → transition to `search / full`

**Tap anywhere on mini bar (not on destination row):**
- If tap lands on the handle zone → pan gesture takes over
- If tap lands anywhere else → sheet expands to `booking / peek` (250 ms spring)

---

### 2.4 Booking Mode — peek snap (330 px)

```
┌─────────────────────────────────────────┐  330 px from bottom
│            ▬▬▬▬▬                        │  handle bar
│                                         │
│  ┌─────────────────────────────────┐    │  destination row — interactive
│  │ 📍  Almadies Corniche           ›│    │  full name (no truncation at peek)
│  └─────────────────────────────────┘    │  tap → search / full
│                                         │
│  ─ vehicle type carousel ─────────────  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  3 cards visible, horizontal scroll
│  │  🛵     │ │  🛺     │ │  🚗     │   │  card: width 110, height 96,
│  │  Moto   │ │ Jakarta │ │Voiture  │   │  borderRadius 12, border 1.5 #E0E0E0
│  │ 800 XOF │ │1 200 XOF│ │2 000 XOF│   │  selected: border #FFC629 2px,
│  └─────────┘ └─────────┘ └─────────┘   │  backgroundColor: #FFFBEE
│                                         │
│  ┌─────────────────────────────────┐    │  Book Now — full width
│  │      Réserver maintenant        │    │  backgroundColor: #FFC629
│  └─────────────────────────────────┘    │  borderRadius: 12, height: 52
│                                         │  disabled: opacity 0.5
│  ┌─────────────────────────────────┐    │  payment row — non-interactive
│  │  Paiement — bientôt disponible ›│    │  color: #A0A0A0, no onPress
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Destination row (peek):**
- Left: pin icon (`location-pin`, size 20, color `#FFC629`)
- Center: full destination name (`numberOfLines: 1`), `typography.body`, `color: colors.text.primary`
- Right: chevron `›`, size 18, color `#666`
- Minimum tap target: `minHeight: 44, paddingVertical: 12`
- `accessibilityLabel`: `"Changer de destination, [destination.name]"`

**Vehicle type carousel:**
- Horizontal `FlatList` or `ScrollView`, `showsHorizontalScrollIndicator: false`
- 3 cards visible by default; 4th partially visible (8 px peeking) to communicate scrollability
- `pagingEnabled: false` — free scroll, snap not required
- Card anatomy: icon (size 32) + type name (`typography.bodySmall`, bold) + XOF price (`typography.caption`, color `#666`)
- Selected card: `borderColor: #FFC629`, `borderWidth: 2`, `backgroundColor: #FFFBEE`
- Unselected card: `borderColor: #E0E0E0`, `borderWidth: 1.5`, `backgroundColor: #FFFFFF`
- Gesture arbitration: horizontal scroll gesture must NOT dismiss the sheet (existing RNGH simultaneous handler must be preserved)

**Book Now button:**
- `backgroundColor: #FFC629`, `borderRadius: 12`, height 52, full width
- Label: "Réserver maintenant", Poppins SemiBold 16, `color: #1A1A2E`
- Disabled state (no vehicle selected, fare loading, or error): `opacity: 0.5`, `disabled: true`
- Busy state (booking in progress): replace label with `ActivityIndicator` (color: `#1A1A2E`)

**Payment row:**
- `flexDirection: row`, `justifyContent: space-between`
- Label: "Paiement — bientôt disponible", `typography.bodySmall`, `color: #A0A0A0`
- Trailing chevron: `›`, size 16, `color: #A0A0A0` (visually present, non-interactive)
- `pointerEvents: 'none'` — do not register taps

**No vehicle types returned state (replaces carousel):**
```
│  ┌─────────────────────────────────┐    │
│  │  Aucun véhicule disponible      │    │  centered text + refresh icon
│  │       [↻ Actualiser]            │    │  tap ↻ re-fires fare estimate fetch
│  └─────────────────────────────────┘    │
```

---

### 2.5 Booking Mode — full snap (580 px)

Same layout as peek snap, with the following additions:

- More vertical whitespace between carousel and Book Now (spacing.lg)
- **Fare error state** appears between carousel and Book Now button if `fareError !== null`:

```
│  ┌─────────────────────────────────┐    │
│  │  ⚠ Estimation indisponible —   │    │  color: #E53E3E
│  │    Appuyez pour réessayer       │    │  typography.bodySmall
│  └─────────────────────────────────┘    │  full-width Pressable, hitSlop: 8
```

- Tap on error text → calls `retryFareEstimate()` (re-fires the `estimateFare` hook)
- `accessibilityLabel`: `"Erreur d'estimation, appuyez pour réessayer"`

---

### 2.6 Matching Mode — any snap

Replaces carousel and Book Now; destination row becomes non-interactive.
Sheet snap point does not change when entering matching mode.

```
┌─────────────────────────────────────────┐
│            ▬▬▬▬▬                        │
│                                         │
│  ┌─────────────────────────────────┐    │  destination row (non-interactive)
│  │ ⟳  Almadies Corniche            │    │  left icon: ActivityIndicator
│  └─────────────────────────────────┘    │  (replaces pin icon, size 20)
│                                         │
│        Recherche d'un conducteur…       │  typography.h3, center-aligned
│                                         │
│  ┌────●─────────────────────────┐       │  RetryTimeline component
│  │  Tentative 1   2   3         │       │  from @rentascooter/ui
│  └──────────────────────────────┘       │
│                                         │
│    Tentative 1 sur 3                    │  attempt label, typography.body,
│                                         │  color: colors.text.secondary
│                                         │
│    Annuler la recherche                 │  inline link, typography.body,
│                                         │  color: #E53E3E, underline
│                                         │  tap → onCancel() callback
└─────────────────────────────────────────┘
```

**Destination row in matching mode:**
- Left icon: `ActivityIndicator` size "small", color `colors.primary.main` — replaces pin icon
- Text: destination name (same truncation rules as current snap level)
- Row is `pointerEvents: 'none'` (not tappable during matching)

**Cancel link:**
- `typography.body`, `color: #E53E3E`, `textDecorationLine: 'underline'`
- Minimum tap target: `paddingVertical: 12, paddingHorizontal: 16`
- `accessibilityLabel`: `"Annuler la recherche de conducteur"`
- Disabled while `isBusy` is true (opacity 0.5, `disabled: true`)

**Fallback state (all 3 attempts exhausted):**
```
│        Aucun conducteur disponible      │  typography.h3
│   Réessayez dans quelques minutes.      │  typography.body, color: secondary
│    Annuler la recherche                 │  same cancel link
```

---

## 3. Transition Animations

All animations use `react-native-reanimated` shared values + `withSpring`. The spring preset used throughout:
```ts
const SPRING = { damping: 14, stiffness: 280, mass: 0.8 };
```

### 3.1 search → booking (destination selected)

**Trigger:** User taps a history item or autocomplete result.

**Sequence:**
1. **t=0 ms:** Haptic — `ImpactFeedbackStyle.Medium`. Keyboard dismissed (`Keyboard.dismiss()`).
2. **t=0 ms:** `sheetMode` transitions to `'booking'`. Sheet content begins cross-fade.
   - Search content: `opacity` animated from 1 → 0 via `withTiming(0, { duration: 120 })`
   - Carousel content: mounted immediately (opacity 0), waits for step 3.
3. **t=120 ms:** Sheet snap animates from full → peek via `withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING)`.
4. **t=180 ms:** Carousel content fades in: `withTiming(1, { duration: 120 })`.

**Total perceived duration:** ~300 ms.

**Frame budget:** The mode transition must complete at ≤ 16 ms per frame on Android mid-range. The content cross-fade must be pure Reanimated (no JS-thread opacity) — use `useAnimatedStyle` for opacity, never `Animated.Value` from React Native core.

### 3.2 booking → search (destination row tap)

**Trigger:** User taps destination row chevron from any booking snap.

**Sequence:**
1. **t=0 ms:** Haptic — `ImpactFeedbackStyle.Light`.
2. **t=0 ms:** Sheet snap animates to full: `withSpring(0, SPRING)`.
   - If already at full: no snap animation.
3. **t=100 ms:** Carousel content fades out: `withTiming(0, { duration: 80 })`.
4. **t=180 ms:** Search content fades in: `withTiming(1, { duration: 80 })`. `TextInput.focus()` called via `searchInputRef.current?.focus()` at this point.

**Total perceived duration:** ~200 ms.

**Note:** `sheetMode` is set to `'search'` at step 2 so the search content is pre-mounted and ready when the sheet reaches full.

### 3.3 mini → peek (tap anywhere on mini bar)

**Trigger:** Tap on mini bar background (not on destination row, which has its own transition).

**Sequence:**
1. **t=0 ms:** Haptic — `ImpactFeedbackStyle.Light`.
2. **t=0 ms:** Sheet snap animates to peek: `withSpring(FULL_HEIGHT - PEEK_HEIGHT, SPRING)`.
   - Spring parameters produce a slight overshoot (~5 px) that settles at peek — this is intentional and communicates physical weight.

**Total perceived duration:** ~250 ms.

### 3.4 booking → matching (Book Now tapped)

**Trigger:** User taps "Réserver maintenant".

**Sequence:**
1. **t=0 ms:** Haptic — `ImpactFeedbackStyle.Medium`. `onBookRide()` called.
2. **t=0 ms:** Carousel + Book Now row: `withTiming(0, { duration: 150 })` (fade out).
3. **t=150 ms:** `sheetMode` transitions to `'matching'`. Matching state content: `withTiming(1, { duration: 150 })` (fade in).

**Snap point:** Unchanged (stays at current snap — mini, peek, or full).
**Total perceived duration:** ~300 ms.

---

## 4. Interactive Affordances

### 4.1 Destination row

| Snap | Tap target | Truncation | Trailing icon | onPress |
|------|-----------|-----------|--------------|---------|
| mini | full row, `minHeight: 44` | 20 chars + `…` | `›` #666, size 18 | search / full |
| peek | full row, `minHeight: 44` | none (full name, 1 line) | `›` #666, size 18 | search / full |
| full | full row, `minHeight: 44` | none | `›` #666, size 18 | search / full |
| matching | non-interactive | none | none (spinner left) | — |

`accessibilityLabel` for all interactive states: `"Changer de destination, [destination.name ?? destination.address]"`
`accessibilityRole: 'button'`

### 4.2 Handle bar

- Visual: centered pill, `width: 36, height: 4, borderRadius: 2, backgroundColor: #E0E0E0`
- Position: 10 px from sheet top edge, centered horizontally
- The handle zone extends to 28 px height and is the primary `Gesture.Pan()` target
- The handle bar itself is not a button — panning is the only interaction

### 4.3 Dismiss gesture

| Mode | Dismiss via drag? | Behavior |
|------|--------------------|----------|
| idle | Yes | Drag below mini snap → dismiss |
| search | Yes | Fast downward flick (velocityY > 800) below mini → dismiss; slow drag → stays at mini |
| booking | No | Drag blocked at mini snap; no dismiss. Requires explicit cancel action (not available in booking mode; use destination clear if needed) |
| matching | No | Drag blocked; only "Annuler" link dismisses matching state |

**Implementation note:** In booking and matching modes, the pan gesture `onEnd` handler should clamp to `FULL_HEIGHT - MINI_HEIGHT` minimum (never goes fully off-screen).

### 4.4 Haptics summary

| Interaction | Haptic style |
|-------------|-------------|
| Destination selected (search → booking) | `ImpactFeedbackStyle.Medium` |
| Destination row tap (booking → search) | `ImpactFeedbackStyle.Light` |
| Any snap change via pan gesture | `ImpactFeedbackStyle.Light` |
| Book Now tap (booking → matching) | `ImpactFeedbackStyle.Medium` |
| Landmark chip tap | `ImpactFeedbackStyle.Light` |

---

## 5. Failure States

### 5.1 Fare estimate error

**When:** `fareError !== null` and `isFareLoading === false`.
**Where:** Between carousel area and Book Now button (booking / full snap). At peek snap, error is shown in place of carousel with a compact single-line format.

```
⚠  Estimation indisponible — Appuyez pour réessayer
```

- Color: `#E53E3E`
- Font: `typography.bodySmall` (Poppins Regular 13)
- Icon: `⚠` inline, or `Icon name="warning"` from `@rentascooter/ui` at size 14
- Entire line is a `Pressable` (tap → `retryFareEstimate()`)
- `hitSlop: { top: 8, bottom: 8, left: 8, right: 8 }`
- Book Now button remains visible but disabled (`opacity: 0.5`, `disabled: true`) while error is shown

### 5.2 No vehicle types returned

**When:** `fareEstimates` resolves successfully but returns an empty array.
**Where:** Carousel area in booking mode (any snap).

```
┌─────────────────────────────────────────┐
│     Aucun véhicule disponible           │  typography.body, color: secondary, centered
│                                         │
│            [ ↻ Actualiser ]             │  Button variant="ghost", small, centered
└─────────────────────────────────────────┘
```

- "Actualiser" tap → re-fires fare estimate fetch (calls `refetchFareEstimate()`)
- Book Now button hidden (not just disabled) while this state is active

### 5.3 Search error

**When:** `searchError !== null` from `useAutocompleteLocation` hook.
**Where:** Replaces the results list in search mode.

```
Erreur de recherche — vérifier la connexion
```

- Color: `#E53E3E`
- Font: `typography.body`
- Centered vertically in the results area
- No explicit retry button — re-typing the query re-fires the hook automatically

### 5.4 History load error / empty history

**When:** `historyError !== null` or `previousLocations.length === 0` and no query typed.
**Where:** In search mode, below the search input.

- If error: show `"Erreur de chargement de l'historique"` in `typography.bodySmall`, `color: #A0A0A0`
- If empty (no history yet): show only the landmark chips (Plateau, Almadies) with no section header

---

## 6. Accessibility Notes

### 6.1 Minimum tap targets

All interactive elements must meet the 44×44 pt minimum:

| Element | Enforcement |
|---------|------------|
| Destination row (all snaps) | `minHeight: 44` |
| History list rows | Row height 52 px — naturally compliant |
| Autocomplete result rows | Row height 52 px — naturally compliant |
| Clear (✕) button | `hitSlop: 12` all sides; intrinsic size 28 px → effective 52 px |
| Landmark chips | `paddingVertical: 10` — effective height ≥ 44 pt |
| Cancel link (matching) | `paddingVertical: 12, paddingHorizontal: 16` |
| Fare retry text | `hitSlop: 8` all sides |

### 6.2 Focus management

- On `search` mode entry: `searchInputRef.current?.focus()` called programmatically
  - Android: call after `InteractionManager.runAfterInteractions()` to avoid focus race with sheet animation
  - Delay: ≤ 200 ms from mode transition trigger to keyboard appearance
- On `booking` mode entry (from search): `Keyboard.dismiss()` — no explicit focus needed
- On `matching` mode entry: no focus change; keyboard should already be dismissed

### 6.3 Screen reader labels

| Element | `accessibilityLabel` | `accessibilityRole` |
|---------|---------------------|---------------------|
| Destination row | `"Changer de destination, [name]"` | `'button'` |
| Clear input (✕) | `"Effacer la recherche"` | `'button'` |
| Vehicle type card | `"[name], [price] XOF, [selected/non-selected]"` | `'button'` |
| Book Now button | `"Réserver maintenant"` | `'button'` |
| Cancel (matching) | `"Annuler la recherche de conducteur"` | `'button'` |
| Fare retry | `"Erreur d'estimation, appuyez pour réessayer"` | `'button'` |
| Landmark chip | `"Sélectionner [name] comme destination"` | `'button'` |
| Handle bar | `accessibilityElementsHidden: true` | — |

### 6.4 Reduced motion

Check `AccessibilityInfo.isReduceMotionEnabled()` on mount. If true:
- Replace all `withSpring` calls with `withTiming(value, { duration: 0 })`
- Replace opacity cross-fades with instant swaps (`duration: 0`)
- Haptics: unchanged (vibration is not a motion concern)

---

## 7. Component Decomposition

The unified sheet must be split into three exported components to avoid a god component:

```
UnifiedBookingSheet          ← orchestrator: state machine, snap logic, gesture handler
├── SearchModeContent        ← search input, history list, autocomplete, landmark chips
└── BookingModeContent       ← destination row, carousel, Book Now, payment row
    └── MatchingModeContent  ← retry timeline, cancel link (renders inside BookingModeContent area)
```

**Boundary rule:** `SearchModeContent` and `BookingModeContent` must be independently importable and testable. Neither component reads `sheetMode` — they only receive props. The mode × snap logic lives exclusively in `UnifiedBookingSheet`.

---

## 8. Open Issues / Acceptance Criteria Dependencies

| # | Issue | Owner | Blocker? |
|---|-------|-------|---------|
| 1 | Keyboard-dismiss snap (return to peek vs mini) — spec says peek; verify with PM if mini is acceptable for returning users who just want to collapse | PM | No |
| 2 | Landmark chip `placeId` — Plateau and Almadies need stable Mapbox place IDs defined in a constants file | ENG | Yes — needed before landmark chips can resolve |
| 3 | Fare pre-fetch timing — `estimateFare()` must be called on destination commit, not on booking mode mount. This is a hook change, not a UI change | ENG | Yes — booking mode must open with fare resolved |
| 4 | Gesture arbitration test — horizontal carousel scroll must not trigger vertical sheet dismiss on low-end Android (RNGH simultaneous gesture config) | ENG | Yes |
| 5 | `sheetMode` atom in `useUIStore` — replaces `locationModalOpen` + `activeBottomSheet`; no UI work starts until this is merged | ENG | Yes |
