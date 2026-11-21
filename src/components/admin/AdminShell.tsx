"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, X, ExternalLink } from "lucide-react";
import { logout } from "@/app/admin/actions/auth";
import { cn } from "@/lib/utils";

/**
 * Admin frame: collapsible sidebar (drawer on mobile) + top bar.
 * Only modules that actually work are listed — the rest arrive in Phase 6–7.
 */
const NAV = [{ href: "/admin", label: "Overview", icon: LayoutDashboard }];

export function AdminShell({ user, children }: { user: { name: string; email: string; roleLabel: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState(pathname);
  if (prev !== pathname) {
    setPrev(pathname);
    setOpen(false);
  }

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 p-4">
      <Link href="/admin" className="mb-6 px-3 font-display text-xl font-bold">
        <span className="text-accent">/</span>JOBITHLAL
      </Link>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-accent text-ink" : "text-fg-2 hover:bg-elevated hover:text-fg",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
      <p className="mt-4 px-3 text-xs leading-relaxed text-muted">
        Content, portfolio, media, inquiries and settings managers are being built next.
      </p>
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-2 hover:bg-elevated hover:text-fg">
          <ExternalLink className="size-4" aria-hidden /> View website
        </a>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-2 hover:bg-elevated hover:text-fg">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-line bg-bg-2 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-line bg-bg-2">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-bg/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-lg border border-line lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted">
              {user.roleLabel} · {user.email}
            </p>
          </div>
        </header>
        <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
