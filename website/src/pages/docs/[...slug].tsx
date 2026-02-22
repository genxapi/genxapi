import type { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { Layout } from "../../components/Layout";
import { docPathToSlug, getAllDocFilePaths, getDocBySlug } from "../../lib/docs";
import { mdxComponents } from "../../mdx-components";

type Props = {
  mdxSource: MDXRemoteSerializeResult;
  title: string;
  slug: string[];
};

export default function DocPage({ mdxSource, title }: Props) {
  return (
    <Layout title={title}>
      <MDXRemote {...mdxSource} components={mdxComponents} />
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
