import * as z from "zod"

import {
  collectionToCourseRecords,
  recordsToFeatureCollection,
} from "@/lib/geo"
import type {
  CourseFeatureCollection,
  CourseRecord,
  CourseProperties,
} from "@/types/geo"

const coordinateSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
])

const linearRingSchema = z
  .array(coordinateSchema)
  .min(4)
  .refine(
    (ring) => {
      const first = ring[0]
      const last = ring[ring.length - 1]

      return first[0] === last[0] && first[1] === last[1]
    },
    { message: "Polygon linear rings must be closed." },
  )

const polygonGeometrySchema = z
  .object({
    type: z.literal("Polygon"),
    coordinates: z.array(linearRingSchema).min(1),
  })
  .strict()

const multiPolygonGeometrySchema = z
  .object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(z.array(linearRingSchema).min(1)).min(1),
  })
  .strict()

export const courseGeometrySchema = z.discriminatedUnion("type", [
  polygonGeometrySchema,
  multiPolygonGeometrySchema,
])

export const coursePropertiesSchema = z
  .object({
    name: z.string().trim().min(1),
    designer: z.string().trim().min(1),
    description: z.string().trim().min(1),
    personal_anecdote: z.string().trim().min(1),
    par: z.number().int().positive(),
    yardage: z.number().int().positive(),
    slope_rating: z.number().int().positive(),
    course_rating: z.number().positive(),
    link_out: z.string().url(),
    order: z.number().int().positive(),
  })
  .strict()

const legacyCoursePropertiesSchema = coursePropertiesSchema
  .omit({ order: true })
  .extend({
    rank: z.number().int().positive(),
  })
  .transform(({ rank, ...properties }) => ({
    ...properties,
    order: rank,
  }))

const legacyAnecdoteCoursePropertiesSchema = coursePropertiesSchema
  .omit({ personal_anecdote: true })
  .extend({
    ross_comments: z.string().trim().min(1),
  })
  .transform(({ ross_comments, ...properties }) => ({
    ...properties,
    personal_anecdote: ross_comments,
  }))

const legacyRankAndAnecdoteCoursePropertiesSchema = coursePropertiesSchema
  .omit({ order: true, personal_anecdote: true })
  .extend({
    rank: z.number().int().positive(),
    ross_comments: z.string().trim().min(1),
  })
  .transform(({ rank, ross_comments, ...properties }) => ({
    ...properties,
    order: rank,
    personal_anecdote: ross_comments,
  }))

const importCoursePropertiesSchema = z.union([
  coursePropertiesSchema,
  legacyCoursePropertiesSchema,
  legacyAnecdoteCoursePropertiesSchema,
  legacyRankAndAnecdoteCoursePropertiesSchema,
])

export const courseFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    properties: coursePropertiesSchema,
    geometry: courseGeometrySchema,
  })
  .strict()

export const courseFeatureCollectionSchema = z
  .object({
    type: z.literal("FeatureCollection"),
    features: z.array(courseFeatureSchema).min(1),
  })
  .strict()

const importCourseFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    properties: importCoursePropertiesSchema,
    geometry: courseGeometrySchema,
  })
  .strict()

const importCourseFeatureCollectionSchema = z
  .object({
    type: z.literal("FeatureCollection"),
    features: z.array(importCourseFeatureSchema).min(1),
  })
  .strict()

export const courseRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.literal("Feature"),
    properties: coursePropertiesSchema,
    geometry: courseGeometrySchema,
    order: z.number().int().positive(),
    name: z.string().trim().min(1),
  })
  .strict()

export const courseRecordsSchema = z.array(courseRecordSchema)

function formatIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "root"

      return `${path}: ${issue.message}`
    })
    .join("; ")
}

export function parseCourseFeatureCollection(
  input: unknown,
): CourseFeatureCollection {
  const result = importCourseFeatureCollectionSchema.safeParse(input)

  if (!result.success) {
    throw new Error(`Invalid course GeoJSON import. ${formatIssues(result.error)}`)
  }

  return result.data
}

export function parseCourseProperties(input: unknown): CourseProperties {
  const result = coursePropertiesSchema.safeParse(input)

  if (!result.success) {
    throw new Error(`Invalid course properties. ${formatIssues(result.error)}`)
  }

  return result.data
}

export function parseCourseRecords(input: unknown): CourseRecord[] {
  const result = courseRecordsSchema.safeParse(input)

  if (!result.success) {
    throw new Error(`Invalid course records. ${formatIssues(result.error)}`)
  }

  return result.data
}

export function importGeoJsonToRecords(input: unknown): CourseRecord[] {
  return collectionToCourseRecords(parseCourseFeatureCollection(input))
}

export function recordsToGeoJson(records: CourseRecord[]) {
  return recordsToFeatureCollection(parseCourseRecords(records))
}
