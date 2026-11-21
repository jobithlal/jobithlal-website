export type NavItem = { label: string; href: string; section?: string; match?: string };

/** Phase 6 moves this into the NavigationItem table (Navigation & Footer admin). */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/#top", section: "top", match: "/" },
  { label: "Services", href: "/#services", section: "services", match: "/services" },
  { label: "Work", href: "/#work", section: "work", match: "/work" },
  { label: "Process", href: "/#process", section: "process" },
  { label: "About", href: "/#about", section: "about", match: "/about" },
  { label: "Contact", href: "/#contact", section: "contact", match: "/contact" },
];

export const footerNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
