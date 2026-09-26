import type { DataCollection } from "@wix/astro/builders";
export default {
  idSuffix: "sliders",
  displayName: "sliders",
  fields: [
    { key: "name", displayName: "name", type: "TEXT" },
    { key: "type", displayName: "type", type: "TEXT" },
    { key: "status", displayName: "status", type: "TEXT" },
    {
      key: "settings",
      displayName: "settings",
      type: "OBJECT",
      objectOptions: { fields: [] },
    },
    {
      key: "responsiveSettings",
      displayName: "responsiveSettings",
      type: "OBJECT",
      objectOptions: { fields: [] },
    },
    {
      key: "slides",
      displayName: "slides",
      type: "ARRAY",
      arrayOptions: {
        elementType: "OBJECT",
        objectOptions: { fields: [] },
      },
    },
    { key: "revision", displayName: "revision", type: "NUMBER" },
    { key: "createdAt", displayName: "createdAt", type: "TEXT" },
    { key: "updatedAt", displayName: "updatedAt", type: "TEXT" },
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
