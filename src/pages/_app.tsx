import { AppProps } from 'next/app';

// This file is kept minimal to avoid conflicts with the App Router
function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp; 