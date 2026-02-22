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

      <div className="w-full py-10">
        <div className="container flex gap-6">
          {showNav ? (
            <>
              <aside className="hidden w-64 shrink-0 lg:block">
                <NavList items={navItems} />
              </aside>
              <main className="flex-1 min-w-0" suppressHydrationWarning>
                {showTitle && title ? (
                  <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-navy">{title}</h1>
                ) : null}
                <div className="prose prose-xl max-w-none">{children}</div>
              </main>
            </>
          ) : (
            <main className="w-full min-w-0" suppressHydrationWarning>
              {showTitle && title ? (
                <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-navy">{title}</h1>
              ) : null}
              <div className="prose prose-xl max-w-none">{children}</div>
            </main>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function NavList({ items }: { items: NavItem[] }) {
  return (
    <nav className="sticky top-20 bg-white/90 p-3">
      <ul className="space-y-2 text-md">
        {items.map((item) => (
          <li key={item.title}>
            <NavLink item={item} />
            {item.children ? (
              <ul className="mt-1 space-y-1 border-l border-border pl-3">
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
  const className = secondary
    ? "text-muted hover:text-primary"
    : "font-semibold text-navy hover:text-primary";

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
