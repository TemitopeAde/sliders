import { useEffect, useRef, useState, type RefObject } from "react";

/** Start loading this far before the slider scrolls into view. */
const VIEWPORT_MARGIN = "300px";

/** True once the element has come within VIEWPORT_MARGIN of the viewport.
 * Stays true afterwards, so media isn't unloaded when scrolling away. */
export function useNearViewport(
  ref: RefObject<Element | null>,
  enabled = true,
) {
  const [near, setNear] = useState(!enabled);
  useEffect(() => {
    if (!enabled) {
      setNear(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: VIEWPORT_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled]);
  return near;
}

/** Visible slides plus one on each side, wrapping when the slider loops. */
export function nearbySlides(
  active: number,
  count: number,
  perView = 1,
  loop = false,
) {
  const near = new Set<number>();
  for (let i = active - 1; i <= active + Math.ceil(perView); i++) {
    if (loop) near.add(((i % count) + count) % count);
    else if (i >= 0 && i < count) near.add(i);
  }
  return near;
}

/** Remembers every slide that has been near, so its media stays loaded. */
export function useLoadedSlides(ids: string[], near: Set<number>, on: boolean) {
  const loaded = useRef(new Set<string>());
  if (on) for (const i of near) if (ids[i]) loaded.current.add(ids[i]);
  return loaded.current;
}
