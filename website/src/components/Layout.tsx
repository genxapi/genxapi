import Link from "next/link";
import type { ReactNode } from "react";
import { getNav, type NavItem } from "../lib/nav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type Props = {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
  showTitle?: boolean;
};

export function Layout({ children, title, showNav = true, showTitle = false }: Props) {
  const navItems = getNav();

  return (
    <div className="min-h-screen bg-white text-navy">
      <SiteHeader />

      <div className="w-full py-10 md:py-12">
        <div className="container flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {showNav ? (
            <>
              <aside className="hidden w-60 shrink-0 lg:block xl:w-64">
                <NavList items={navItems} />
              </aside>
              <main className="flex-1 min-w-0" suppressHydrationWarning>
                <div className="space-y-6 md:space-y-8">
                  <div className="lg:hidden">
                    <details
                      className="rounded-2xl border border-border bg-white/90 p-4 shadow-sm"
                      suppressHydrationWarning
                    >
                      <summary
                        className="cursor-pointer text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        aria-controls="mobile-docs-nav"
                      >
                        Docs navigation
                      </summary>
                      <div id="mobile-docs-nav" className="mt-4 border-t border-border/60 pt-4">
                        <NavList items={navItems} variant="mobile" />
                      </div>
                    </details>
                  </div>
                  {showTitle && title ? (
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-navy">
                      {title}
                    </h1>
                  ) : null}
                  <div className="prose prose-xl max-w-[72ch]">{children}</div>
                </div>
              </main>
            </>
          ) : (
            <main className="w-full min-w-0" suppressHydrationWarning>
              <div className="space-y-6 md:space-y-8">
                {showTitle && title ? (
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-navy">
                    {title}
                  </h1>
                ) : null}
                <div className="prose prose-xl max-w-[72ch]">{children}</div>
              </div>
            </main>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function NavList({ items, variant = "sidebar" }: { items: NavItem[]; variant?: "sidebar" | "mobile" }) {
  const navClass =
    variant === "mobile"
      ? "p-0"
      : "sticky top-24 rounded-2xl border border-border bg-white/90 p-4 shadow-sm";
  const listClass = variant === "mobile" ? "space-y-3 text-sm" : "space-y-3 text-sm";

  return (
    <nav className={navClass} aria-label="Docs">
      <ul className={listClass}>
        {items.map((item) => (
          <li key={item.title}>
            <NavLink item={item} />
            {item.children ? (
              <ul className="mt-2 space-y-2 border-l border-border pl-3">
                {item.children.map((child) => (
                  <li key={child.title}>
                    <NavLink item={child} secondary />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavLink({ item, secondary }: { item: NavItem; secondary?: boolean }) {
  const baseClass =
    "block rounded-md px-2.5 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
  const className = secondary
    ? `${baseClass} text-muted hover:text-primary`
    : `${baseClass} font-semibold text-navy hover:text-primary`;

  if (item.external && item.href) {
    return (
      <a className={className} href={item.href} target="_blank" rel="noreferrer">
        {item.title}
      </a>
    );
  }

  const href = item.href ?? null;

  return href ? (
    <Link className={className} href={href}>
      {item.title}
    </Link>
  ) : (
    <span className={className}>{item.title}</span>
  );
}
