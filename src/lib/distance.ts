import type { LngLatTuple } from "@/types/geo"

const EARTH_RADIUS_MILES = 3_958.8

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function haversineMiles(from: LngLatTuple, to: LngLatTuple) {
  const [fromLng, fromLat] = from
  const [toLng, toLat] = to
  const deltaLat = toRadians(toLat - fromLat)
  const deltaLng = toRadians(toLng - fromLng)
  const lat1 = toRadians(fromLat)
  const lat2 = toRadians(toLat)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_MILES * c
}
