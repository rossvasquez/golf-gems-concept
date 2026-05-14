import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson"

export type CourseProperties = {
  name: string
  designer: string
  description: string
  ross_comments: string
  par: number
  yardage: number
  slope_rating: number
  course_rating: number
  link_out: string
  order: number
}

export type CourseGeometry = Polygon | MultiPolygon

export type CourseFeature = Feature<CourseGeometry, CourseProperties>

export type CourseFeatureCollection = FeatureCollection<
  CourseGeometry,
  CourseProperties
>

export type LngLatTuple = [number, number]

export type CourseStep = {
  id: string
  feature: CourseFeature
  properties: CourseProperties
  bounds: [LngLatTuple, LngLatTuple]
  center: LngLatTuple
}

export type CourseRecord = {
  id: string
  type: "Feature"
  properties: CourseProperties
  geometry: CourseGeometry
  order: number
  name: string
}

export type SeedMeta = {
  key: string
  sourceHash: string
  recordCount: number
  importedAt: string
}
