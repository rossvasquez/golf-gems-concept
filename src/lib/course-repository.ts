import type { Polygon } from "geojson"

import { db } from "@/lib/db"
import { courseIdFromProperties, toCourseRecord } from "@/lib/geo"
import { courseFeatureSchema, courseRecordSchema } from "@/lib/geo-schema"
import type { CourseProperties, CourseRecord } from "@/types/geo"

export function nextCourseOrder(records: CourseRecord[]) {
  return records.reduce((max, record) => Math.max(max, record.order), 0) + 1
}

export async function saveCourse({
  existingId,
  geometry,
  properties,
}: {
  existingId?: string
  geometry: Polygon
  properties: CourseProperties
}) {
  const feature = courseFeatureSchema.parse({
    type: "Feature",
    properties,
    geometry,
  })
  const record = courseRecordSchema.parse(toCourseRecord(feature))

  await db.transaction("rw", db.courses, async () => {
    if (existingId && existingId !== record.id) {
      await db.courses.delete(existingId)
    }

    await db.courses.put(record)
  })

  return record
}

export async function deleteCourse(id: string) {
  await db.courses.delete(id)
}

export async function reorderCourses(records: CourseRecord[]) {
  const orderedRecords = records.map((record, index) =>
    courseRecordSchema.parse({
      ...record,
      order: index + 1,
      properties: {
        ...record.properties,
        order: index + 1,
      },
    }),
  )

  await db.courses.bulkPut(orderedRecords)

  return orderedRecords
}

export function emptyCourseProperties(order: number): CourseProperties {
  return {
    name: "",
    designer: "",
    description: "",
    ross_comments: "",
    par: 72,
    yardage: 7000,
    slope_rating: 120,
    course_rating: 72,
    link_out: "https://example.com",
    order,
  }
}

export function recordIdForProperties(properties: CourseProperties) {
  return courseIdFromProperties(properties)
}
