import { items } from "@wix/data";
import { auth } from "@wix/essentials";
import { COLLECTIONS as C } from "../wix/collections";
import {
  analyticsEventSchema,
  rangeSchema,
  type AnalyticsRecord,
} from "../../schemas/analytics";
import { aggregate } from "../analytics/aggregate";
import { ApiError, identity } from "./server";
const insertEvent = auth.elevate(items.insert);
const buckets = new Map<string, { count: number; reset: number }>();
export async function recordEvent(input: unknown) {
  const event = analyticsEventSchema.parse(input);
  const token = await identity(false);
  const key = `${token.siteId}:${token.subjectId}`;
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const bucket = buckets.get(key);
  if (bucket && bucket.reset > now) {
    if (bucket.count >= 120)
      throw new ApiError(
        429,
        "RATE_LIMIT",
        "Please wait before sending more events.",
      );
    bucket.count++;
  } else buckets.set(key, { count: 1, reset: now + 60000 });
  const slider = await items.get(C.published, event.sliderId);
  if (!slider || !slider.settings?.analytics)
    throw new ApiError(404, "NOT_FOUND", "Published slider not found.");
  if (
    event.slideId &&
    !slider.slides?.some((s: { _id: string }) => s._id === event.slideId) &&
    !slider.settings?.collectionId
  )
    throw new ApiError(400, "VALIDATION_ERROR", "Unknown slide.");
  // Only this validated append is elevated; visitors cannot read or mutate analytics.
  await insertEvent(C.analytics, {
    ...event,
    _id: event.eventId,
    timestamp: new Date().toISOString(),
  });
  return { recorded: true };
}
export async function readAnalytics(url: URL) {
  const to = url.searchParams.get("to") ?? new Date().toISOString();
  const from =
    url.searchParams.get("from") ??
    new Date(Date.now() - 30 * 86400000).toISOString();
  rangeSchema.parse({ from, to });
  let query = items
    .query(C.analytics)
    .ge("timestamp", from)
    .le("timestamp", to)
    .ascending("timestamp")
    .limit(1000);
  const sliderId = url.searchParams.get("sliderId");
  if (sliderId) query = query.eq("sliderId", sliderId);
  let page = await query.find();
  const events = [...page.items];
  while (page.hasNext()) {
    page = await page.next();
    events.push(...page.items);
  }
  const parsed: AnalyticsRecord[] = events.map((v) => ({
    ...analyticsEventSchema.parse({
      sliderId: v.sliderId,
      slideId: v.slideId,
      event: v.event,
      sessionId: v.sessionId,
      page: v.page,
      device: v.device,
      eventId: v.eventId,
    }),
    timestamp: String(v.timestamp),
  }));
  return aggregate(parsed);
}
