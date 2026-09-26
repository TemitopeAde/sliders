import type { AnalyticsRecord } from "../../schemas/analytics";
export function aggregate(events: AnalyticsRecord[]) {
  const views = events.filter((e) => e.event === "slider_impression");
  const clicks = events.filter((e) =>
    ["cta_click", "product_click", "add_to_cart_click"].includes(e.event),
  );
  const plays = events.filter((e) => e.event === "video_play");
  const counts = (key: "sliderId" | "slideId" | "device" | "page") => {
    const map = new Map<string, { views: number; clicks: number }>();
    for (const e of events) {
      const id = e[key];
      if (!id) continue;
      const value = map.get(id) ?? { views: 0, clicks: 0 };
      if (
        e.event ===
        (key === "slideId" ? "slide_impression" : "slider_impression")
      )
        value.views++;
      if (["cta_click", "product_click", "add_to_cart_click"].includes(e.event))
        value.clicks++;
      map.set(id, value);
    }
    return [...map]
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.views - a.views);
  };
  const daily = new Map<string, { views: number; clicks: number }>();
  for (const e of events) {
    const day = e.timestamp.slice(0, 10);
    const v = daily.get(day) ?? { views: 0, clicks: 0 };
    if (e.event === "slider_impression") v.views++;
    if (["cta_click", "product_click", "add_to_cart_click"].includes(e.event))
      v.clicks++;
    daily.set(day, v);
  }
  return {
    views: views.length,
    uniqueViews: new Set(views.map((e) => e.sessionId)).size,
    clicks: clicks.length,
    ctr: views.length ? (clicks.length / views.length) * 100 : 0,
    videoPlays: plays.length,
    sliders: counts("sliderId"),
    slides: counts("slideId"),
    devices: counts("device"),
    pages: counts("page"),
    daily: [...daily]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v })),
  };
}
export type AnalyticsSummary = ReturnType<typeof aggregate>;
