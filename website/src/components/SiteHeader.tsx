import Image from "next/image";
import Link from "next/link";
import { focusRing } from "../lib/ui";

type Props = {
  sticky?: boolean;
};

export function SiteHeader({ sticky = true }: Props) {
  const headerClass = sticky
    ? "w-full sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur"
    : "w-full border-b border-border bg-white/90";
  const brandClass = `flex items-center gap-3 rounded-lg ${focusRing}`;
  const navButtonBase = `shrink-0 rounded-xl text-sm font-semibold transition ${focusRing}`;
  const navButtonOutline = `${navButtonBase} border border-border bg-white/90 px-4 py-2.5 text-navy hover:border-primary/40 hover:text-primary`;
  const navButtonPrimary = `${navButtonBase} bg-primary px-4 py-2.5 text-white shadow hover:shadow-lg`;
  const navButtonGhost = `${navButtonBase} px-3 py-2.5 text-muted hover:text-primary`;

  return (
    <header className={headerClass}>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy focus:shadow-md focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-white"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="container">
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link
            className={brandClass}
            href="/"
          >
            <div className="h-11 w-11 flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src="/assets/genxapi-logo.png"
              alt="GenX API logo"
              width={44}
              height={44}
              priority
            />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold text-primary">GenX API</div>
              <div className="text-xs text-muted sm:text-sm sm:whitespace-nowrap">
                Orchestration for API client generation
              </div>
            </div>
          </Link>
          <nav
            className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:justify-end md:overflow-visible md:pb-0"
            aria-label="Primary"
          >
            <Link
              className={navButtonOutline}
              href="/overview"
            >
              Overview
            </Link>
            <Link
              className={navButtonPrimary}
              href="/docs/getting-started"
            >
              Docs
            </Link>
            <a
              className={navButtonGhost}
              href="https://github.com/genxapi/genxapi"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className={navButtonGhost}
              href="https://www.npmjs.com/package/@genxapi/cli"
              target="_blank"
              rel="noreferrer"
            >
              npm
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
