import { useEffect, useRef } from "react"

import { GeoMetaCard } from "@/components/geo-meta-card"
import { LocationPrompt } from "@/components/location-prompt"
import { isScrollTrackLocked, lockScrollTrack } from "@/lib/scroll-track-lock"
import { useStoryStore } from "@/stores/use-story-store"

const HEADER_HEIGHT = 64
const SNAP_IDLE_MS = 180
const SNAP_THRESHOLD_PX = 96
const SNAP_LOCK_MS = 700
const CENTERED_EPSILON_PX = 3

function clamp(value: number) {
  return Math.max(0, Math.min(value, 1))
}

function mapViewportCenterY() {
  return HEADER_HEIGHT + (window.innerHeight - HEADER_HEIGHT) * 0.5
}

function centeredScrollTopForElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const targetTop = window.scrollY + rect.top

  return targetTop - (mapViewportCenterY() - rect.height / 2)
}

export function ScrollTrack() {
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([])
  const snapTimeoutRef = useRef<number | null>(null)
  const steps = useStoryStore((state) => state.steps)
  const activeStepIndex = useStoryStore((state) => state.activeStepIndex)
  const isStoryStarted = useStoryStore((state) => state.isStoryStarted)
  const setActiveStep = useStoryStore((state) => state.setActiveStep)
  const setActiveStepProgress = useStoryStore(
    (state) => state.setActiveStepProgress,
  )
  const setScrollProgress = useStoryStore((state) => state.setScrollProgress)

  useEffect(() => {
    const clearSnapTimeout = () => {
      if (snapTimeoutRef.current === null) {
        return
      }

      window.clearTimeout(snapTimeoutRef.current)
      snapTimeoutRef.current = null
    }

    const snapToNearbyCard = () => {
      if (!isStoryStarted || isScrollTrackLocked()) {
        return
      }

      const cardTargets = steps
        .map((_, index) =>
          document.querySelector<HTMLElement>(
            `[data-step-card-index="${index}"]`,
          ),
        )
        .filter((target): target is HTMLElement => target !== null)
      const viewportCenterY = mapViewportCenterY()
      const nearest = cardTargets.reduce<{
        distance: number
        target: HTMLElement | null
      }>(
        (result, target) => {
          const rect = target.getBoundingClientRect()
          const distance = Math.abs(
            rect.top + rect.height / 2 - viewportCenterY,
          )

          return distance < result.distance ? { distance, target } : result
        },
        { distance: Number.POSITIVE_INFINITY, target: null },
      )

      if (!nearest.target || nearest.distance > SNAP_THRESHOLD_PX) {
        return
      }

      const nextTop = centeredScrollTopForElement(nearest.target)

      if (Math.abs(window.scrollY - nextTop) < 2) {
        return
      }

      lockScrollTrack(SNAP_LOCK_MS)
      window.scrollTo({ behavior: "smooth", top: nextTop })
    }

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

      const isLocked = isScrollTrackLocked()

      if (!isStoryStarted) {
        setActiveStep(null)
        setActiveStepProgress(0)
        return
      }

      if (window.scrollY <= 2) {
        setActiveStep(null)
        setActiveStepProgress(0)
        return
      }

      const cardAnchors = steps.map((_, index) => {
        const card = document.querySelector<HTMLElement>(
          `[data-step-card-index="${index}"]`,
        )

        return card ? centeredScrollTopForElement(card) : null
      })
      const introAnchor = centeredScrollTopForElement(first)
      const activeIndex = cardAnchors.findIndex(
        (anchor) => anchor !== null && window.scrollY <= anchor,
      )

      if (activeIndex === -1) {
        const lastAnchor = cardAnchors[cardAnchors.length - 1]

        if (lastAnchor !== null && window.scrollY > lastAnchor) {
          setActiveStep(steps.length - 1)
          setActiveStepProgress(1)
        }
        return
      }

      const activeAnchor = cardAnchors[activeIndex]
      const previousAnchor =
        activeIndex === 0 ? introAnchor : cardAnchors[activeIndex - 1]

      if (activeAnchor === null || previousAnchor === null) {
        return
      }

      const rawProgress =
        (window.scrollY - previousAnchor) /
        Math.max(activeAnchor - previousAnchor, 1)
      const sectionProgress =
        Math.abs(window.scrollY - activeAnchor) <= CENTERED_EPSILON_PX
          ? 1
          : rawProgress

      setActiveStep(activeIndex)
      setActiveStepProgress(clamp(Number(sectionProgress.toFixed(3))))

      if (isLocked) {
        return
      }

      clearSnapTimeout()
      snapTimeoutRef.current = window.setTimeout(
        snapToNearbyCard,
        SNAP_IDLE_MS,
      )
    }

    updateProgress()
    window.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress)

    return () => {
      clearSnapTimeout()
      window.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [
    activeStepIndex,
    isStoryStarted,
    setActiveStep,
    setActiveStepProgress,
    setScrollProgress,
    steps,
    steps.length,
  ])

  return (
    <div className="pointer-events-none relative z-20 -mt-[calc(100svh-4rem)]">
      <div
        ref={(node) => {
          sectionRefs.current[0] = node
        }}
        data-step-index="intro"
        className="relative h-[calc(100svh-4rem)]"
      >
        {isStoryStarted ? (
          <div className="flex h-[calc(100svh-4rem)] items-center justify-center px-4 py-20 md:justify-start md:px-9">
            <LocationPrompt keepMountedInTrack />
          </div>
        ) : null}
      </div>

      {steps.map((step, index) => (
        <div
          key={step.id}
          ref={(node) => {
            sectionRefs.current[index + 1] = node
          }}
          data-step-index={index}
          className="relative h-[calc(100svh-4rem)]"
        >
          <div
            data-step-card-index={index}
            className={`flex h-[calc(100svh-4rem)] items-center justify-center px-4 py-20 md:justify-start md:px-9 ${
              activeStepIndex === null && index === 0 ? "invisible" : ""
            }`}
          >
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
