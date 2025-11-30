import type { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { ComingSoon } from "../../components/ComingSoon";
import { Layout } from "../../components/Layout";
import { docPathToSlug, getAllDocFilePaths, getDocBySlug } from "../../lib/docs";
import { usePreviewGate } from "../../lib/preview";
import { mdxComponents } from "../../mdx-components";

type Props = {
  mdxSource: MDXRemoteSerializeResult;
  title: string;
  slug: string[];
};

export default function DocPage({ mdxSource, title, slug }: Props) {
  const previewEnabled = usePreviewGate();

  if (!previewEnabled) {
    return <ComingSoon />;
  }

  return (
    <Layout title={title}>
      <MDXRemote {...mdxSource} components={mdxComponents} />
      <div className="mt-10 rounded-2xl border border-border bg-surface/60 p-4 text-sm text-muted">
        Viewing preview content for <code>{slug.join("/")}</code>.
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllDocFilePaths().map((file) => ({
    params: { slug: docPathToSlug(file) }
  }));

  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam)
    ? (slugParam.filter(Boolean) as string[])
    : slugParam
      ? [slugParam as string]
      : [];

  if (!slug.length) {
    return { notFound: true };
  }

  const doc = await getDocBySlug(slug);

  if (!doc || !doc.source) {
    return { notFound: true };
  }

  return {
    props: {
      mdxSource: doc.source,
      title: doc.title,
      slug
    }
  };
};
