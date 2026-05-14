import { useLiveQuery } from "dexie-react-hooks"
import { useEffect, useState } from "react"

import { importSeedCourses } from "@/lib/course-seed"
import { db } from "@/lib/db"
import { recordsToCourseSteps } from "@/lib/geo"
import type { CourseStep } from "@/types/geo"

const EMPTY_STEPS: CourseStep[] = []

export function useCourseSteps() {
  const [seedError, setSeedError] = useState<Error | null>(null)
  const [isSeeding, setIsSeeding] = useState(true)

  useEffect(() => {
    let isMounted = true

    importSeedCourses()
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setSeedError(error instanceof Error ? error : new Error(String(error)))
      })
      .finally(() => {
        if (isMounted) {
          setIsSeeding(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const steps = useLiveQuery(
    () => db.courses.orderBy("order").toArray().then(recordsToCourseSteps),
    [],
  )

  return {
    steps: steps ?? EMPTY_STEPS,
    isLoading: isSeeding || steps === undefined,
    error: seedError,
  }
}
