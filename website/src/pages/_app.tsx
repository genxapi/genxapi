import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

const META_TITLE = "GenX API - Orchestration for API client generation";
const META_DESCRIPTION =
  "GenX API is public and available now. Orchestration for API client generation with unified configuration, templates, and release automation.";
const SITE_URL = "https://genxapi.dev";
const OG_IMAGE = `${SITE_URL}/assets/genxapi-logo.png`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{META_TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={META_TITLE} />
        <meta name="twitter:description" content={META_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
