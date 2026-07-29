"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function FloatingBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #C9A24A 0%, transparent 70%)" }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-[0.02]"
        style={{ background: "radial-gradient(circle, #C9A24A 0%, transparent 70%)" }}
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-[0.015]"
        style={{ background: "radial-gradient(circle, #E6C879 0%, transparent 70%)" }}
        animate={{
          x: ["-50%", "-40%", "-50%"],
          y: ["-50%", "-60%", "-50%"],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function useMouseGradient() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mouse-x", `${x}%`);
      el.style.setProperty("--mouse-y", `${y}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return ref;
}
