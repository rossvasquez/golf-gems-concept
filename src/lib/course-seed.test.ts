import "fake-indexeddb/auto"

import { beforeEach, describe, expect, it } from "vitest"

import dummyGeo from "@/data/dummy-geo.json"
import {
  importSeedCourseJson,
} from "@/lib/course-seed"
import { db } from "@/lib/db"

describe("course seed import", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it("imports validated GeoJSON into IndexedDB", async () => {
    const result = await importSeedCourseJson(dummyGeo)
    const records = await db.courses.orderBy("order").toArray()

    expect(result.imported).toBe(true)
    expect(records).toHaveLength(3)
    expect(records[0].name).toBe("Kiawah Island Ocean Course")
  })

  it("skips unchanged seed data after the first import", async () => {
    const first = await importSeedCourseJson(dummyGeo)
    const second = await importSeedCourseJson(dummyGeo)
    const records = await db.courses.toArray()

    expect(first.imported).toBe(true)
    expect(second.imported).toBe(false)
    expect(second.sourceHash).toBe(first.sourceHash)
    expect(records).toHaveLength(3)
  })

  it("reimports when the seed payload changes", async () => {
    await importSeedCourseJson(dummyGeo)

    const nextSeed = structuredClone(dummyGeo)
    nextSeed.features[0].properties.name = "Kiawah Island Ocean Course Updated"

    const result = await importSeedCourseJson(nextSeed)
    const record = await db.courses.get("1-kiawah-island-ocean-course-updated")

    expect(result.imported).toBe(true)
    expect(record?.name).toBe("Kiawah Island Ocean Course Updated")
    expect(await db.courses.count()).toBe(4)
  })

  it("preserves admin-created records when seed data imports again", async () => {
    await importSeedCourseJson(dummyGeo)
    await db.courses.put({
      id: "4-admin-course",
      type: "Feature",
      name: "Admin Course",
      order: 4,
      properties: {
        name: "Admin Course",
        designer: "Local Admin",
        description: "Local admin record",
        ross_comments: "Saved locally",
        par: 72,
        yardage: 7000,
        slope_rating: 120,
        course_rating: 72,
        link_out: "https://example.com",
        order: 4,
      },
      geometry: dummyGeo.features[0].geometry as never,
    })

    const result = await importSeedCourseJson(dummyGeo)

    expect(result.imported).toBe(false)
    expect(await db.courses.count()).toBe(4)
    expect(await db.courses.get("4-admin-course")).toBeDefined()
  })
})
