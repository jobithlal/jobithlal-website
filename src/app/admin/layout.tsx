import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · JOBITHLAL Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // The admin always uses the dark theme, whatever the website is set to.
  return (
    <div data-theme="dark" className="min-h-svh bg-bg text-fg">
      {children}
    </div>
  );
}
