"use client";

import { useEffect } from "react";

export default function SmoothScroll() {
  useEffect(() => {
    // Only initialize on desktop screens (width >= 1024px)
    if (typeof window === "undefined" || window.innerWidth < 1024) return;

    let frameId: number;
    let lenisInstance: InstanceType<typeof import("lenis").default> | null = null;

    const initLenis = async () => {
      const { default: Lenis } = await import("lenis");

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
      });

      lenisInstance = lenis;

      // Expose lenis globally so navbar links can use lenis.scrollTo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__lenis = lenis;

      function raf(time: number) {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      }
      frameId = requestAnimationFrame(raf);

      // Fix bfcache: pause Lenis when page is hidden, resume when shown
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          lenis.stop();
          cancelAnimationFrame(frameId);
        } else {
          lenis.start();
          frameId = requestAnimationFrame(raf);
        }
      };

      // Fix bfcache: restore Lenis state on pageshow (back/forward navigation)
      const handlePageShow = (e: PageTransitionEvent) => {
        if (e.persisted) {
          lenis.start();
          frameId = requestAnimationFrame(raf);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("pageshow", handlePageShow);
    };

    // Defer Lenis init until the browser is idle — keeps it off the critical path
    // so it doesn't block interactivity (TBT). Falls back to setTimeout on Safari.
    let idleCallbackId: number;
    if ("requestIdleCallback" in window) {
      idleCallbackId = requestIdleCallback(() => { initLenis(); }, { timeout: 2000 });
    } else {
      const t = setTimeout(initLenis, 300);
      return () => clearTimeout(t);
    }

    return () => {
      cancelIdleCallback(idleCallbackId);
      cancelAnimationFrame(frameId);
      if (lenisInstance) {
        lenisInstance.destroy();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__lenis;
      }
    };
  }, []);

  return null;
}
