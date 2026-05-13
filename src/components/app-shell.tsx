import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

import { Header } from "@/components/header";
import { MapView } from "@/components/map-view";
import { ScrollTrack } from "@/components/scroll-track";
import { Button } from "@/components/ui/button";
import { useStoryStore } from "@/stores/use-story-store";

export function AppShell() {
  const steps = useStoryStore((state) => state.steps);
  const isStoryStarted = useStoryStore((state) => state.isStoryStarted);

  useEffect(() => {
    if (isStoryStarted || window.location.hash === "#story-complete") {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    window.scrollTo({ left: 0, top: 0 });
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isStoryStarted]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-16">
        <section className="relative bg-emerald-950">
          <div className="sticky top-16 h-[calc(100svh-4rem)]">
            <MapView />
          </div>
          <ScrollTrack />
        </section>

        <section
          id="story-complete"
          tabIndex={-1}
          className="scroll-mt-20 bg-background px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-800">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Round complete
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-none text-foreground sm:text-5xl">
              That is the opening loop of Ross Gem's.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              You moved through {steps.length} ranked courses from the local
              GeoJSON source. Next round we can add fetched geo data without
              changing the map story foundation.
            </p>
            <Button asChild className="mt-8" variant="outline">
              <a href="#top" onClick={() => window.scrollTo({ top: 0 })}>
                Back to the map
                <ArrowUpRight data-icon="inline-end" className="size-3.5" />
              </a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
