import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white/90">
      <div className="container flex flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-navy">GenxAPI</div>
          <div className="text-sm text-muted">Public and available now.</div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <Link className="text-primary hover:text-navy transition" href="/docs/getting-started">
              Quickstart
            </Link>
            <a
              className="text-primary hover:text-navy transition"
              href="https://github.com/genxapi/genxapi"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="text-primary hover:text-navy transition"
              href="https://www.npmjs.com/package/@genxapi/cli"
              target="_blank"
              rel="noreferrer"
            >
              npm CLI
            </a>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted md:text-right">
          <div>
            Source code licensed under the{" "}
            <a
              className="text-primary hover:text-navy transition"
              href="https://github.com/genxapi/genxapi/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
            >
              Apache License 2.0
            </a>{" "}
            (SPDX: Apache-2.0).
          </div>
          <div>Copyright 2025-2026 Eduardo Aparicio Cardenes.</div>
        </div>
      </div>
    </footer>
  );
}
