import Link from "next/link";
import { PREVIEW_QUERY } from "./lib/preview";

const cx = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(" ");

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
  h2: (props: any) => {
    const { className, ...rest } = props;
    return (
      <h2
        {...rest}
        className={cx(
          "my-2 text-4xl font-semibold leading-tight tracking-[-0.01em] text-navy",
          className
        )}
      >
        {props.children}
      </h2>
    );
  },
  h3: (props: any) => {
    const { className, ...rest } = props;
    return (
      <h3
        {...rest}
        className={cx("my-2 text-2xl font-semibold leading-snug text-navy", className)}
      >
        {props.children}
      </h3>
    );
  },
  h4: (props: any) => {
    const { className, ...rest } = props;
    return (
      <h4 {...rest} className={cx("my-2 text-xl font-semibold text-navy", className)}>
        {props.children}
      </h4>
    );
  },
  a: (props: any) => {
    const href = props.href ?? "#";
    const isExternal =
      href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
    const normalizedHref = isExternal ? href : normalizeDocHref(href);
    const targetHref = isExternal ? normalizedHref : withPreview(normalizedHref);
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

function normalizeDocHref(href: string) {
  if (!href) return "#";
  if (href.startsWith("#")) return href;

  const [pathWithQuery, hashPart] = href.split("#", 2);
  const [pathPart, queryPart] = pathWithQuery.split("?", 2);

  let path = pathPart;

  const isMarkdownLink = /\.(md|mdx)$/i.test(path);
  if (isMarkdownLink) {
    let cleanPath = path.replace(/\.(md|mdx)$/i, "");
    cleanPath = cleanPath.replace(/^\.?\//, "");
    cleanPath = cleanPath.replace(/^docs\//, "");
    while (cleanPath.startsWith("../")) {
      cleanPath = cleanPath.slice(3);
    }
    path = `/docs/${cleanPath}`;
  } else if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const query = queryPart ? `?${queryPart}` : "";
  const hash = hashPart ? `#${hashPart}` : "";

  return `${path}${query}${hash}`;
}

function withPreview(href: string) {
  if (!href || href.startsWith("#")) return href;
  if (href.includes("preview=")) return href;
  const hasQuery = href.includes("?");
  return `${href}${hasQuery ? "&" : "?"}${PREVIEW_QUERY.replace("?", "")}`;
}
