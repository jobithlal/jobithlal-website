import type { TickerContent } from "@/content/schema";

/** CSS-only marquee: two identical halves translate by -50% for a seamless loop. */
export function Ticker({ ticker }: { ticker: TickerContent }) {
  if (!ticker.enabled) return null;
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {Array.from({ length: 3 }).flatMap((_, r) =>
        ticker.items.map((item, i) => (
          <span key={`${r}-${i}`} className="flex items-center">
            <span className="px-6 sm:px-8">{item}</span>
            <span aria-hidden className="font-light opacity-70">
              {"//"}
            </span>
          </span>
        )),
      )}
    </div>
  );
  return (
    <section aria-label="Services" className="ticker relative z-10 -rotate-[0.6deg] overflow-hidden border-y border-black/20 bg-accent py-4 text-ink sm:py-5">
      <p className="sr-only">{ticker.items.join(", ")}</p>
      <div
        className="ticker-track flex w-max font-display text-[clamp(1.25rem,2.6vw,2.25rem)] font-bold uppercase leading-none tracking-[-0.01em]"
        data-dir={ticker.direction}
        style={{ ["--ticker-duration" as string]: `${ticker.durationSeconds}s` }}
        aria-hidden
      >
        {row(true)}
        {row(true)}
      </div>
    </section>
  );
}
