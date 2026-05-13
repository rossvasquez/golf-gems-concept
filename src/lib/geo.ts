import dummyGeo from "@/data/dummy-geo.json"
import type { Position } from "geojson"

import type {
  CourseFeature,
  CourseFeatureCollection,
  CourseStep,
  LngLatTuple,
} from "@/types/geo"

function coordinateRings(feature: CourseFeature): Position[][] {
  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates
  }

  return feature.geometry.coordinates.flat()
}

function computeBounds(feature: CourseFeature): [LngLatTuple, LngLatTuple] {
  const positions = coordinateRings(feature).flat()
  const lngs = positions.map(([lng]) => lng)
  const lats = positions.map(([, lat]) => lat)

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

function computeCenter(bounds: [LngLatTuple, LngLatTuple]): LngLatTuple {
  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ]
}

function toCourseStep(feature: CourseFeature): CourseStep {
  const bounds = computeBounds(feature)

  return {
    id: `${feature.properties.rank}-${feature.properties.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`,
    feature,
    properties: feature.properties,
    bounds,
    center: computeCenter(bounds),
  }
}

export function getCourseSteps(): CourseStep[] {
  const collection = dummyGeo as CourseFeatureCollection

  return collection.features
    .slice()
    .sort((a, b) => a.properties.rank - b.properties.rank)
    .map(toCourseStep)
}
