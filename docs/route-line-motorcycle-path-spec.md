# Route Line: Motorcycle / Scooter Path (Not Straight Line)

## Current behavior

The map draws a **strict straight line** between user location and selected destination (two points only):

```ts
// app/(main)/index.tsx
coordinates: [
  [location.longitude, location.latitude],
  [selectedDestination.longitude, selectedDestination.latitude],
]
```

Goal: draw a **road-following path** suitable for motorcycle/scooter (not a straight line).

---

## Backend route (contract) — implemented

**Callable:** `getRouteDirections` (Firebase callable).

1. **Accepts** `{ pickup: Location, destination: Location }` (same shape as createRide).
2. **Calls** Mapbox Directions API with **full geometry** (`geometries=geojson`, `overview=full`).
3. **Returns** the route so the client doesn’t need a Mapbox token or direct Directions calls:
   - **distanceMeters** (number)
   - **durationSeconds** (number)
   - **geometry** – GeoJSON LineString (`type: 'LineString'`, `coordinates: [[lng, lat], ...]`) for drawing the route
   - **polyline** – left empty when using GeoJSON (client uses geometry)

Auth (callable requires logged-in user), `validateLocation` for pickup/destination, and rate limiting (e.g. 30/min) are applied. Mapbox token is read from Firebase config (e.g. `mapbox.access_token`).

**Client usage:** `getRouteDirections({ pickup, destination })` → use `data.geometry.coordinates` for the map line; `data.distanceMeters`, `data.durationSeconds` for fare/ETA.

---

## Mapbox: how to get a road path

- Mapbox **Directions API v5** does **not** have a dedicated motorcycle profile.
- Supported profiles: `mapbox/driving-traffic`, `mapbox/driving`, `mapbox/walking`, `mapbox/cycling`.
- For motorcycle/scooter, use:
  - **`mapbox/driving`** – fastest, prefers high-speed roads (closest to “motorcycle”).
  - **`mapbox/cycling`** – shorter, avoids highways, prefers bike-friendly streets (good for scooters in cities).

To get a drawable path you must call the Directions API and use the **route geometry** (sequence of coordinates along the road), not just origin and destination.

- Endpoint: `GET https://api.mapbox.com/directions/v5/{profile}/{coordinates}`
- Coordinates: semicolon-separated `{longitude},{latitude}` (e.g. `13.43,52.51;13.42,52.50`).
- Request **full geometry** so the client can draw the path:
  - `geometries=geojson` → returns a GeoJSON **LineString**.
  - `overview=full` → most detailed geometry.

Example:

```http
GET https://api.mapbox.com/directions/v5/mapbox/driving/{lng1},{lat1};{lng2},{lat2}?geometries=geojson&overview=full&access_token=TOKEN
```

Response (simplified): each route has a `geometry` object (GeoJSON LineString):

```json
{
  "routes": [
    {
      "geometry": {
        "type": "LineString",
        "coordinates": [[lng1, lat1], [lng2, lat2], ...]
      },
      "duration": 123.4,
      "distance": 567.8
    }
  ]
}
```

The client needs the **`coordinates`** array of that LineString to draw the route line (same format as the current `ShapeSource` + `LineLayer`).

---

## What the backend (BE) should provide — for Mark

Implements the [Backend route (contract)](#backend-route-contract) above.

- **Input:** pickup and destination (e.g. `{ longitude, latitude }` each).
- **Implementation:**
  - Call Mapbox Directions API with pickup and destination as semicolon-separated coordinates.
  - Use profile `mapbox/driving` (or `mapbox/cycling` for scooter-style); keep Mapbox token on the server.
  - Request full geometry: `geometries=geojson` and/or `overview=full`.
- **Response:** return **distance**, **duration**, and **geometry** so the client doesn’t need a Mapbox token or direct Directions calls.

**Response shape (recommended):**

```json
{
  "distance": 567.8,
  "duration": 123.4,
  "geometry": {
    "type": "LineString",
    "coordinates": [[lng1, lat1], [lng2, lat2], ...]
  }
}
```

- `distance`: meters.
- `duration`: seconds.
- `geometry`: GeoJSON LineString; client uses `geometry.coordinates` for the route line (same format as `ShapeSource` + `LineLayer`).

Alternative: return a flatter shape, e.g. `{ distance, duration, coordinates }` where `coordinates` is the LineString coordinates array; client then uses `coordinates` directly.

---

## What the client (mobile) should do — for Omar

1. **When to request the route**  
   When both `location` and `selectedDestination` are set, instead of drawing a straight line, call the BE route endpoint (callable or HTTP) with **pickup** = user location and **destination** = selected destination.

2. **Use the returned geometry**  
   Replace the current two-point `coordinates` with the route geometry from BE. Use `response.geometry.coordinates` (or `response.coordinates` if BE returns a flat shape). Keep the same `ShapeSource` + `LineLayer`; only the coordinates array changes from 2 points to N points along the road.

3. **Loading and errors**  
   - Show a loading state while the route request is in progress (e.g. dimmed or dashed line, or no line until loaded).  
   - On failure (no route, network error): fall back to the current straight line or show a message, depending on product preference.

4. **Optional**  
   - Use `duration` / `distance` from the response for ETA or distance in the destination tip or booking flow.

---

## Summary

| Topic | Detail |
|--------|--------|
| **Backend route** | Callable or HTTP: accepts pickup + destination; calls Mapbox with full geometry; returns **distance**, **duration**, **geometry**. Client needs no Mapbox token. |
| **Mapbox motorcycle profile** | None. Use `mapbox/driving` or `mapbox/cycling`. |
| **How to get road path** | BE calls Mapbox Directions with `geometries=geojson` and/or `overview=full`; returns route geometry to client. |
| **Client uses** | Same `ShapeSource` + `LineLayer`; feed `geometry.coordinates` (or `coordinates`) from BE instead of a two-point straight line. |

This gives you a motorcycle/scooter-style path (following roads) instead of a strict straight line, with BE owning the Mapbox token and profile choice (driving vs cycling).
