import { describe, expect, it } from "vitest"

import dummyGeo from "@/data/dummy-geo.json"
import {
  courseFeatureSchema,
  coursePropertiesSchema,
  importGeoJsonToRecords,
  parseCourseFeatureCollection,
  recordsToGeoJson,
} from "@/lib/geo-schema"
import { recordsToCourseSteps } from "@/lib/geo"

describe("geo schema service", () => {
  it("validates the bundled dummy GeoJSON", () => {
    const collection = parseCourseFeatureCollection(dummyGeo)
    const records = importGeoJsonToRecords(collection)

    expect(records).toHaveLength(3)
    expect(records[0].id).toBe("1-kiawah-island-ocean-course")
  })

  it("rejects imports with missing properties", () => {
    const input = structuredClone(dummyGeo)
    delete (input.features[0].properties as Partial<Record<string, unknown>>)
      .designer

    expect(() => parseCourseFeatureCollection(input)).toThrow(
      /Invalid course GeoJSON import.*properties/,
    )
  })

  it("rejects unsupported geometry types", () => {
    const input = structuredClone(dummyGeo)
    input.features[0].geometry = {
      type: "Point",
      coordinates: [-80.0437563, 32.6108089],
    } as never

    expect(() => parseCourseFeatureCollection(input)).toThrow(
      /Invalid course GeoJSON import.*geometry/,
    )
  })

  it("rejects invalid coordinates", () => {
    const input = structuredClone(dummyGeo)
    input.features[0].geometry.coordinates[0][0] = [-181, 32.6108089]

    expect(() => parseCourseFeatureCollection(input)).toThrow(
      /Invalid course GeoJSON import.*coordinates/,
    )
  })

  it("validates future form property payloads", () => {
    expect(
      coursePropertiesSchema.safeParse({
        name: "Test Course",
        designer: "Designer",
        description: "Description",
        ross_comments: "Commentary",
        par: 72,
        yardage: 7000,
        slope_rating: 140,
        course_rating: 74.2,
        link_out: "https://example.com/course",
        order: 4,
      }).success,
    ).toBe(true)

    expect(
      coursePropertiesSchema.safeParse({
        ...dummyGeo.features[0].properties,
        link_out: "not-a-url",
      }).success,
    ).toBe(false)
  })

  it("rejects form feature payloads without geometry", () => {
    expect(
      courseFeatureSchema.safeParse({
        type: "Feature",
        properties: dummyGeo.features[0].properties,
      }).success,
    ).toBe(false)
  })

  it("round-trips records back to GeoJSON and course steps", () => {
    const records = importGeoJsonToRecords(dummyGeo)
    const collection = recordsToGeoJson(records)
    const steps = recordsToCourseSteps(records)

    expect(collection.type).toBe("FeatureCollection")
    expect(collection.features).toHaveLength(records.length)
    expect(steps.map((step) => step.properties.order)).toEqual([1, 2, 3])
    expect(steps[0].bounds[0][0]).toBeLessThan(steps[0].bounds[1][0])
  })

  it("normalizes legacy imported rank values to order", () => {
    const input = structuredClone(dummyGeo)

    input.features[0].properties = {
      ...input.features[0].properties,
      rank: 1,
    } as never
    delete (input.features[0].properties as Partial<Record<string, unknown>>)
      .order

    const [record] = importGeoJsonToRecords(input)

    expect(record.order).toBe(1)
    expect(record.properties.order).toBe(1)
  })
})
