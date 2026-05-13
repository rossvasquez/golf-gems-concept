import { Flag, MapPinned, Trophy } from "lucide-react";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-emerald-950/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center border border-emerald-900/20 bg-emerald-500 text-white shadow-sm">
            <Flag className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-xl leading-none text-foreground">
              Ross Gem's
            </p>
            <p className="text-xs font-light italic font-serif tracking-widest text-muted-foreground">
              "The best I know"
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-5 text-xs font-semibold uppercase tracking-widest text-emerald-900 sm:flex">
          <span className="inline-flex items-center gap-2">
            <MapPinned className="size-3.5" aria-hidden="true" />
            <span>
              <span className="text-neutral-600">Rankings</span> Mapped
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
