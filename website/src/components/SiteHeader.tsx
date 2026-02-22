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
      <div className="container flex items-center justify-between px-6 py-5">
        <Link className="flex items-center gap-3" href="/">
          <div className="h-11 w-11 flex items-center justify-center overflow-hidden">
            <Image
              src="/assets/genxapi-logo.png"
              alt="GenX API logo"
              width={44}
              height={44}
              priority
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-primary">GenX API</div>
            <div className="text-sm text-muted">Orchestration for API client generation</div>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <Link
            className="rounded-xl border border-border bg-white/90 px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary transition"
            href="/overview"
          >
            Overview
          </Link>
          <Link
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition"
            href="/docs/getting-started"
          >
            Docs
          </Link>
          <a
            className="text-sm font-semibold text-muted hover:text-primary transition"
            href="https://github.com/genxapi/genxapi"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="text-sm font-semibold text-muted hover:text-primary transition"
            href="https://www.npmjs.com/package/@genxapi/cli"
            target="_blank"
            rel="noreferrer"
          >
            npm
          </a>
        </div>
      </div>
    </header>
  );
}
