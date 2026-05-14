import { Loader2, LocateFixed, Map } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { haversineMiles } from "@/lib/distance";
import { firstCoordinate } from "@/lib/geo";
import { useStoryStore } from "@/stores/use-story-store";

type LocationPromptProps = {
  keepMountedInTrack?: boolean;
};

export function LocationPrompt({
  keepMountedInTrack = false,
}: LocationPromptProps) {
  const locationStatus = useStoryStore((state) => state.locationStatus);
  const isStoryStarted = useStoryStore((state) => state.isStoryStarted);
  const activeStepIndex = useStoryStore((state) => state.activeStepIndex);
  const steps = useStoryStore((state) => state.steps);
  const userLocation = useStoryStore((state) => state.userLocation);
  const startWithLocation = useStoryStore((state) => state.startWithLocation);
  const startWithoutLocation = useStoryStore(
    (state) => state.startWithoutLocation,
  );
  const firstStep = steps[0] ?? null;
  const milesToFirstStep = useMemo(() => {
    if (!userLocation || !firstStep) {
      return null;
    }

    return Math.round(
      haversineMiles(userLocation, firstCoordinate(firstStep.feature)),
    ).toLocaleString();
  }, [firstStep, userLocation]);

  if (isStoryStarted) {
    if (!keepMountedInTrack && activeStepIndex !== null) {
      return null;
    }

    const statusLabel =
      locationStatus === "granted" ? "You're here" : "Map is ready";
    const firstStepName = firstStep?.properties.name ?? "the first gem";

    return (
      <div className="pointer-events-auto max-w-sm animate-in fade-in slide-in-from-left-4 duration-500 border border-emerald-900/15 bg-background/95 p-4 shadow-xl shadow-emerald-950/15 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
          {statusLabel}
        </p>
        <p className="mt-2 font-serif text-2xl leading-none text-foreground">
          {milesToFirstStep
            ? `${milesToFirstStep} miles from the first gem.`
            : "Start scrolling to begin."}
        </p>
        {milesToFirstStep ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Keep scrolling to fly to {firstStepName}.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pointer-events-auto w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500 border border-emerald-900/15 bg-background/95 p-6 shadow-2xl shadow-emerald-950/25 backdrop-blur-xl sm:p-8">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-800">
        Set your starting point
      </p>
      <h1 className="mx-auto mt-4 max-w-xl text-center font-serif text-4xl leading-none text-foreground sm:text-5xl">
        Find the first tee from wherever you are.
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-center text-base leading-7 text-muted-foreground">
        Share your location to start on your current spot, or skip straight to
        the national view and begin the course scroll.
      </p>

      <div className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row">
        <Button
          className="flex-1"
          size="lg"
          disabled={locationStatus === "requesting"}
          onClick={() => void startWithLocation()}
        >
          {locationStatus === "requesting" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <LocateFixed />
          )}
          Use my location
        </Button>
        <Button
          className="flex-1"
          size="lg"
          variant="outline"
          disabled={locationStatus === "requesting"}
          onClick={startWithoutLocation}
        >
          <Map />
          Start without it
        </Button>
      </div>

      {locationStatus === "denied" ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Location was unavailable, so the map will start zoomed out.
        </p>
      ) : null}
    </div>
  );
}
