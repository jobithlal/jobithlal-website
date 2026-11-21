"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, X, ExternalLink, FileText, Sparkles, FolderOpen, Image as ImageIcon, Inbox, Settings, Users, ScrollText, Search, BarChart3 } from "lucide-react";
import { Toaster } from "./kit";
import { logout } from "@/app/admin/actions/auth";
import { cn } from "@/lib/utils";

/**
 * Admin frame: sidebar (drawer on mobile) + top bar. The server decides which
 * modules this user may see; every page and action re-checks on the server.
 */
export type NavKey = "overview" | "content" | "services" | "portfolio" | "media" | "inquiries" | "seo" | "analytics" | "settings" | "users" | "audit";
const ALL_NAV: { key: NavKey; href: string; label: string; icon: typeof Inbox }[] = [
  { key: "overview", href: "/admin", label: "Overview", icon: LayoutDashboard },
  { key: "content", href: "/admin/content", label: "Website content", icon: FileText },
  { key: "services", href: "/admin/services", label: "Services", icon: Sparkles },
  { key: "portfolio", href: "/admin/portfolio", label: "Portfolio", icon: FolderOpen },
  { key: "media", href: "/admin/media", label: "Media library", icon: ImageIcon },
  { key: "inquiries", href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { key: "seo", href: "/admin/seo", label: "SEO", icon: Search },
  { key: "analytics", href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", href: "/admin/settings", label: "Settings", icon: Settings },
  { key: "users", href: "/admin/users", label: "Users & security", icon: Users },
  { key: "audit", href: "/admin/audit", label: "Activity log", icon: ScrollText },
];

export function AdminShell({
  user,
  nav,
  unread = 0,
  children,
}: {
  user: { name: string; email: string; roleLabel: string };
  nav: NavKey[];
  unread?: number;
  children: React.ReactNode;
}) {
  const NAV = ALL_NAV.filter((n) => nav.includes(n.key));
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState(pathname);
  if (prev !== pathname) {
    setPrev(pathname);
    setOpen(false);
  }

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <Link href="/admin" className="mb-6 px-3 font-display text-xl font-bold">
        <span className="text-accent">/</span>JOBITHLAL
      </Link>
      {NAV.map(({ key, href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
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
            <span className="flex-1">{label}</span>
            {key === "inquiries" && unread > 0 && (
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", active ? "bg-ink text-accent" : "bg-accent text-ink")} aria-label={`${unread} unread`}>
                {unread}
              </span>
            )}
          </Link>
        );
      })}
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
    <Toaster>
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
          <Link href="/admin/account" className="ml-auto rounded-lg px-2 py-1 text-right hover:bg-elevated" aria-label="My account">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted">
              {user.roleLabel} · {user.email}
            </p>
          </Link>
        </header>
        <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
    </Toaster>
  );
}
