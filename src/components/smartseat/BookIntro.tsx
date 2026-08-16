import { useEffect, useState } from "react";
import { Armchair } from "lucide-react";

/**
 * Cinematic "book opening" intro: a hardbound library ledger rises out of the dark,
 * its cover swings open on a 3D hinge, the pages flare with light and the site is
 * revealed through the spine. Purely presentational.
 */
export function BookIntro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onDone, 600);
  };

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onDone();
      return;
    }
    const t = window.setTimeout(finish, 3900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`book-intro fixed inset-0 z-[999] flex items-center justify-center overflow-hidden ${
        leaving ? "book-intro-leaving" : ""
      }`}
      role="presentation"
      onClick={finish}
    >
      <div className="book-dust" aria-hidden />

      <button
        type="button"
        onClick={finish}
        className="absolute top-6 right-6 rounded-full border border-primary/40 px-4 py-2 text-xs font-medium tracking-wide text-primary/80 transition-colors hover:border-primary hover:text-primary"
      >
        Skip intro →
      </button>

      <div className="book-stage">
        <div className="book">
          <div className="book-glow" aria-hidden />
          <div className="book-stack" aria-hidden />
          <div className="book-page-flare" aria-hidden />

          <div className="book-inner-page">
            <p className="font-display text-lg leading-snug">
              “Rule one of the reading room:
              <br />
              an empty chair belongs to whoever needs it next.”
            </p>
            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase opacity-70">
              Central Library · Ledger MMXXVI
            </p>
          </div>

          <div className="book-cover">
            <div className="book-face book-front">
              <span className="book-frame" aria-hidden />
              <span className="book-spine" aria-hidden />
              <span className="book-ribbon" aria-hidden />
              <Armchair className="size-7 text-primary" />
              <h2 className="font-display mt-4 text-3xl font-semibold">SmartSeat</h2>
              <p className="mt-2 font-mono text-[10px] tracking-[0.24em] uppercase opacity-80">
                Seat ledger · vol. one
              </p>
              <span className="mt-6 rounded border border-dashed border-primary/50 px-3 py-1 font-mono text-[10px] tracking-widest uppercase">
                tap to open
              </span>
            </div>
            <div className="book-face book-back" aria-hidden />
          </div>
        </div>
        <div className="book-shadow" aria-hidden />
      </div>
    </div>
  );
}
