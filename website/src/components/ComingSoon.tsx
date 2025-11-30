import Image from "next/image";
import Link from "next/link";

export function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-white to-accent/10 pointer-events-none" />
        <div className="relative p-8 md:p-10 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Image src="/assets/genxapi-logo.png" alt="GenxAPI logo" width={40} height={40} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-primary">GenxAPI</div>
              <div className="text-lg font-semibold text-navy">API client orchestration</div>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy tracking-tight">Coming soon</h1>
          <p className="text-muted max-w-md">
            We&apos;re building the new docs experience. Add{" "}
            <code className="rounded bg-surface px-2 py-1 text-sm text-navy border border-border">
              ?preview=genxapi
            </code>{" "}
            to the URL to preview the full site.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              className="px-4 py-2 rounded-xl border border-border bg-white text-navy font-semibold hover:border-primary/40 hover:text-primary transition"
              href="https://github.com/genxapi/genxapi"
            >
              GitHub
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold shadow hover:shadow-lg transition"
              href="https://github.com/genxapi/genxapi/blob/main/docs/getting-started.md"
            >
              View docs on GitHub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
