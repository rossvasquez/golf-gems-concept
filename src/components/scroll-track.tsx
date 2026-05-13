import { useEffect, useRef } from "react"

import { GeoMetaCard } from "@/components/geo-meta-card"
import { isScrollTrackLocked } from "@/lib/scroll-track-lock"
import { useStoryStore } from "@/stores/use-story-store"

function clamp(value: number) {
  return Math.max(0, Math.min(value, 1))
}

const MIN_STEP_DWELL_MS = 3_200

export function ScrollTrack() {
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([])
  const lastStepChangeAtRef = useRef(0)
  const steps = useStoryStore((state) => state.steps)
  const activeStepIndex = useStoryStore((state) => state.activeStepIndex)
  const isStoryStarted = useStoryStore((state) => state.isStoryStarted)
  const setActiveStep = useStoryStore((state) => state.setActiveStep)
  const setActiveStepProgress = useStoryStore(
    (state) => state.setActiveStepProgress,
  )
  const setScrollProgress = useStoryStore((state) => state.setScrollProgress)

  useEffect(() => {
    const updateProgress = () => {
      const first = sectionRefs.current[0]
      const last = sectionRefs.current[sectionRefs.current.length - 1]

      if (!first || !last) {
        return
      }

      const start = first.offsetTop
      const end = last.offsetTop + last.offsetHeight - window.innerHeight
      const progress = (window.scrollY - start) / Math.max(end - start, 1)
      setScrollProgress(clamp(progress))

      if (isScrollTrackLocked()) {
        return
      }

      if (!isStoryStarted) {
        setActiveStep(null)
        setActiveStepProgress(0)
        return
      }

      const viewportLine = window.scrollY + window.innerHeight * 0.35
      const courseSections = sectionRefs.current.slice(1, steps.length + 1)
      const activeIndex = courseSections.findIndex((section) => {
        if (!section) {
          return false
        }

        return (
          viewportLine >= section.offsetTop &&
          viewportLine < section.offsetTop + section.offsetHeight
        )
      })

      if (activeIndex === -1) {
        const firstSection = courseSections[0]
        const lastSection = courseSections[courseSections.length - 1]
        const pastLast =
          lastSection !== null &&
          lastSection !== undefined &&
          viewportLine >= lastSection.offsetTop + lastSection.offsetHeight
        const aboveFirst =
          firstSection !== null &&
          firstSection !== undefined &&
          viewportLine < firstSection.offsetTop

        if (pastLast) {
          setActiveStep(steps.length - 1)
          setActiveStepProgress(1)
        } else if (aboveFirst) {
          setActiveStep(null)
          setActiveStepProgress(0)
        }
        return
      }

      const stepLimitedIndex =
        activeStepIndex !== null &&
        activeIndex !== activeStepIndex &&
        Date.now() - lastStepChangeAtRef.current < MIN_STEP_DWELL_MS
          ? activeStepIndex
          : activeIndex
      const gatedActiveIndex =
        activeStepIndex === null
          ? Math.min(stepLimitedIndex, 0)
          : Math.max(
              activeStepIndex - 1,
              Math.min(stepLimitedIndex, activeStepIndex + 1),
            )
      const activeSection = courseSections[gatedActiveIndex]

      if (!activeSection) {
        return
      }

      const sectionProgress =
        gatedActiveIndex === activeIndex
          ? (viewportLine - activeSection.offsetTop) / activeSection.offsetHeight
          : activeIndex > gatedActiveIndex
            ? 0.86
            : 0.14

      if (gatedActiveIndex !== activeStepIndex) {
        lastStepChangeAtRef.current = Date.now()
      }

      setActiveStep(gatedActiveIndex)
      setActiveStepProgress(clamp(Number(sectionProgress.toFixed(3))))
    }

    updateProgress()
    window.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress)

    return () => {
      window.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [
    activeStepIndex,
    isStoryStarted,
    setActiveStep,
    setActiveStepProgress,
    setScrollProgress,
    steps.length,
  ])

  return (
    <div className="pointer-events-none relative z-20 -mt-[calc(100svh-4rem)]">
      <div
        ref={(node) => {
          sectionRefs.current[0] = node
        }}
        data-step-index="intro"
        className="h-[125svh]"
      />

      {steps.map((step, index) => (
        <div
          key={step.id}
          ref={(node) => {
            sectionRefs.current[index + 1] = node
          }}
          data-step-index={index}
          className="relative h-[360svh]"
        >
          <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center justify-center px-4 py-20 md:justify-start md:px-9">
            <GeoMetaCard
              isCameraAnchor={activeStepIndex === index}
              step={step}
            />
          </div>
        </div>
      ))}

      <div className="h-[60svh]" />
    </div>
  )
}
