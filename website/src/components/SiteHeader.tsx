import Image from "next/image";
import Link from "next/link";

type Props = {
  sticky?: boolean;
};

export function SiteHeader({ sticky = true }: Props) {
  const headerClass = sticky
    ? "w-full sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur"
    : "w-full border-b border-border bg-white/90";

  return (
    <header className={headerClass}>
      <div className="container">
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-lg"
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
              className="shrink-0 rounded-xl border border-border bg-white/90 px-4 py-2.5 text-sm font-semibold text-navy hover:border-primary/40 hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/overview"
            >
              Overview
            </Link>
            <Link
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow hover:shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/docs/getting-started"
            >
              Docs
            </Link>
            <a
              className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="https://github.com/genxapi/genxapi"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
