import Link from "next/link";

const cx = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(" ");

export const mdxComponents = {
  h1: (props: any) => {
    const { className, ...rest } = props;
    return (
      <h1
        {...rest}
        className={cx(
          "mb-6 sm:mb-7 text-[clamp(2rem,4vw+1rem,3.75rem)] font-bold leading-[1.1] tracking-[-0.015em] text-navy",
          className
        )}
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
          "mt-10 mb-4 text-[clamp(1.5rem,2.5vw+1rem,2.5rem)] font-semibold leading-[1.2] tracking-[-0.01em] text-navy",
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
        className={cx(
          "mt-8 mb-3 text-[clamp(1.25rem,1.6vw+1rem,1.75rem)] font-semibold leading-[1.3] text-navy",
          className
        )}
      >
        {props.children}
      </h3>
    );
  },
  h4: (props: any) => {
    const { className, ...rest } = props;
    return (
      <h4
        {...rest}
        className={cx(
          "mt-6 mb-2 text-base sm:text-lg font-semibold leading-[1.4] text-navy",
          className
        )}
      >
        {props.children}
      </h4>
    );
  },
  a: (props: any) => {
    const { className, children, ...rest } = props;
    const href = props.href ?? "#";
    const isExternal =
      href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
    const normalizedHref = isExternal ? href : normalizeDocHref(href);
    const linkClass = cx(
      "text-primary underline underline-offset-4 decoration-primary/40 transition hover:text-navy hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      className
    );
    return isExternal ? (
      <a
        {...rest}
        className={linkClass}
        href={normalizedHref}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    ) : (
      <Link className={linkClass} href={normalizedHref}>
        {children}
      </Link>
    );
  },
  pre: (props: any) => (
    <div className="my-pre-block">
      <pre
        className="overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-[#0E1326] px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm leading-relaxed text-white shadow-inner my-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1326]"
        tabIndex={0}
        {...props}
      />
    </div>
  ),
  code: (props: any) => (
    <code
      className="font-mono text-[0.95em] font-medium rounded-md bg-primary/10 px-1.5 py-0.5 text-navy"
      {...props}
    />
  ),
  p: (props: any) => {
    const { className, ...rest } = props;
    return (
      <p
        {...rest}
        className={cx("my-p-block text-base sm:text-lg leading-relaxed text-navy/90", className)}
      >
        {props.children}
      </p>
    );
  },
  ul: (props: any) => {
    const { className, ...rest } = props;
    return (
      <ul
        {...rest}
        className={cx(
          "my-ul-block list-disc pl-5 text-base sm:text-lg space-y-2 sm:space-y-3",
          className
        )}
      >
        {props.children}
      </ul>
    );
  },
  ol: (props: any) => (
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
