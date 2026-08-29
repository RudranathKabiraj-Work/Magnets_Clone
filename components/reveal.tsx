"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 0.88 * window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    io.observe(el);
    setActive(true);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform,filter] duration-700 ease-out ${
        active && !visible && "translate-y-10 opacity-0 blur-[2px]"
      } ${visible && "translate-y-0 opacity-100"} ${className}`}
      style={visible ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}