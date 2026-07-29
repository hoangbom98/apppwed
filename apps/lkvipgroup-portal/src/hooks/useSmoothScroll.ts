"use client";

import { useEffect } from "react";

export function useSmoothScroll() {
  useEffect(() => {
    const html = document.documentElement;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = "";
    };
  }, []);
}
