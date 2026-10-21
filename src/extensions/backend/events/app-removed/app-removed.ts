import { appInstances } from '@wix/app-management';
import { notifyLifecycleEvent } from '../../../../backend/notify-lifecycle-event';
import { recordLifecycleEvent } from '../../../../backend/record-lifecycle-event';
import { runInBackground } from '../../../../backend/run-in-background';

// Wix needs a fast acknowledgement; email and Sheets delivery finish after the response.
export default appInstances.onAppInstanceRemoved((event) => {
  // The app no longer has access to the site, so only the event's own instance ID is reported.
  runInBackground('AppRemoved email', () => notifyLifecycleEvent({
    eventType: 'APP_REMOVED',
    instanceIdHint: event.metadata?.instanceId,
  }));
  runInBackground('AppRemoved Sheets record', () => recordLifecycleEvent('AppRemoved', event));
});
