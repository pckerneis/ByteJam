import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { Layout } from '../components/Layout';
import 'highlight.js/styles/tomorrow-night-blue.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
