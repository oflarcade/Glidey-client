# Demo: MapView Zoom on User + Driver Pins (Alive)

## Goal
For the demo: when the map zooms on the user position, show driver pins that look "alive" (subtle movement).

## Current Behaviour
- **Zoom on user**: `useLocationService({ autoCenter: true })` centers the map on first location fix; the locate FAB calls `centerOnUser(cameraRef)` to fly to user at `USER_ZOOM`.
- **Driver pins**: `DriverMarkers` renders when `visible={isLocationReady && nearbyDrivers.length > 0}`. Pins use a static SVG icon (`driver-pin.svg`) inside `MarkerView`.

## Plan

### 1. Zoom on user (no change)
- Keep existing: auto-center on first fix + locate FAB → `centerOnUser(cameraRef)`.
- Ensures demo flow: user opens map → map zooms to user → drivers in view.

### 2. Show driver pins (no change)
- Keep `DriverMarkers` visibility: `isLocationReady && nearbyDrivers.length > 0`.
- Drivers come from `useNearbyDrivers` (real or mock API). For demo with no backend, consider adding mock drivers in app when `nearbyDrivers.length === 0` (optional follow-up).

### 3. Driver pins “alive” (implement)
- Add a **looping subtle animation** to each driver pin so they feel alive (moving a bit).
- **Approach**: Use React Native `Animated` with `useNativeDriver: true`:
  - **Scale pulse**: scale 1 → 1.06 → 1 on a ~1.5s loop (subtle “breathing”).
  - Optionally a tiny **vertical bob** (e.g. translateY 0 → 3 → 0) for a gentle float.
- **Where**: In `components/DriverMarkers.tsx`, wrap the pin content (e.g. `DriverPinIcon`) in an `Animated.View` and run a looping animation in `useEffect`.
- **Respect reduced motion**: Use `AccessibilityInfo.isReduceMotionEnabled()` and skip or reduce animation when enabled (match `DestinationPin` / `UserPositionPin`).

## Implementation Checklist
- [x] Plan documented
- [x] Add looping scale + vertical bob animation to `DriverMarker` in `DriverMarkers.tsx`
- [x] Use native driver; respect reduce motion
- [x] No change to zoom or visibility logic unless demo mock drivers are added later
