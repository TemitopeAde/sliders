import type { AnalyticsRecord } from "../../schemas/analytics";
type Row = { views: number; clicks: number };
type Key = "sliderId" | "slideId" | "device" | "page";
const CLICKS = new Set(["cta_click", "product_click", "add_to_cart_click"]);
/** Counts events one at a time, so a large date range can be read page by
 * page without holding every event in memory. */
export function createAggregator() {
  const sessions = new Set<string>();
  const totals = {
    views: 0,
    clicks: 0,
    videoPlays: 0,
    videoPauses: 0,
    videoCompletions: 0,
    navigationClicks: 0,
    paginationClicks: 0,
  };
  const groups: Record<Key, Map<string, Row>> = {
    sliderId: new Map(),
    slideId: new Map(),
    device: new Map(),
    page: new Map(),
  };
  const daily = new Map<string, Row>();
  const bump = (map: Map<string, Row>, id: string, view: boolean) => {
    const row = map.get(id) ?? { views: 0, clicks: 0 };
    if (view) row.views++;
    else row.clicks++;
    map.set(id, row);
  };
  function add(e: AnalyticsRecord) {
    const sliderView = e.event === "slider_impression";
    const click = CLICKS.has(e.event);
    if (sliderView) {
      totals.views++;
      sessions.add(e.sessionId);
    }
    if (click) totals.clicks++;
    if (e.event === "video_play") totals.videoPlays++;
    if (e.event === "video_pause") totals.videoPauses++;
    if (e.event === "video_completion") totals.videoCompletions++;
    if (e.event === "navigation_click") totals.navigationClicks++;
    if (e.event === "pagination_click") totals.paginationClicks++;
    for (const key of Object.keys(groups) as Key[]) {
      const id = e[key];
      if (!id) continue;
      const view =
        e.event ===
        (key === "slideId" ? "slide_impression" : "slider_impression");
      if (view || click) bump(groups[key], id, view);
    }
    if (sliderView || click) bump(daily, e.timestamp.slice(0, 10), sliderView);
  }
  const rows = (map: Map<string, Row>) =>
    [...map]
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.views - a.views);
  function result() {
    return {
      ...totals,
      uniqueViews: sessions.size,
      ctr: totals.views ? (totals.clicks / totals.views) * 100 : 0,
      sliders: rows(groups.sliderId),
      slides: rows(groups.slideId),
      devices: rows(groups.device),
      pages: rows(groups.page),
      daily: [...daily]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
    };
  }
  return { add, result };
}
export function aggregate(events: AnalyticsRecord[]) {
  const aggregator = createAggregator();
  for (const e of events) aggregator.add(e);
  return aggregator.result();
}
export type AnalyticsSummary = ReturnType<typeof aggregate>;
