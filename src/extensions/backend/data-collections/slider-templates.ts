import type { DataCollection } from "@wix/astro/builders";
export default {
  idSuffix: "slider-templates",
  displayName: "slider-templates",
  fields: [
    { key: "name", displayName: "name", type: "TEXT" },
    { key: "category", displayName: "category", type: "TEXT" },
    { key: "thumbnail", displayName: "thumbnail", type: "URL" },
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
