import type { GetStaticProps } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { ComingSoon } from "../components/ComingSoon";
import { Layout } from "../components/Layout";
import { getDocBySlug } from "../lib/docs";
import { usePreviewGate } from "../lib/preview";
import { mdxComponents } from "../mdx-components";

type Props = {
  mdxSource: MDXRemoteSerializeResult;
  title: string;
};

export default function OverviewPage({ mdxSource, title }: Props) {
  const previewEnabled = usePreviewGate();

  if (!previewEnabled) {
    return <ComingSoon />;
  }

  return (
    <Layout title={title}>
      <MDXRemote {...mdxSource} components={mdxComponents} />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const doc = await getDocBySlug(["overview"]);

  if (!doc || !doc.source) {
    return { notFound: true };
  }

  return {
    props: {
      mdxSource: doc.source,
      title: doc.title
    }
  };
};
