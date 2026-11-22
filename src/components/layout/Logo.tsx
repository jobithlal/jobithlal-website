import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  text,
  subtitle,
  imageUrl,
  className,
  showSubtitle = true,
}: {
  text: string;
  subtitle?: string;
  imageUrl?: string;
  className?: string;
  showSubtitle?: boolean;
}) {
  return (
    <Link href="/" aria-label={`${text} — home`} className={cn("group inline-flex flex-col leading-none", className)}>
      {imageUrl ? (
        <Image src={imageUrl} alt={text} width={180} height={40} className="h-8 w-auto" priority />
      ) : (
        <span className="whitespace-nowrap font-display text-[1.35rem] font-bold tracking-[-0.02em] sm:text-2xl">
          <span className="mr-1 inline-block text-accent-fg transition-transform duration-500 ease-[var(--ease-out)] group-hover:rotate-12">/</span>
          {text}
        </span>
      )}
      {showSubtitle && subtitle && (
        <span className="mt-1.5 whitespace-nowrap pl-[1.15rem] text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-muted">{subtitle}</span>
      )}
    </Link>
  );
}
