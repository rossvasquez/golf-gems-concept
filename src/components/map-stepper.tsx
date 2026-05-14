import { ArrowBigLeft, ArrowBigRight, Command, PlusIcon } from "lucide-react";
import { useEffect, useMemo, type MouseEventHandler } from "react";

import { lockScrollTrack } from "@/lib/scroll-track-lock";
import { useStoryStore } from "@/stores/use-story-store";
import { cn } from "@/lib/utils";

const STEPPER_INSTRUCTIONS_ID = "course-stepper-instructions";
const PROGRAMMATIC_SCROLL_LOCK_MS = 650;

function scrollToStep(index: number) {
  const target =
    document.querySelector<HTMLElement>(`[data-step-card-index="${index}"]`) ??
    document.querySelector<HTMLElement>(`[data-step-index="${index}"]`);

  if (!target) {
    return;
  }

  lockScrollTrack(PROGRAMMATIC_SCROLL_LOCK_MS);
  const rect = target.getBoundingClientRect();
  const mapTop = 64;
  const mapHeight = window.innerHeight - mapTop;
  const targetTop = window.scrollY + rect.top;

  window.scrollTo({
    behavior: "smooth",
    top: targetTop - (mapTop + (mapHeight - rect.height) / 2),
  });
}

function clampStep(index: number, stepCount: number) {
  return Math.max(0, Math.min(index, stepCount - 1));
}

export function MapStepper() {
  const steps = useStoryStore((state) => state.steps);
  const currentStepSnapshot = useStoryStore(
    (state) => state.currentStepSnapshot,
  );
  const setActiveStep = useStoryStore((state) => state.setActiveStep);
  const setActiveStepProgress = useStoryStore(
    (state) => state.setActiveStepProgress,
  );
  const activeStepProgress = useStoryStore((state) => state.activeStepProgress);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const directionKeys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];

      if (!directionKeys.includes(event.key)) {
        return;
      }

      event.preventDefault();

      const direction =
        event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const currentIndex = currentStepSnapshot?.index ?? -1;

      if (direction < 0 && currentIndex <= 0) {
        return;
      }

      const nextIndex = clampStep(currentIndex + direction, steps.length);

      setActiveStep(nextIndex);
      setActiveStepProgress(0.08);
      scrollToStep(nextIndex);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepSnapshot, setActiveStep, setActiveStepProgress, steps.length]);

  const skipToComplete: MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
    const target = document.getElementById("story-complete");

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    window.history.pushState(null, "", "#story-complete");
    target?.scrollIntoView({ block: "start" });
    target?.focus({ preventScroll: true });
  };

  const stepWidth = useMemo(() => {
    if (steps.length === 0) {
      return `0%`;
    }
    return `${100 / steps.length}%`;
  }, [steps.length]);

  return (
    <div className="pointer-events-none absolute top-2 bottom-1.75 inset-x-2 z-30 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-2 w-full items-end">
        <nav
          aria-label="Course progress"
          aria-describedby={STEPPER_INSTRUCTIONS_ID}
          className="pointer-events-auto w-full flex justify-end flex-wrap gap-2"
        >
          {steps.map((step, index) => {
            const isActive = currentStepSnapshot?.index === index;
            const isComplete =
              currentStepSnapshot !== null && index < currentStepSnapshot.index;
            const fillProgress = isComplete
              ? 1
              : isActive
                ? activeStepProgress
                : 0;
            const progressLabel = isComplete
              ? "complete"
              : isActive
                ? `${Math.round(fillProgress * 100)}% complete`
                : "not started";

            return (
              <button
                key={step.id}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Go to Gem #${step.properties.order}: ${step.properties.name}, ${progressLabel}`}
                className={cn(
                  "group relative max-w-40 min-w-6 flex h-1 items-center justify-center overflow-hidden bg-white/35 text-emerald-950 backdrop-blur-md transition-all hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-emerald-700/40",
                  isActive &&
                    "bg-white/45 text-white shadow-lg shadow-emerald-950/20",
                  isComplete &&
                    !isActive &&
                    "bg-emerald-200/35 text-emerald-900",
                )}
                style={{ width: stepWidth }}
                type="button"
                onClick={() => {
                  setActiveStep(index);
                  setActiveStepProgress(0.08);
                  scrollToStep(index);
                }}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 bg-emerald-400/80 transition-[width] duration-150 ease-out",
                    isComplete && "bg-emerald-100/90",
                    isActive && "bg-emerald-500",
                  )}
                  style={{ width: `${fillProgress * 100}%` }}
                />
              </button>
            );
          })}
        </nav>
        <div
          id={STEPPER_INSTRUCTIONS_ID}
          role="note"
          aria-live="polite"
          className="flex items-center gap-2 px-3 py-1.5 text-white/80 backdrop-blur-sm"
        >
          <Command className="size-5" aria-hidden="true" />
          <PlusIcon className="size-4" aria-hidden="true" />
          <div className="flex gap-1">
            <ArrowBigLeft className="size-5" aria-hidden="true" />
            <ArrowBigRight className="size-5" aria-hidden="true" />
          </div>
          <span className="sr-only">
            Hold Command and use arrow keys to navigate steps
          </span>
        </div>
      </div>
      <div className="flex gap-3 w-full pr-10 justify-end items-start">
        <a
          className="pointer-events-auto border border-white/20 bg-emerald-950/35 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-white/80 shadow-lg shadow-emerald-950/10 backdrop-blur-md transition-colors hover:bg-emerald-950/40 hover:text-white focus:bg-emerald-950/55 focus:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          href="#story-complete"
          onClick={skipToComplete}
        >
          Skip to end
        </a>
      </div>
    </div>
  );
}
