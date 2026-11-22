import { Plus } from "lucide-react";
import type { Faq as FaqItem } from "@/content/schema";

/** Native <details> accordion — keyboard and screen-reader accessible with zero JS. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <li key={f.q}>
          <details className="group py-2 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-5 font-display text-lg font-bold transition-colors hover:text-accent-fg sm:text-xl">
              {f.q}
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line transition-all duration-300 group-open:rotate-45 group-open:border-accent group-open:bg-accent group-open:text-ink">
                <Plus className="size-4" aria-hidden />
              </span>
            </summary>
            <p className="max-w-3xl pb-6 leading-relaxed text-fg-2">{f.a}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
