import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

export type DocEntry = {
  slug: string[];
  title: string;
  content: string;
  source?: Awaited<ReturnType<typeof serialize>>;
};

const DOCS_DIR = path.resolve(process.cwd(), "../docs");

export function getAllDocFilePaths(): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
        results.push(full);
      }
    }
  }

  walk(DOCS_DIR);
  return results;
}

export function docPathToSlug(filePath: string): string[] {
  const relative = path.relative(DOCS_DIR, filePath);
  const noExt = relative.replace(/\\+/g, "/").replace(/\.(md|mdx)$/, "");
  return noExt.split("/");
}

export async function getDocBySlug(slug: string[]) {
  const filePath = path.join(DOCS_DIR, `${slug.join("/")}.md`);
  const filePathMdx = path.join(DOCS_DIR, `${slug.join("/")}.mdx`);
  const resolved = fs.existsSync(filePath) ? filePath : filePathMdx;
  if (!resolved || !fs.existsSync(resolved)) {
    return null;
  }

  const file = fs.readFileSync(resolved, "utf-8");
  const { content, data } = matter(file);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm]
    },
    parseFrontmatter: false
  });

  const title = typeof data.title === "string" ? data.title : slug[slug.length - 1];

  return {
    slug,
    title,
    content,
    source: mdxSource
  };
}
