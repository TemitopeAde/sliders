import { items } from "@wix/data";
import { auth } from "@wix/essentials";
import { COLLECTIONS as C } from "../wix/collections";
import { analyticsEventSchema, rangeSchema } from "../../schemas/analytics";
import { createAggregator } from "../analytics/aggregate";
import { ApiError, identity } from "./server";
const insertEvent = auth.elevate(items.insert);
const getEvent = auth.elevate(items.get);
const queryEvents = auth.elevate(items.query);
const SESSION_LIMIT = 120;
const RETENTION_DAYS = 400;
// Quick per-instance burst guard; the stored per-session count below also
// holds across server instances.
const buckets = new Map<string, { count: number; reset: number }>();
function burstGuard(key: string) {
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const bucket = buckets.get(key);
  if (bucket && bucket.reset > now) {
    if (bucket.count >= SESSION_LIMIT) throw rateLimited();
    bucket.count++;
  } else buckets.set(key, { count: 1, reset: now + 60000 });
}
const rateLimited = () =>
  new ApiError(429, "RATE_LIMIT", "Please wait before sending more events.");
export async function recordEvent(input: unknown) {
  const event = analyticsEventSchema.parse(input);
  const token = await identity(false);
  burstGuard(`${token.siteId}:${token.subjectId}`);
  const slider = await items.get(C.published, event.sliderId);
  if (!slider || !slider.settings?.analytics)
    throw new ApiError(404, "NOT_FOUND", "Published slider not found.");
  if (
    event.slideId &&
    !slider.slides?.some((s: { _id: string }) => s._id === event.slideId) &&
    !slider.settings?.collectionId
  )
    throw new ApiError(400, "VALIDATION_ERROR", "Unknown slide.");
  const recent = await queryEvents(C.analytics)
    .eq("sessionId", event.sessionId)
    .ge("timestamp", new Date(Date.now() - 60000).toISOString())
    .count();
  if (recent >= SESSION_LIMIT) throw rateLimited();
  // Only this validated append is elevated; visitors cannot read or mutate analytics.
  try {
    await insertEvent(C.analytics, {
      ...event,
      _id: event.eventId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // A retried event already stored under its eventId counts once.
    if (await getEvent(C.analytics, event.eventId).catch(() => null))
      return { recorded: true };
    throw error;
  }
  return { recorded: true };
}
/** Removes one batch of events past the retention window. */
async function pruneOldEvents() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
  try {
    const old = await items
      .query(C.analytics)
      .lt("timestamp", cutoff.toISOString())
      .limit(1000)
      .find();
    const ids = old.items.map((v) => String(v._id));
    if (ids.length) await items.bulkRemove(C.analytics, ids);
  } catch (error) {
    console.warn("Could not prune old analytics events", error);
  }
}
export async function readAnalytics(url: URL) {
  const to = url.searchParams.get("to") ?? new Date().toISOString();
  const from =
    url.searchParams.get("from") ??
    new Date(Date.now() - 30 * 86400000).toISOString();
  rangeSchema.parse({ from, to });
  await pruneOldEvents();
  let query = items
    .query(C.analytics)
    .ge("timestamp", from)
    .le("timestamp", to)
    .ascending("timestamp")
    .limit(1000);
  const sliderId = url.searchParams.get("sliderId");
  if (sliderId) query = query.eq("sliderId", sliderId);
  const aggregator = createAggregator();
  let page = await query.find();
  for (;;) {
    for (const v of page.items) {
      const parsed = analyticsEventSchema.safeParse({
        sliderId: v.sliderId,
        slideId: v.slideId || undefined,
        event: v.event,
        sessionId: v.sessionId,
        page: v.page,
        device: v.device,
        eventId: v.eventId,
      });
      // Skip a malformed row instead of failing the whole report.
      if (parsed.success)
        aggregator.add({ ...parsed.data, timestamp: String(v.timestamp) });
    }
    if (!page.hasNext()) break;
    page = await page.next();
  }
  return aggregator.result();
}
