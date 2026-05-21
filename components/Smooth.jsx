import { useEffect, forwardRef } from "react";
import Lenis from "@studio-freight/lenis";

const SmoothScroll = forwardRef(({ children }, ref) => {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: false,
    });

    if (ref) {
      ref.current = lenis;
    }

    let rafId = 0;

    const raf = (time) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    const handleResize = () => {
      lenis.resize();
    };

    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    resizeObserver.observe(document.body);
    window.addEventListener("resize", handleResize);
    window.addEventListener("load", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      lenis.destroy();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);

      if (ref) {
        ref.current = null;
      }
    };
  }, [ref]);

  return children;
});

SmoothScroll.displayName = 'SmoothScroll';

export default SmoothScroll;
