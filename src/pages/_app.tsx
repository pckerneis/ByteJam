import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';
import { Layout } from '../components/Layout';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // optional: ignore registration errors
      });
  }, []);

  return (
    <>
      <Head>
        <title>BytebeatCloud</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
