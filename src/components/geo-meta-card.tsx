import { ExternalLink, Flag, MapPin, Route } from "lucide-react";
import { useMemo } from "react";

import { haversineMiles } from "@/lib/distance";
import { firstCoordinate } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStoryStore } from "@/stores/use-story-store";
import type { CourseStep } from "@/types/geo";

type GeoMetaCardProps = {
  isCameraAnchor?: boolean;
  step: CourseStep | null;
};

function stat(value: string | number, label: string) {
  return (
    <div className="border border-emerald-950/10 bg-white/70 p-3">
      <p className="font-serif text-xl leading-none text-emerald-950">
        {value}
      </p>
      <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function GeoMetaCard({ isCameraAnchor = true, step }: GeoMetaCardProps) {
  const userLocation = useStoryStore((state) => state.userLocation);
  const milesAway = useMemo(() => {
    if (!userLocation || !step) {
      return null;
    }

    return Math.round(
      haversineMiles(userLocation, firstCoordinate(step.feature)),
    ).toLocaleString();
  }, [step, userLocation]);

  if (!step) {
    return null;
  }

  const course = step.properties;

  return (
    <aside
      key={step.id}
      data-map-card={isCameraAnchor ? "active" : undefined}
      className={cn(
        "pointer-events-auto w-full max-w-md",
        !isCameraAnchor && "opacity-90",
      )}
    >
      <div className="border border-emerald-900/20 bg-background/95 p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-800">
              <Flag className="size-3.5" aria-hidden="true" />
              Gem #{course.order}
          </p>
          {milesAway ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
              <MapPin className="size-3" aria-hidden="true" />
              {milesAway} miles away
            </p>
          ) : null}
        </div>
        <h2 className="mt-3 font-serif text-3xl leading-none text-foreground">
          {course.name}
        </h2>
        <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Route className="size-4 text-emerald-700" aria-hidden="true" />
          Designed by {course.designer}
        </p>

        <p className="mt-5 text-sm leading-6 text-foreground">
          {course.description}
        </p>

        <blockquote className="mt-4 border-l-2 border-emerald-500 pl-4 text-sm leading-6 text-muted-foreground">
          {course.personal_anecdote}
        </blockquote>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stat(course.par, "Par")}
          {stat(course.yardage.toLocaleString(), "Yards")}
          {stat(course.slope_rating, "Slope")}
          {stat(course.course_rating, "Rating")}
        </div>

        <Button asChild className="mt-5 w-full" size="sm">
          <a href={course.link_out} target="_blank" rel="noreferrer">
            Visit course site
            <ExternalLink data-icon="inline-end" className="size-3.5" />
          </a>
        </Button>
      </div>
    </aside>
  );
}
