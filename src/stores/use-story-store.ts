import { create } from "zustand"

import type { CourseStep, LngLatTuple } from "@/types/geo"

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "skipped"
type CourseDataStatus = "loading" | "ready" | "error"

type CurrentStepSnapshot = {
  id: string
  index: number
  name: string
  order: number
}

type StoryState = {
  steps: CourseStep[]
  courseDataStatus: CourseDataStatus
  courseDataError: string | null
  activeStepIndex: number | null
  currentStepSnapshot: CurrentStepSnapshot | null
  locationStatus: LocationStatus
  userLocation: LngLatTuple | null
  isStoryStarted: boolean
  scrollProgress: number
  activeStepProgress: number
  setCourseData: (
    steps: CourseStep[],
    status: CourseDataStatus,
    error?: string | null,
  ) => void
  startWithLocation: () => Promise<void>
  startWithoutLocation: () => void
  setActiveStep: (index: number | null) => void
  setScrollProgress: (progress: number) => void
  setActiveStepProgress: (progress: number) => void
  nextStep: () => void
  previousStep: () => void
}

function clampStep(index: number, steps: CourseStep[]) {
  return Math.max(0, Math.min(index, Math.max(steps.length - 1, 0)))
}

function stepSnapshot(
  index: number | null,
  steps: CourseStep[],
): CurrentStepSnapshot | null {
  if (index === null || steps.length === 0) {
    return null
  }

  const nextIndex = clampStep(index, steps)
  const step = steps[nextIndex]

  return {
    id: step.id,
    index: nextIndex,
    name: step.properties.name,
    order: step.properties.order,
  }
}

export const useStoryStore = create<StoryState>((set, get) => ({
  steps: [],
  courseDataStatus: "loading",
  courseDataError: null,
  activeStepIndex: null,
  currentStepSnapshot: null,
  locationStatus: "idle",
  userLocation: null,
  isStoryStarted: false,
  scrollProgress: 0,
  activeStepProgress: 0,
  setCourseData: (steps, status, error = null) => {
    const { activeStepIndex, courseDataError, courseDataStatus } = get()

    if (
      get().steps === steps &&
      courseDataStatus === status &&
      courseDataError === error
    ) {
      return
    }

    const nextIndex =
      activeStepIndex === null || steps.length === 0
        ? null
        : clampStep(activeStepIndex, steps)

    set({
      steps,
      courseDataStatus: status,
      courseDataError: error,
      activeStepIndex: nextIndex,
      currentStepSnapshot: stepSnapshot(nextIndex, steps),
    })
  },
  startWithLocation: async () => {
    if (!navigator.geolocation) {
      set({
        activeStepIndex: null,
        activeStepProgress: 0,
        currentStepSnapshot: null,
        isStoryStarted: true,
        locationStatus: "denied",
        scrollProgress: 0,
      })
      return
    }

    set({ locationStatus: "requesting" })

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          set({
            activeStepIndex: null,
            activeStepProgress: 0,
            currentStepSnapshot: null,
            isStoryStarted: true,
            locationStatus: "granted",
            scrollProgress: 0,
            userLocation: [
              position.coords.longitude,
              position.coords.latitude,
            ],
          })
          resolve()
        },
        () => {
          set({
            activeStepIndex: null,
            activeStepProgress: 0,
            currentStepSnapshot: null,
            isStoryStarted: true,
            locationStatus: "denied",
            scrollProgress: 0,
            userLocation: null,
          })
          resolve()
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60_000,
          timeout: 10_000,
        },
      )
    })
  },
  startWithoutLocation: () => {
    set({
      activeStepIndex: null,
      activeStepProgress: 0,
      currentStepSnapshot: null,
      isStoryStarted: true,
      locationStatus: "skipped",
      scrollProgress: 0,
      userLocation: null,
    })
  },
  setActiveStep: (index) => {
    const { steps } = get()
    const nextIndex =
      index === null || steps.length === 0 ? null : clampStep(index, steps)

    set({
      activeStepIndex: nextIndex,
      currentStepSnapshot: stepSnapshot(nextIndex, steps),
    })
  },
  setScrollProgress: (progress) => {
    set({ scrollProgress: Math.max(0, Math.min(progress, 1)) })
  },
  setActiveStepProgress: (progress) => {
    set({ activeStepProgress: Math.max(0, Math.min(progress, 1)) })
  },
  nextStep: () => {
    const { activeStepIndex, steps } = get()

    if (steps.length === 0) {
      return
    }

    const nextIndex = clampStep((activeStepIndex ?? -1) + 1, steps)

    set({
      activeStepIndex: nextIndex,
      currentStepSnapshot: stepSnapshot(nextIndex, steps),
    })
  },
  previousStep: () => {
    const { activeStepIndex, steps } = get()
    if (activeStepIndex === null || activeStepIndex === 0) {
      set({ activeStepIndex: null, currentStepSnapshot: null })
      return
    }

    const nextIndex = clampStep(activeStepIndex - 1, steps)

    set({
      activeStepIndex: nextIndex,
      currentStepSnapshot: stepSnapshot(nextIndex, steps),
    })
  },
}))
