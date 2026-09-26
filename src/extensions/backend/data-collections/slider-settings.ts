import type { DataCollection } from "@wix/astro/builders";
export default {
  idSuffix: "slider-settings",
  displayName: "slider-settings",
  fields: [
    { key: "analytics", displayName: "analytics", type: "BOOLEAN" },
    { key: "respectDnt", displayName: "respectDnt", type: "BOOLEAN" },
    { key: "defaultAutoplay", displayName: "defaultAutoplay", type: "BOOLEAN" },
    { key: "catalogVersion", displayName: "catalogVersion", type: "TEXT" },
  ],
  dataPermissions: {
    itemRead: "CMS_EDITOR",
    itemInsert: "CMS_EDITOR",
    itemUpdate: "CMS_EDITOR",
    itemRemove: "CMS_EDITOR",
  },
  indexes: [],
  initialData: [],
} satisfies DataCollection;
