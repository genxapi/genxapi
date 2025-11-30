import Link from "next/link";
import { PREVIEW_QUERY } from "./lib/preview";

export const mdxComponents = {
  h1: (props: any) => {
    return (
      <h1
        {...props}
        className="mb-6 text-[3rem] font-bold leading-[1.15] tracking-[-0.01em] text-navy"
      >
        {props.children}
      </h1>
    );
  },
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
    <div className="my-pre-block">
      <pre
        className="overflow-x-auto rounded-2xl border border-border bg-[#0E1326] px-4 py-3 text-sm text-white shadow-inner my-0"
        {...props}
      />
    </div>
  ),
  code: (props: any) => (
    <code
      className="font-mono text-[0.98em] rounded-md bg-primary/10 px-1.5 py-0.5 text-navy"
      {...props}
    />
  ),
  p: (props: any) => (
    <p className="my-p-block">{props.children}</p>
  ),
  ul: (props: any) => (
    <ul className="my-ul-block">{props.children}</ul>
  )
};

function withPreview(href: string) {
  if (href.includes("preview=")) return href;
  const hasQuery = href.includes("?");
  return `${href}${hasQuery ? "&" : "?"}${PREVIEW_QUERY.replace("?", "")}`;
}
