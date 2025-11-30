import Link from "next/link";
import { PREVIEW_QUERY } from "./lib/preview";

export const mdxComponents = {
  a: (props: any) => {
    const href = props.href ?? "#";
    const isExternal = href.startsWith("http");
    const targetHref = isExternal ? href : withPreview(href);
    return isExternal ? (
      <a {...props} href={targetHref} target="_blank" rel="noreferrer" />
    ) : (
      <Link href={targetHref}>{props.children}</Link>
    );
  },
  pre: (props: any) => (
    <pre
      className="overflow-x-auto rounded-xl border border-border bg-navy/90 px-4 py-3 text-sm text-white shadow-inner"
      {...props}
    />
  ),
  code: (props: any) => <code className="font-mono text-[0.95em]" {...props} />
};

function withPreview(href: string) {
  if (href.includes("preview=")) return href;
  const hasQuery = href.includes("?");
  return `${href}${hasQuery ? "&" : "?"}${PREVIEW_QUERY.replace("?", "")}`;
}
