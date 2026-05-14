import { Flag, MapPinned, MapPinPen } from "lucide-react";

export type AppView = "map" | "admin";

type HeaderProps = {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
};

export function Header({ activeView, onNavigate }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-emerald-950/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center border border-emerald-900/20 bg-emerald-600 text-white shadow-sm">
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

        <nav className="flex items-center gap-5 text-xs font-semibold uppercase tracking-widest text-emerald-900">
          <button
            className={`inline-flex items-center gap-1 border-b-2 py-1 transition-colors ${
              activeView === "map"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-emerald-950/65 hover:text-emerald-900"
            }`}
            type="button"
            onClick={() => onNavigate("map")}
          >
            <MapPinned className="size-3.5" aria-hidden="true" />
            Map
          </button>
          <button
            className={`inline-flex items-center gap-1 border-b-2 py-1 transition-colors ${
              activeView === "admin"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-emerald-950/65 hover:text-emerald-900"
            }`}
            type="button"
            onClick={() => onNavigate("admin")}
          >
            <MapPinPen className="size-3.5" aria-hidden="true" />
            Admin
          </button>
        </nav>
      </div>
    </header>
  );
}
