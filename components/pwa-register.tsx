"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Franchise PWA ServiceWorker registered:", reg.scope))
        .catch((err) => console.log("Franchise PWA ServiceWorker error:", err));
    }
  }, []);

  return null;
}
