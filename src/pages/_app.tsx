import { AppProps } from 'next/app';
import '../app/globals.css';

// Note: This is a fallback for Vercel deployment to ensure
// the app can use both Pages Router and App Router as needed

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp; 