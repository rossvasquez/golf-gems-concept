import dummyGeoUrl from "@/data/dummy-geo.json?url"

import { db } from "@/lib/db"
import {
  importGeoJsonToRecords,
  parseCourseRecords,
} from "@/lib/geo-schema"
import type { CourseRecord } from "@/types/geo"

export const COURSE_SEED_META_KEY = "dummy-geo"

type ImportResult = {
  imported: boolean
  recordCount: number
  sourceHash: string
}

function stableCoursePayload(records: CourseRecord[]) {
  const normalizedRecords = records
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((record) => ({
      id: record.id,
      type: record.type,
      order: record.order,
      name: record.name,
      properties: record.properties,
      geometry: record.geometry,
    }))

  return parseCourseRecords(normalizedRecords).map((record) => ({
    id: record.id,
    type: record.type,
    properties: record.properties,
    geometry: record.geometry,
  }))
}

export function hashCourseRecords(records: CourseRecord[]) {
  const input = JSON.stringify(stableCoursePayload(records))
  let hash = 2_166_136_261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }

  return (hash >>> 0).toString(16).padStart(8, "0")
}

async function importSeedRecords(seedRecords: CourseRecord[]) {
  const sourceHash = hashCourseRecords(seedRecords)
  const seedIds = seedRecords.map((record) => record.id)
  const [meta, currentSeedRecords] = await Promise.all([
    db.seedMeta.get(COURSE_SEED_META_KEY),
    db.courses.bulkGet(seedIds),
  ])
  const existingSeedRecords = currentSeedRecords.filter(
    (record): record is CourseRecord => record !== undefined,
  )
  const currentHash = existingSeedRecords.length
    ? hashCourseRecords(existingSeedRecords)
    : null
  const isCurrent =
    currentHash === sourceHash &&
    existingSeedRecords.length === seedRecords.length

  if (
    isCurrent ||
    (meta?.sourceHash === sourceHash &&
      meta.recordCount === seedRecords.length &&
      existingSeedRecords.length === seedRecords.length)
  ) {
    if (!meta || meta.sourceHash !== sourceHash) {
      await db.seedMeta.put({
        key: COURSE_SEED_META_KEY,
        sourceHash,
        recordCount: seedRecords.length,
        importedAt: new Date().toISOString(),
      })
    }

    return {
      imported: false,
      recordCount: seedRecords.length,
      sourceHash,
    }
  }

  await db.transaction("rw", db.courses, db.seedMeta, async () => {
    await db.courses.bulkPut(seedRecords)
    await db.seedMeta.put({
      key: COURSE_SEED_META_KEY,
      sourceHash,
      recordCount: seedRecords.length,
      importedAt: new Date().toISOString(),
    })
  })

  return {
    imported: true,
    recordCount: seedRecords.length,
    sourceHash,
  }
}

async function fetchSeedGeoJson() {
  const response = await fetch(dummyGeoUrl)

  if (!response.ok) {
    throw new Error(`Unable to load dummy GeoJSON seed: ${response.status}`)
  }

  return response.json() as Promise<unknown>
}

export async function importSeedCourses(): Promise<ImportResult> {
  const seedJson = await fetchSeedGeoJson()
  return importSeedRecords(importGeoJsonToRecords(seedJson))
}

export function importSeedCourseJson(input: unknown): Promise<ImportResult> {
  return importSeedRecords(importGeoJsonToRecords(input))
}
