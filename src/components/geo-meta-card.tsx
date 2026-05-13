import { ExternalLink, Flag, Route } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CourseStep } from "@/types/geo"

type GeoMetaCardProps = {
  step: CourseStep | null
}

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
  )
}

export function GeoMetaCard({ step }: GeoMetaCardProps) {
  if (!step) {
    return null
  }

  const course = step.properties

  return (
    <aside
      key={step.id}
      data-map-card
      className="pointer-events-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 md:slide-in-from-left-4"
    >
      <div className="border border-emerald-900/20 bg-background/95 p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-800">
              <Flag className="size-3.5" aria-hidden="true" />
              Gem #{course.rank}
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-none text-foreground">
              {course.name}
            </h2>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Route className="size-4 text-emerald-700" aria-hidden="true" />
              Designed by {course.designer}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-foreground">
          {course.description}
        </p>

        <blockquote className="mt-4 border-l-2 border-emerald-500 pl-4 text-sm leading-6 text-muted-foreground">
          {course.ross_comments}
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
  )
}
