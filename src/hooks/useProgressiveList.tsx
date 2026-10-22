import { useEffect, useRef, useState } from "react";

/** Affiche une liste par tranches ; charge la suite quand la sentinelle devient visible. */
export function useProgressiveList<T>(items: T[], pageSize = 50, resetKey: unknown = items) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setCount(pageSize); }, [resetKey, pageSize]);

  const hasMore = count < items.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setCount((c) => c + pageSize);
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, pageSize, items.length]);

  return {
    visible: items.slice(0, count),
    hasMore,
    total: items.length,
    shown: Math.min(count, items.length),
    loadMore: () => setCount((c) => c + pageSize),
    sentinelRef,
  };
}
