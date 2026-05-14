import { useLiveQuery } from "dexie-react-hooks"

import { db } from "@/lib/db"
import type { CourseRecord } from "@/types/geo"

const EMPTY_RECORDS: CourseRecord[] = []

export function useCourseRecords() {
  return (
    useLiveQuery(() => db.courses.orderBy("order").toArray(), []) ??
    EMPTY_RECORDS
  )
}
