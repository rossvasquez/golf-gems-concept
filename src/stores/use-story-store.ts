import { create } from "zustand"

import { getCourseSteps } from "@/lib/geo"
import type { CourseStep, LngLatTuple } from "@/types/geo"

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "skipped"

type CurrentStepSnapshot = {
  id: string
  index: number
  name: string
  rank: number
}

type StoryState = {
  steps: CourseStep[]
  activeStepIndex: number | null
  currentStepSnapshot: CurrentStepSnapshot | null
  locationStatus: LocationStatus
  userLocation: LngLatTuple | null
  isStoryStarted: boolean
  scrollProgress: number
  activeStepProgress: number
  startWithLocation: () => Promise<void>
  startWithoutLocation: () => void
  setActiveStep: (index: number | null) => void
  setScrollProgress: (progress: number) => void
  setActiveStepProgress: (progress: number) => void
  nextStep: () => void
  previousStep: () => void
}

const courseSteps = getCourseSteps()

function clampStep(index: number) {
  return Math.max(0, Math.min(index, courseSteps.length - 1))
}

function stepSnapshot(index: number | null): CurrentStepSnapshot | null {
  if (index === null) {
    return null
  }

  const step = courseSteps[clampStep(index)]

  return {
    id: step.id,
    index: clampStep(index),
    name: step.properties.name,
    rank: step.properties.rank,
  }
}

export const useStoryStore = create<StoryState>((set, get) => ({
  steps: courseSteps,
  activeStepIndex: null,
  currentStepSnapshot: null,
  locationStatus: "idle",
  userLocation: null,
  isStoryStarted: false,
  scrollProgress: 0,
  activeStepProgress: 0,
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
    const nextIndex = index === null ? null : clampStep(index)

    set({
      activeStepIndex: nextIndex,
      currentStepSnapshot: stepSnapshot(nextIndex),
    })
  },
  setScrollProgress: (progress) => {
    set({ scrollProgress: Math.max(0, Math.min(progress, 1)) })
  },
  setActiveStepProgress: (progress) => {
    set({ activeStepProgress: Math.max(0, Math.min(progress, 1)) })
  },
  nextStep: () => {
    const { activeStepIndex } = get()
    const nextIndex = clampStep((activeStepIndex ?? -1) + 1)

    set({
      activeStepIndex: nextIndex,
      currentStepSnapshot: stepSnapshot(nextIndex),
    })
  },
  previousStep: () => {
    const { activeStepIndex } = get()
    if (activeStepIndex === null || activeStepIndex === 0) {
      set({ activeStepIndex: null, currentStepSnapshot: null })
      return
    }

    const nextIndex = clampStep(activeStepIndex - 1)

    set({
      activeStepIndex: nextIndex,
      currentStepSnapshot: stepSnapshot(nextIndex),
    })
  },
}))
