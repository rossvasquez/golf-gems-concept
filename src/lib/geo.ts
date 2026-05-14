import type { Position } from "geojson"

import type {
  CourseFeature,
  CourseFeatureCollection,
  CourseRecord,
  CourseStep,
  LngLatTuple,
} from "@/types/geo"

export function courseIdFromProperties(properties: {
  name: string
  order: number
}) {
  return `${properties.order}-${properties.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`
}

function coordinateRings(feature: CourseFeature): Position[][] {
  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates
  }

  return feature.geometry.coordinates.flat()
}

export function firstCoordinate(feature: CourseFeature): LngLatTuple {
  const [lng, lat] = coordinateRings(feature)[0][0]

  return [lng, lat]
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

export function toCourseRecord(feature: CourseFeature): CourseRecord {
  return {
    id: courseIdFromProperties(feature.properties),
    type: "Feature",
    properties: feature.properties,
    geometry: feature.geometry,
    order: feature.properties.order,
    name: feature.properties.name,
  }
}

export function recordToCourseFeature(record: CourseRecord): CourseFeature {
  return {
    type: "Feature",
    properties: record.properties,
    geometry: record.geometry,
  }
}

export function toCourseStep(feature: CourseFeature): CourseStep {
  const bounds = computeBounds(feature)

  return {
    id: courseIdFromProperties(feature.properties),
    feature,
    properties: feature.properties,
    bounds,
    center: computeCenter(bounds),
  }
}

export function collectionToCourseRecords(
  collection: CourseFeatureCollection,
): CourseRecord[] {
  return collection.features
    .slice()
    .sort((a, b) => a.properties.order - b.properties.order)
    .map(toCourseRecord)
}

export function recordsToFeatureCollection(
  records: CourseRecord[],
): CourseFeatureCollection {
  return {
    type: "FeatureCollection",
    features: records
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(recordToCourseFeature),
  }
}

export function featuresToCourseSteps(features: CourseFeature[]): CourseStep[] {
  return features
    .slice()
    .sort((a, b) => a.properties.order - b.properties.order)
    .map(toCourseStep)
}

export function recordsToCourseSteps(records: CourseRecord[]): CourseStep[] {
  return recordsToFeatureCollection(records).features.map(toCourseStep)
}
