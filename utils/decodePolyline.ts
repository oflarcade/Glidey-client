/**
 * Decode Google/Mapbox encoded polyline to coordinate array.
 * Encoded polyline uses delta encoding; output is [lat, lng] per point.
 * For GeoJSON/Mapbox we use [lng, lat], so callers should map to [lng, lat].
 *
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */

const PRECISION = 5;
const PRECISION_FACTOR = 10 ** PRECISION;

/**
 * Decode an encoded polyline string into an array of [lat, lng] coordinates.
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded || typeof encoded !== 'string') return [];

  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coords.push([lat / PRECISION_FACTOR, lng / PRECISION_FACTOR]);
  }

  return coords;
}

/**
 * Decode polyline and return coordinates in GeoJSON order [lng, lat] for Mapbox.
 */
export function decodePolylineToLngLat(encoded: string): [number, number][] {
  return decodePolyline(encoded).map(([lat, lng]) => [lng, lat]);
}
