import Link from "next/link";
import { ComingSoon } from "../components/ComingSoon";
import { Layout } from "../components/Layout";
import { usePreviewGate } from "../lib/preview";

export default function HomePage() {
  const previewEnabled = usePreviewGate();

  if (!previewEnabled) {
    return <ComingSoon />;
  }

  return (
    <Layout>
      <div className="rounded-3xl border border-border bg-white/90 px-6 py-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">GenxAPI</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">
          Orchestrate API client generation.
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Coordinate Orval, Kubb, or custom templates with one config file. Keep OpenAPI specs,
          generation, semantic versioning, and publishing in lockstep—locally and in CI.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow hover:shadow-lg transition"
            href="/docs/getting-started?preview=genxapi"
          >
            Get started
          </Link>
          <Link
            className="rounded-xl border border-border bg-surface px-4 py-2 font-semibold text-navy hover:border-primary/40 hover:text-primary transition"
            href="/docs/configuration?preview=genxapi"
          >
            Configuration
          </Link>
          <span className="text-sm font-semibold text-muted">SemVer aware · GitHub + npm ready</span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card
          title="Single source of truth"
          body="Define clients, templates, and publish targets in genxapi.config.* and run the same workflow in CI."
          href="/docs/configuration?preview=genxapi"
        />
        <Card
          title="Use any template"
          body="Default adapters ship Orval and Kubb. Swap generators or add hooks without rewriting pipelines."
          href="/docs/templates?preview=genxapi"
        />
        <Card
          title="Built for CI"
          body="Dry-runs, OpenAPI diffs, and publish helpers align with GitHub Actions and npm registries."
          href="/docs/ci-integration?preview=genxapi"
        />
      </div>
    </Layout>
  );
}

function Card({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link
      className="block rounded-2xl border border-border bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
      href={href}
    >
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
        Learn more →
      </span>
    </Link>
  );
}
