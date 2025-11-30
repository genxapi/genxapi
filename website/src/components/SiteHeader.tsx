import Image from "next/image";
import Link from "next/link";
import { PREVIEW_QUERY } from "../lib/preview";

type Props = {
  sticky?: boolean;
};

export function SiteHeader({ sticky = true }: Props) {
  const baseHref = (href: string) => {
    if (href.startsWith("http")) return href;
    const hasQuery = href.includes("?");
    return `${href}${hasQuery ? "&" : "?"}${PREVIEW_QUERY.replace("?", "")}`;
  };

  const headerClass = sticky
    ? "w-full sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur"
    : "w-full border-b border-border bg-white/90";

  return (
    <header className={headerClass}>
      <div className="container flex items-center justify-between px-6 py-5">
        <Link className="flex items-center gap-3" href={baseHref("/")}>
          <div className="h-11 w-11 flex items-center justify-center overflow-hidden">
            <Image
              src="/assets/genxapi-logo.png"
              alt="GenxAPI logo"
              width={44}
              height={44}
              priority
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-primary">GenxAPI</div>
            <div className="text-sm text-muted">API client orchestration</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-xl border border-border bg-white/90 px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary transition"
            href={baseHref("/overview")}
          >
            Overview
          </Link>
          <Link
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition"
            href={baseHref("/docs/getting-started")}
          >
            Docs
          </Link>
        </div>
      </div>
    </header>
  );
}
