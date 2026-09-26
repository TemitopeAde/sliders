import type { DataCollection } from "@wix/astro/builders";
export default {
  idSuffix: "slider-analytics",
  displayName: "slider-analytics",
  fields: [
    { key: "sliderId", displayName: "sliderId", type: "TEXT" },
    { key: "slideId", displayName: "slideId", type: "TEXT" },
    { key: "event", displayName: "event", type: "TEXT" },
    { key: "sessionId", displayName: "sessionId", type: "TEXT" },
    { key: "page", displayName: "page", type: "TEXT" },
    { key: "device", displayName: "device", type: "TEXT" },
    { key: "timestamp", displayName: "timestamp", type: "TEXT" },
    { key: "eventId", displayName: "eventId", type: "TEXT" },
  ],
  dataPermissions: {
    itemRead: "CMS_EDITOR",
    itemInsert: "CMS_EDITOR",
    itemUpdate: "CMS_EDITOR",
    itemRemove: "CMS_EDITOR",
  },
  indexes: [
    { fields: [{ path: "timestamp" }] },
    { fields: [{ path: "sliderId" }] },
  ],
  initialData: [],
} satisfies DataCollection;
