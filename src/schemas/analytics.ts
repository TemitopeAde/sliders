import { z } from "zod";
export const analyticsEventSchema = z
  .object({
    sliderId: z.string().min(1).max(100),
    slideId: z.string().max(100).optional(),
    event: z.enum([
      "slider_impression",
      "slide_impression",
      "navigation_click",
      "pagination_click",
      "cta_click",
      "product_click",
      "add_to_cart_click",
      "video_play",
      "video_pause",
      "video_completion",
    ]),
    sessionId: z.string().uuid(),
    page: z.string().max(500).regex(/^\//),
    device: z.enum(["desktop", "tablet", "mobile"]),
    eventId: z.string().uuid(),
  })
  .strict();
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsRecord = AnalyticsEvent & { timestamp: string };
export const rangeSchema = z
  .object({ from: z.string().datetime(), to: z.string().datetime() })
  .refine(
    (v) =>
      Date.parse(v.from) < Date.parse(v.to) &&
      Date.parse(v.to) - Date.parse(v.from) <= 366 * 86400000,
    "Select a range of up to one year",
  );
