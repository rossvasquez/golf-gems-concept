import { Flag } from "lucide-react";
import { useEffect, type MouseEventHandler } from "react";

import { lockScrollTrack } from "@/components/scroll-track";
import { useStoryStore } from "@/stores/use-story-store";
import { cn } from "@/lib/utils";

const STEPPER_INSTRUCTIONS_ID = "course-stepper-instructions";
const PROGRAMMATIC_SCROLL_LOCK_MS = 2000;

function scrollToStep(index: number) {
  const target = document.querySelector<HTMLElement>(
    `[data-step-index="${index}"]`,
  );

  if (!target) {
    return;
  }

  lockScrollTrack(PROGRAMMATIC_SCROLL_LOCK_MS);
  window.scrollTo({
    behavior: "smooth",
    top: target.offsetTop - window.innerHeight * 0.28,
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

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex flex-col md:grid md:grid-cols-3 items-center gap-2 px-4">
      <a
        className="pointer-events-auto w-fit border md:mb-auto border-white/20 bg-emerald-950/25 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-white/80 shadow-lg shadow-emerald-950/10 backdrop-blur-md transition-colors hover:bg-emerald-950/40 hover:text-white focus:bg-emerald-950/55 focus:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
        href="#story-complete"
        onClick={skipToComplete}
      >
        Skip steps
      </a>

      <nav
        aria-label="Course progress"
        aria-describedby={STEPPER_INSTRUCTIONS_ID}
        className="w-fit md:mx-auto pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-2 border border-white/25 bg-white/20 px-3 py-2 shadow-xl shadow-emerald-950/10 backdrop-blur-md"
      >
        {steps.map((step, index) => {
          const isActive = currentStepSnapshot?.index === index;
          const isComplete =
            currentStepSnapshot !== null && index < currentStepSnapshot.index;

          return (
            <button
              key={step.id}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Go to Gem #${step.properties.rank}: ${step.properties.name}`}
              className={cn(
                "group relative flex size-9 items-center justify-center border border-emerald-950/15 bg-white/35 text-emerald-950 transition-all hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-emerald-700/40",
                isActive &&
                  "scale-110 border-emerald-700 bg-emerald-600 text-white shadow-lg shadow-emerald-950/20",
                isComplete && !isActive && "bg-emerald-100/80 text-emerald-900",
              )}
              type="button"
              onClick={() => {
                setActiveStep(index);
                setActiveStepProgress(0.08);
                scrollToStep(index);
              }}
            >
              <Flag className="size-3.5" aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      <div
        id={STEPPER_INSTRUCTIONS_ID}
        role="note"
        aria-live="polite"
        className="w-fit ml-auto mb-auto hidden md:block pointer-events-none border border-white/20 bg-emerald-950/35 px-3 py-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 backdrop-blur-md"
      >
        Hold Command and use arrow keys to step courses.
      </div>
    </div>
  );
}
