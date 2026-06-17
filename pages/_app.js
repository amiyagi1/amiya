import Navbar from "../components/Navbar";
import { useRouter } from "next/router";
import "../styles/globals.css";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useRef } from "react";
import SmoothScroll from "../components/Smooth";
import TopLoader from "../components/TopLoader";
import dynamic from "next/dynamic";

const Gyroid = dynamic(() => import("../components/Gyroid"), {
  ssr: false,
  loading: () => null,
});

if (typeof window !== "undefined") {
  import("../components/Gyroid");
}

const ROUTE_PRESETS = {
  "/":     "home",
  "/work": "work",
  "/info": "info",
};

function getPreset(asPath) {
  const p = asPath.split("?")[0];
  if (ROUTE_PRESETS[p]) return ROUTE_PRESETS[p];
  const key = Object.keys(ROUTE_PRESETS).find((k) => k !== "/" && p.startsWith(k));
  return key ? ROUTE_PRESETS[key] : "home";
}

function MyApp({ Component, pageProps }) {
  const router   = useRouter();
  const lenisRef = useRef(null);

  useEffect(() => {
    window.__gyroidPreset = getPreset(window.location.pathname);
    const handle = (url) => {
      const preset = getPreset(url);
      window.__gyroidPreset = preset;
      window.__gyroidSetPreset?.(preset);
    };
    router.events.on("routeChangeComplete", handle);
    return () => router.events.off("routeChangeComplete", handle);
  }, [router.events]);

  useEffect(() => {
    AOS.init({
      once: false,
      duration: 900,
      easing: "ease-in-out",
      // Let Lenis drive scroll position — AOS must read from window, not
      // a custom scroll container, otherwise its IntersectionObserver
      // never fires because the real scrollTop stays 0.
      startEvent: "DOMContentLoaded",
    });

    const handleRouteChange = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const lenis = lenisRef.current;
          if (lenis) {
            lenis.scrollTo(0, { immediate: true });
            lenis.resize();
          } else {
            window.scrollTo(0, 0);
          }
          // refreshHard after scroll reset so AOS re-measures correct positions
          AOS.refreshHard();
        });
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
      <TopLoader />
      <Gyroid />
      <SmoothScroll ref={lenisRef}>
        <Navbar />
        <Component {...pageProps} />
      </SmoothScroll>
    </>
  );
}

export default MyApp;