import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import gsap from "gsap";

const isBrowser = typeof window !== "undefined";

const NavLink = memo(({ href, external, children, onClick, className = "" }) => {
  if (!href) return null;
  const linkClassName = `hover:text-sky-500 transition-colors ${className}`.trim();
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={linkClassName} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} scroll={true} className={linkClassName} onClick={onClick}>
      {children}
    </Link>
  );
});
NavLink.displayName = "NavLink";

const navLinks = [
  { href: "/",     label: "Home",   id: "nav-home" },
  { href: "/work", label: "Works",  id: "nav-works" },
  { href: "/info", label: "Info",   id: "nav-about" },
  {
    href: "https://drive.google.com/file/d/1X_tJFwPZENrybc325suhonCEmZPKcGWq/view",
    label: "Resume", external: true, id: "nav-resume",
  },
];

const Navbar = memo(() => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const router     = useRouter();
  const isHomePage = router.pathname === "/";

  const headerRef  = useRef(null);
  const itemsRef   = useRef([]);
  const overlayRef = useRef(null);
  const overlayItemsRef = useRef([]);

  // ── Initial entrance ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!headerRef.current) return;
    const header = headerRef.current;
    const items  = itemsRef.current.filter(Boolean);

    gsap.set(header, { opacity: 0, y: isHomePage ? 20 : -20 });
    gsap.set(items,  { opacity: 0, y: isHomePage ? 10 : -10 });

    const delay = isHomePage ? 0.5 : 0.3;
    gsap.to(header, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay });
    gsap.to(items,  { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out',
      stagger: 0.07, delay: delay + 0.15 });
  }, [mounted, isHomePage]);

  // ── Route transitions ──────────────────────────────────────────────────────
  useEffect(() => {
    const header = headerRef.current;
    const items  = itemsRef.current.filter(Boolean);
    if (!header) return;

    const onStart = () => {
      gsap.to(items,  { opacity: 0, y: -6,  duration: 0.18, ease: 'power2.in', stagger: 0.03 });
      gsap.to(header, { opacity: 0, y: -10, duration: 0.2,  ease: 'power2.in', delay: 0.05 });
    };

    const onComplete = (url) => {
      const goingHome = url === '/';
      gsap.set(header, { y: goingHome ? 20 : -20 });
      gsap.set(items,  { y: goingHome ? 10 : -10, opacity: 0 });
      gsap.to(header, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.15 });
      gsap.to(items,  { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out',
        stagger: 0.07, delay: 0.28 });
    };

    router.events.on('routeChangeStart',    onStart);
    router.events.on('routeChangeComplete', onComplete);
    return () => {
      router.events.off('routeChangeStart',    onStart);
      router.events.off('routeChangeComplete', onComplete);
    };
  }, [router.events]);

  // ── Mobile overlay animation ───────────────────────────────────────────────
  useEffect(() => {
    const overlay = overlayRef.current;
    const items   = overlayItemsRef.current.filter(Boolean);
    if (!overlay) return;

    if (isMenuOpen) {
      gsap.set(overlay, { display: 'flex' });
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(items,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.07, delay: 0.1 }
      );
    } else {
      gsap.to(items,   { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in', stagger: 0.03 });
      gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in', delay: 0.1,
        onComplete: () => { if (overlay) overlay.style.display = 'none'; }
      });
    }
  }, [isMenuOpen]);

  // ── Scroll ─────────────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!isBrowser) return;
    setIsScrolled(window.scrollY >= 90);
  }, []);

  useEffect(() => {
    setMounted(true);
    handleScroll();
    return () => setMounted(false);
  }, [handleScroll]);

  useEffect(() => {
    if (!isBrowser) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    if (isBrowser) document.body.style.overflow = !isMenuOpen ? "hidden" : "";
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    if (isBrowser) document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!isBrowser || !isMenuOpen) return;
    const handleEscape = (e) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen, closeMenu]);

  if (!mounted) return <header className="fixed top-0 w-full h-[72px] bg-transparent" />;

  const navbarStyles = {
    backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.8)" : "transparent",
    color: "#7c9ca3",
  };

  // All nav items including Home for other pages
  const allLinks = [{ href: "/", label: "Home", id: "nav-home", external: false }, ...navLinks.filter(l => l.href !== "/")];

  return (
    <>
      {isHomePage ? (
        // ── HOME — centered at bottom ──────────────────────────────────────
        <header
          ref={headerRef}
          style={navbarStyles}
          className={`fixed bottom-[108px] w-full flex justify-center items-center z-[50] ${isScrolled ? "backdrop-blur-sm shadow-lg" : ""}`}
          role="banner"
        >
          <nav role="navigation" aria-label="Main navigation">
            <ul className="flex items-center uppercase font-omiofont3 text-[12px] lg:tracking-[0.5em] md:tracking-[0.4em] sm:tracking-[0.3em] tracking-wide justify-center flex-wrap lg:gap-36 md:gap-24 sm:gap-12 gap-8">
              {navLinks
                .filter((l) => l.href !== "/")
                .map(({ href, label, external, id }, i) => (
                  <li key={id} ref={(el) => (itemsRef.current[i] = el)}>
                    <NavLink href={href} external={external} onClick={closeMenu}>
                      {label}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </nav>
        </header>
      ) : (
        // ── OTHER PAGES — all links right ─────────────────────────────────
        <header
          ref={headerRef}
          style={navbarStyles}
          className={`fixed top-0 w-full z-[50] ${isScrolled ? "backdrop-blur-sm shadow-lg" : ""}`}
          role="banner"
        >
          <div className="flex justify-end items-center w-full h-[72px] lg:px-6 md:px-4 px-3">
            <nav className="hidden md:block" role="navigation" aria-label="Main navigation">
              <ul className="flex items-center font-omiofont3 text-[12px] uppercase tracking-[0.5em] lg:gap-12 md:gap-8 gap-6">
                {allLinks.map(({ href, label, external, id }, i) => (
                  <li key={id} ref={(el) => (itemsRef.current[i] = el)}>
                    <NavLink href={href} external={external} onClick={closeMenu}>
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Mobile hamburger */}
            <button
              ref={(el) => (itemsRef.current[allLinks.length] = el)}
              onClick={toggleMenu}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen
                ? <X    className="h-6 w-6" aria-hidden="true" />
                : <Menu className="h-6 w-6" aria-hidden="true" />
              }
            </button>
          </div>
        </header>
      )}

      {/* Mobile overlay — always in DOM, shown/hidden via GSAP */}
      <div
        ref={overlayRef}
        style={{ display: 'none' }}
        className="fixed inset-0 bg-black z-[100] md:hidden flex-col items-center justify-center"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={closeMenu}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg"
          aria-label="Close menu"
          style={{ color: '#7c9ca3' }}
        >
          <X className="h-6 w-6" />
        </button>
        <ul className="space-y-8 text-center">
          {allLinks.map(({ href, label, external, id }, i) => (
            <li
              key={id}
              ref={(el) => (overlayItemsRef.current[i] = el)}
              className="text-xl uppercase tracking-wider"
            >
              <NavLink href={href} external={external} onClick={closeMenu} className="block py-2 px-4">
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
});

Navbar.displayName = "Navbar";
export default Navbar;