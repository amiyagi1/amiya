import Head from "next/head";
import Script from "next/script";
import Main from "../components/Main"; // Keep main section immediate loading
import { useEffect } from "react"; // Import useEffect
import AOS from "aos"; // Import AOS
import "aos/dist/aos.css"; // Import AOS styles


export default function Home() {
  // Initialize AOS when the component mounts
  useEffect(() => {
    AOS.refresh();
  }, []);

  return (
    <>
      <Head>
        {/* Preload critical assets */}
        <link
          rel="preload"
          href="/favicon.ico"
          as="image"
          type="image/x-icon"
        />

        <title>AR3D-Portfolio of Amiya</title>
        <meta
          name="description"
          content="Portfolio of Amiya - Showcasing 3D designs, creative works, and professional experiences. Expert in 3D modeling and design."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Add more meta tags for SEO */}
        <meta property="og:title" content="AR3D-Portfolio of Amiya" />
        <meta
          property="og:description"
          content="Portfolio of Amiya - Showcasing 3D designs and creative works"
        />
        <meta name="robots" content="index, follow" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>

      <div className="min-h-screen w-screen scrollbar-hide">
        {/* Load Google Analytics script with priority */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-XXT8KNHF8C"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXT8KNHF8C');
          `}
        </Script>

     
        <Main />
      </div>
    </>
  );
}
