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

/** Blog link. Always in the footer; in the header only when Admin → Blog → "Show in header menu" is on. */
export const blogNavItem: NavItem = { label: "Blog", href: "/blog", match: "/blog" };

/** Main menu, with the Blog link inserted before Contact when enabled. */
export const headerNav = (showBlog: boolean): NavItem[] =>
  showBlog ? [...mainNav.slice(0, -1), blogNavItem, mainNav[mainNav.length - 1]] : mainNav;

export const footerNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  blogNavItem,
  { label: "Contact", href: "/contact" },
];
