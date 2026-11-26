/** Register the minimal offline service worker in production only. */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.warn("KLYRO service worker registration failed", error);
  });
}
