'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import gsap from 'gsap';

const Loader = () => {
  const topRef      = useRef(null);
  const bottomRef   = useRef(null);
  const progressRef = useRef(null);
  const router      = useRouter();

  useEffect(() => {
    const top      = topRef.current;
    const bottom   = bottomRef.current;
    const progress = progressRef.current;
    if (!top || !bottom || !progress) return;

    // Progress bar grows 0 → 100%
    gsap.fromTo(progress,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.4, ease: 'power2.inOut', transformOrigin: 'left center' }
    );

    let raf;
    function waitForGyroid() {
      if (window.__gyroidReady) exit();
      else raf = requestAnimationFrame(waitForGyroid);
    }
    const minWait = setTimeout(() => waitForGyroid(), 1400);

    function exit() {
      const isHome = window.location.pathname === '/';

      // Always hide progress bar + its wrapper completely
      const progressWrapper = progress.parentElement;
      gsap.to(progress, {
        opacity: 0,
        scaleX: 0,
        duration: 0.4,
        ease: 'power2.in',
        transformOrigin: 'right center',
      });
      gsap.to(progressWrapper, {
        opacity: 0,
        duration: 0.4,
        delay: 0.1,
        onComplete: () => {
          progressWrapper.style.display = 'none';
        },
      });

      if (isHome) {
        gsap.to(top,    { yPercent: -80, duration: 1.0, ease: 'power4.inOut', delay: 0.2 });
        gsap.to(bottom, { yPercent:  80, duration: 1.0, ease: 'power4.inOut', delay: 0.2 });
      } else {
        gsap.to(top,    { yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.2 });
        gsap.to(bottom, {
          yPercent: 100, duration: 0.9, ease: 'power4.inOut', delay: 0.2,
          onComplete: () => {
            top.style.display    = 'none';
            bottom.style.display = 'none';
          },
        });
      }
    }

    return () => {
      clearTimeout(minWait);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const top    = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    const handleRouteChange = (url) => {
      const isHome = url === '/';
      if (!isHome) {
        gsap.to(top,    { yPercent: -100, duration: 0.7, ease: 'power3.inOut' });
        gsap.to(bottom, {
          yPercent: 100, duration: 0.7, ease: 'power3.inOut',
          onComplete: () => {
            top.style.display    = 'none';
            bottom.style.display = 'none';
          },
        });
      } else {
        top.style.display    = 'block';
        bottom.style.display = 'block';
        gsap.to(top,    { yPercent: -80, duration: 0.7, ease: 'power3.inOut' });
        gsap.to(bottom, { yPercent:  80, duration: 0.7, ease: 'power3.inOut' });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  const panelStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    height: '50vh',
    backgroundColor: '#000',
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Top panel — no progress bar inside */}
      <div ref={topRef} style={{ ...panelStyle, top: 0 }} />

      {/* Bottom panel */}
      <div ref={bottomRef} style={{ ...panelStyle, bottom: 0 }} />

      {/* Progress bar — completely independent, always removed after load */}
      <div style={{
        position: 'fixed',
        top: '50vh',           // sits exactly on the seam between panels
        left: '10%',
        right: '10%',
        height: '1px',
        backgroundColor: 'hsla(192, 18%, 49%, 0.15)',
        zIndex: 10000,
        pointerEvents: 'none',
        overflow: 'hidden',
        transform: 'translateY(-50%)',
      }}>
        <div
          ref={progressRef}
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, hsla(192,18%,49%,0.4), hsla(210,60%,60%,0.9), hsla(192,18%,49%,0.4))',
            transformOrigin: 'left center',
          }}
        />
      </div>
    </>
  );
};

export default Loader;