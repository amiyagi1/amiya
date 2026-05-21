// _app.js
import Navbar from "../components/Navbar";
import { useRouter } from "next/router";
import "../styles/globals.css";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useRef } from "react";
import SmoothScroll from "../components/Smooth";
import TopLoader from "../components/TopLoader";
import dynamic from "next/dynamic";

// Preload immediately — don't lazy load on first click
const Gyroid = dynamic(() => import("../components/Gyroid"), {
  ssr: false,
  loading: () => null,
});

// Eagerly preload the chunk so it's ready before user clicks anything
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
    AOS.init({ once: false, duration: 900, easing: "ease-in-out" });
    const handleRouteChange = () => {
      setTimeout(() => {
        AOS.refreshHard();
        if (lenisRef.current) {
          lenisRef.current.resize();
          lenisRef.current.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }, 100);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
          {/* fullscreen entry loader — exits once Gyroid is ready */}
      <TopLoader />     {/* route change progress bar */}
      <Gyroid />
      <SmoothScroll ref={lenisRef}>
        <Navbar />
        <Component {...pageProps} />
      </SmoothScroll>
    </>
  );
}

export default MyApp;