import { api } from "../api/client";
import type { AnalyticsEvent } from "../../schemas/analytics";
let memorySession: string | undefined;
function session() {
  try {
    let value = sessionStorage.getItem("sliders-session");
    if (!value) {
      value = crypto.randomUUID();
      sessionStorage.setItem("sliders-session", value);
    }
    return value;
  } catch {
    return memorySession ?? (memorySession = crypto.randomUUID());
  }
}
export function track(
  sliderId: string,
  event: AnalyticsEvent["event"],
  slideId?: string,
) {
  if (
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl
  )
    return;
  const data: AnalyticsEvent = {
    sliderId,
    event,
    sessionId: session(),
    eventId: crypto.randomUUID(),
    page: location.pathname.slice(0, 500),
    device:
      innerWidth < 640 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop",
    ...(slideId ? { slideId } : {}),
  };
  void api("analytics/event", "POST", data).catch(() => {
    /* Analytics failure must not interrupt a visitor's interaction. */
  });
}
