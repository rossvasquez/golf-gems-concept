import Dexie, { type Table } from "dexie"

import type { CourseRecord, SeedMeta } from "@/types/geo"

type IawaMapDatabase = Dexie & {
  courses: Table<CourseRecord, string>
  seedMeta: Table<SeedMeta, string>
}

export const db = new Dexie("iawa-map-poc") as IawaMapDatabase

db.version(1).stores({
  courses: "id, rank, name",
  seedMeta: "key",
})

db.version(2)
  .stores({
    courses: "id, order, name",
    seedMeta: "key",
  })
  .upgrade(async (transaction) => {
    const courses = transaction.table("courses")

    await courses.toCollection().modify((record) => {
      const legacyRecord = record as { rank?: number; order?: number }

      if (legacyRecord.order === undefined && legacyRecord.rank !== undefined) {
        legacyRecord.order = legacyRecord.rank
      }

      delete legacyRecord.rank
    })
  })

db.version(3)
  .stores({
    courses: "id, order, name",
    seedMeta: "key",
  })
  .upgrade(async (transaction) => {
    const courses = transaction.table("courses")

    await courses.toCollection().modify((record) => {
      const legacyProperties = record.properties as
        | {
            ross_comments?: string
            personal_anecdote?: string
          }
        | undefined

      if (!legacyProperties) {
        return
      }

      if (
        legacyProperties.personal_anecdote === undefined &&
        legacyProperties.ross_comments !== undefined
      ) {
        legacyProperties.personal_anecdote = legacyProperties.ross_comments
      }

      delete legacyProperties.ross_comments
    })
  })
