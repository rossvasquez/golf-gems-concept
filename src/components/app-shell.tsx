import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminPage } from "@/components/admin-page";
import { Header } from "@/components/header";
import type { AppView } from "@/components/header";
import { MapView } from "@/components/map-view";
import { ScrollTrack } from "@/components/scroll-track";
import { Button } from "@/components/ui/button";
import { useCourseSteps } from "@/hooks/use-course-steps";
import { useStoryStore } from "@/stores/use-story-store";

export function AppShell() {
    const [activeView, setActiveView] = useState<AppView>("map");
    const courseData = useCourseSteps();
    const steps = useStoryStore((state) => state.steps);
    const isStoryStarted = useStoryStore((state) => state.isStoryStarted);
    const setCourseData = useStoryStore((state) => state.setCourseData);
    const setActiveStep = useStoryStore((state) => state.setActiveStep);
    const setActiveStepProgress = useStoryStore(
        (state) => state.setActiveStepProgress,
    );
    const setScrollProgress = useStoryStore((state) => state.setScrollProgress);

    useEffect(() => {
        setCourseData(
            courseData.steps,
            courseData.error
                ? "error"
                : courseData.isLoading
                  ? "loading"
                  : "ready",
            courseData.error?.message ?? null,
        );
    }, [
        courseData.error,
        courseData.isLoading,
        courseData.steps,
        setCourseData,
    ]);

    useEffect(() => {
        if (activeView !== "map" || isStoryStarted) {
            document.documentElement.style.overflow = "";
            document.documentElement.style.overscrollBehavior = "";
            document.body.style.overflow = "";
            document.body.style.overscrollBehavior = "";
            document.body.style.position = "";
            document.body.style.width = "";

            if (
                activeView === "map" &&
                isStoryStarted &&
                window.location.hash !== "#story-complete"
            ) {
                setActiveStep(null);
                setActiveStepProgress(0);
                setScrollProgress(0);
                window.requestAnimationFrame(() =>
                    window.scrollTo({ left: 0, top: 0 }),
                );
            }

            return;
        }

        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousHtmlOverscroll =
            document.documentElement.style.overscrollBehavior;
        const previousBodyOverflow = document.body.style.overflow;
        const previousBodyOverscroll = document.body.style.overscrollBehavior;
        const previousBodyPosition = document.body.style.position;
        const previousBodyWidth = document.body.style.width;

        window.scrollTo({ left: 0, top: 0 });
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.overscrollBehavior = "none";
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.documentElement.style.overscrollBehavior =
                previousHtmlOverscroll;
            document.body.style.overflow = previousBodyOverflow;
            document.body.style.overscrollBehavior = previousBodyOverscroll;
            document.body.style.position = previousBodyPosition;
            document.body.style.width = previousBodyWidth;
        };
    }, [
        activeView,
        isStoryStarted,
        setActiveStep,
        setActiveStepProgress,
        setScrollProgress,
    ]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header activeView={activeView} onNavigate={setActiveView} />

            <main className="pt-16">
                {activeView === "map" ? (
                    <>
                        <section className="relative bg-emerald-950">
                            <div className="sticky top-16 h-[calc(100svh-4rem)]">
                                <MapView />
                            </div>
                            {isStoryStarted ? <ScrollTrack /> : null}
                        </section>

                        <section
                            id="story-complete"
                            tabIndex={-1}
                            className="scroll-mt-20 bg-background px-4 py-20 sm:px-6"
                        >
                            <div className="mx-auto max-w-3xl">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-800">
                                    <CheckCircle2
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Round complete
                                </p>
                                <h2 className="mt-4 font-serif text-4xl leading-none text-foreground sm:text-5xl">
                                    That is the opening loop of Ross Gem's.
                                </h2>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                                    You moved through {steps.length} ranked
                                    courses from the IndexedDB-backed GeoJSON
                                    cache.
                                </p>
                                <Button
                                    asChild
                                    className="mt-8"
                                    variant="outline"
                                >
                                    <a
                                        href="#top"
                                        onClick={() =>
                                            window.scrollTo({ top: 0 })
                                        }
                                    >
                                        Back to the map
                                        <ArrowUpRight
                                            data-icon="inline-end"
                                            className="size-3.5"
                                        />
                                    </a>
                                </Button>
                            </div>
                        </section>
                    </>
                ) : (
                    <AdminPage />
                )}
            </main>
        </div>
    );
}
