import { appInstances } from "@wix/app-management";
import { notifyLifecycleEvent } from "../../../../backend/notify-lifecycle-event";

export default appInstances.onAppInstanceRemoved(async (event) => {
  try {
    // The app no longer has access to the site, so only the event's own
    // instance ID is reported.
    await notifyLifecycleEvent({
      eventType: "APP_REMOVED",
      instanceIdHint: event.metadata?.instanceId,
    });
  } catch (error) {
    console.error(
      "[Sliders] Failed to handle app removed event",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
