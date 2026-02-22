import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-navy">
      <SiteHeader sticky={false} />
      <main id="main-content" className="pb-16" tabIndex={-1}>
        <section className="relative overflow-hidden py-12 sm:py-14 lg:py-16 w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/16 via-white to-accent/14 pointer-events-none" />
          <div className="relative container grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.3em] text-primary">
                  GenX API
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Public launch - Available now
                </div>
              </div>
              <h1 className="text-[clamp(2.25rem,4.5vw+1rem,4.75rem)] font-bold leading-[1.06] tracking-[-0.01em] text-navy max-w-[22ch]">
                Generate, version, and ship SDKs without bespoke scripts.
              </h1>
              <p className="max-w-xl sm:max-w-2xl text-lg sm:text-xl lg:text-2xl text-muted">
                GenX API is public and available now. Orchestration for API client generation that keeps
                templates, packaging, and releases aligned across teams, locally and in CI.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition sm:px-6 sm:py-3.5 sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  href="/docs/getting-started"
                >
                  Quickstart
                </Link>
                <Link
                  className="rounded-2xl border border-border bg-surface px-5 py-3 text-base font-semibold text-navy hover:border-primary/40 hover:text-primary transition sm:px-6 sm:py-3.5 sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  href="/overview"
                >
                  Documentation
                </Link>
                <a
                  className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-primary/40 hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  href="https://github.com/genxapi/genxapi"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
                <a
                  className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-primary/40 hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  href="https://www.npmjs.com/package/@genxapi/cli"
                  target="_blank"
                  rel="noreferrer"
                >
                  npm CLI
                </a>
                <span className="text-sm font-semibold text-muted">
                  Public release - GitHub + npm ready
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Shift left on API client generation",
                  "Multi-client aware",
                  "CLI-first (Node 20+)",
                  "Templates: Orval, Kubb, custom"
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-navy"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:gap-6">
              <StatCard
                title="Spec → Generate → Publish"
                body="Run once locally or in CI with the same config."
                code={`npm install --save-dev @genxapi/cli @genxapi/template-orval
npx genxapi generate --log-level info
npx genxapi publish --dry-run`}
              />
              <FeatureRow
                title="Unified configuration"
                body="JSON or TypeScript with schema hints; per-client overrides without cloning files."
                href="/docs/configuration"
              />
              <FeatureRow
                title="Template freedom"
                body="Default adapters ship Orval and Kubb, plus hooks for custom engines."
                href="/docs/templates"
              />
              <FeatureRow
                title="CI friendly"
                body="Cache-aware installs, dry-runs, and publish helpers for GitHub/npm."
                href="/docs/ci-integration"
              />
            </div>
          </div>
        </section>

        <section className="mt-14 sm:mt-16 lg:mt-20 w-full bg-gradient-to-br from-primary/10 via-surface to-accent/10 text-navy">
          <div className="container grid gap-6 sm:gap-7 py-10 sm:py-12 lg:py-14 md:grid-cols-3">
            <Card
              title="Single source of truth"
              body="Define clients, templates, and publish targets in genxapi.config.*—the same file drives CI."
              href="/docs/configuration"
            />
            <Card
              title="Swap engines fast"
              body="Use Orval, Kubb, or bespoke templates. Toggle with flags or config without rewriting pipelines."
              href="/docs/templates"
            />
            <Card
              title="Release automation"
              body="OpenAPI diffs, SemVer hints, and publish helpers for GitHub + npm registries."
              href="/docs/versioning"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link
      className="block h-full rounded-2xl border border-border bg-white/90 p-5 sm:p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      href={href}
    >
      <h3 className="text-lg sm:text-xl font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm sm:text-base text-muted">{body}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
        Learn more →
      </span>
    </Link>
  );
}

function StatCard({ title, body, code }: { title: string; body: string; code: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/90 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-navy">{title}</h3>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-navy">
          Available now
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{body}</p>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-[#0E1326] px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm text-white shadow-inner">
        {code}
      </pre>
    </div>
  );
}

function FeatureRow({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link
      className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface/80 px-4 py-3.5 sm:px-5 sm:py-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      href={href}
    >
      <div>
        <div className="text-base font-semibold text-navy">{title}</div>
        <div className="text-sm text-muted">{body}</div>
      </div>
      <span className="text-primary">→</span>
    </Link>
  );
}
