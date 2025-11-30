import Link from "next/link";
import { ComingSoon } from "../components/ComingSoon";
import { SiteHeader } from "../components/SiteHeader";
import { usePreviewGate } from "../lib/preview";

export default function HomePage() {
  const previewEnabled = usePreviewGate();

  if (!previewEnabled) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-white text-navy">
      <SiteHeader sticky={false} />
      <main className="pb-16">
        <section className="relative overflow-hidden py-14 w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/16 via-white to-accent/14 pointer-events-none" />
          <div className="relative container grid gap-12 px-4 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <p className="text-base font-semibold uppercase tracking-[0.35em] text-primary">GenxAPI</p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.04] text-navy">
                Generate, version, and ship SDKs without bespoke scripts.
              </h1>
              <p className="max-w-2xl text-xl md:text-2xl text-muted">
                Orchestrate Orval, Kubb, or custom templates from one config. Keep OpenAPI specs,
                semantic versioning, and publishing in lockstep—locally and in CI.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-2xl bg-primary px-6 py-3.5 text-lg font-semibold text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition"
                  href="/docs/getting-started?preview=genxapi"
                >
                  Get started
                </Link>
                <Link
                  className="rounded-2xl border border-border bg-surface px-6 py-3.5 text-lg font-semibold text-navy hover:border-primary/40 hover:text-primary transition"
                  href="/docs/configuration?preview=genxapi"
                >
                  Configuration
                </Link>
                <span className="text-sm font-semibold text-muted">
                  SemVer aware · GitHub + npm ready
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Multi-client aware", "CLI-first (Node 20+)", "Templates: Orval · Kubb · custom"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-navy"
                    >
                      {label}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="grid gap-4">
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
                href="/docs/configuration?preview=genxapi"
              />
              <FeatureRow
                title="Template freedom"
                body="Default adapters ship Orval and Kubb, plus hooks for custom engines."
                href="/docs/templates?preview=genxapi"
              />
              <FeatureRow
                title="CI friendly"
                body="Cache-aware installs, dry-runs, and publish helpers for GitHub/npm."
                href="/docs/ci-integration?preview=genxapi"
              />
            </div>
          </div>
        </section>

        <section className="px-12 mt-16 w-full bg-gradient-to-br from-primary/10 via-surface to-accent/10 text-navy">
          <div className="container grid gap-6 md:grid-cols-3 px-4 py-12">
            <Card
              title="Single source of truth"
              body="Define clients, templates, and publish targets in genxapi.config.*—the same file drives CI."
              href="/docs/configuration?preview=genxapi"
            />
            <Card
              title="Swap engines fast"
              body="Use Orval, Kubb, or bespoke templates. Toggle with flags or config without rewriting pipelines."
              href="/docs/templates?preview=genxapi"
            />
            <Card
              title="Release automation"
              body="OpenAPI diffs, SemVer hints, and publish helpers for GitHub + npm registries."
              href="/docs/versioning?preview=genxapi"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Card({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link
      className="block h-full rounded-2xl border border-border bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
      href={href}
    >
      <h3 className="text-xl font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
        Learn more →
      </span>
    </Link>
  );
}

function StatCard({ title, body, code }: { title: string; body: string; code: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-navy">
          Preview
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{body}</p>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-[#0E1326] px-3 py-3 text-sm text-white shadow-inner">
        {code}
      </pre>
    </div>
  );
}

function FeatureRow({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link
      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/70 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40"
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
