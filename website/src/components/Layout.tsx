import Link from "next/link";
import type { ReactNode } from "react";
import { getNav, type NavItem } from "../lib/nav";
import { PREVIEW_QUERY } from "../lib/preview";

type Props = {
  children: ReactNode;
  title?: string;
};

export function Layout({ children, title }: Props) {
  const navItems = getNav();

  return (
    <div className="min-h-screen bg-surface text-navy">
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link className="flex items-center gap-3" href={`/${PREVIEW_QUERY}`}>
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">G</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-primary">GenxAPI</div>
              <div className="text-sm text-muted">Docs preview</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="text-sm font-semibold text-navy hover:text-primary"
              href="https://github.com/genxapi/genxapi"
            >
              GitHub
            </Link>
            <Link
              className="text-sm font-semibold text-navy hover:text-primary"
              href="https://github.com/genxapi/genxapi/blob/main/docs/getting-started.md"
            >
              Docs on GitHub
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <NavList items={navItems} />
        </aside>
        <main className="flex-1">
          {title ? <h1 className="mb-6 text-3xl font-bold tracking-tight">{title}</h1> : null}
          <div className="prose max-w-none prose-headings:text-navy prose-p:text-muted prose-strong:text-navy prose-code:text-navy">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavList({ items }: { items: NavItem[] }) {
  return (
    <nav className="sticky top-20 rounded-2xl border border-border bg-white/90 p-3 shadow-sm">
      <ul className="space-y-2 text-sm">
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

  const href = item.href ? ensurePreview(item.href) : null;

  return href ? (
    <Link className={className} href={href}>
      {item.title}
    </Link>
  ) : (
    <span className={className}>{item.title}</span>
  );
}

function ensurePreview(href: string) {
  if (href.startsWith("http")) return href;
  if (href.includes("preview=")) return href;
  const hasQuery = href.includes("?");
  return `${href}${hasQuery ? "&" : "?"}${PREVIEW_QUERY.replace("?", "")}`;
}
