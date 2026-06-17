import { useEffect, forwardRef } from "react";
import Lenis from "@studio-freight/lenis";

const SmoothScroll = forwardRef(({ children }, ref) => {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: false,
      wrapper: window,
      content: document.documentElement,
    });

    if (ref) ref.current = lenis;

    // Expose stop/start for Navbar mobile menu (avoids overflow:hidden on body)
    window.__lenisStop  = () => lenis.stop();
    window.__lenisStart = () => lenis.start();

    // Emit scroll position so Navbar can read real scroll (window.scrollY stays 0 with Lenis)
    lenis.on("scroll", ({ scroll }) => {
      window.dispatchEvent(new CustomEvent("lenis-scroll", { detail: { scroll } }));
    });

    let rafId   = 0;
    let lastTime = -1;

    const raf = (time) => {
      if (time !== lastTime) {
        lenis.raf(time);
        lastTime = time;
      }
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    let resizeTimer = 0;
    const scheduleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => lenis.resize(), 150);
    };

    const ro = new ResizeObserver(scheduleResize);
    ro.observe(document.documentElement);
    window.addEventListener("resize", scheduleResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.__lenisStop  = null;
      window.__lenisStart = null;
      lenis.destroy();
      if (ref) ref.current = null;
    };
  }, [ref]);

  return children;
});

SmoothScroll.displayName = "SmoothScroll";
export default SmoothScroll;