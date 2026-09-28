import { extensions } from "@wix/astro/builders";

type JsonSchema = Record<string, unknown>;
const object = (
  properties: Record<string, JsonSchema>,
  required: string[] = [],
) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
});
const string = (description: string): JsonSchema => ({
  type: "string",
  description,
});
const integer = (description: string): JsonSchema => ({
  type: "integer",
  minimum: 0,
  description,
});
const boolean = (description: string): JsonSchema => ({
  type: "boolean",
  description,
});
const sliderId = string("The Wix Sliders slider ID.");
const slideId = string("The slide ID within the slider.");
const revision = integer("The slider revision returned by a prior read.");
const slider = {
  type: "object",
  description:
    "A complete Slider object returned by getSlider, with requested edits applied.",
};
const slide = {
  type: "object",
  description:
    "A complete Slide object, including its _id, title, type, and applicable content.",
};
const success = object(
  {
    success: boolean("Whether the operation completed."),
    data: { type: "object", description: "The requested Sliders result." },
  },
  ["success", "data"],
);
const tool = (
  methodName: string,
  displayName: string,
  description: string,
  requestSchema: JsonSchema,
) => ({
  methodName,
  displayName,
  description,
  activated: true,
  requestSchema,
  responseSchema: success,
});

export const sliderTools = [
  tool(
    "listSliders",
    "List sliders",
    "Lists sliders, optionally filtered by name or status. Use when a collaborator asks what sliders exist or wants to find a draft, published, or disabled slider.",
    object({
      search: string("Optional name search."),
      status: {
        type: "string",
        enum: ["draft", "published", "disabled"],
        description: "Optional status filter.",
      },
    }),
  ),
  tool(
    "getSlider",
    "Get slider",
    "Returns a slider and all of its settings and slides. Use before editing, publishing, disabling, duplicating, or deleting a specific slider.",
    object({ sliderId }, ["sliderId"]),
  ),
  tool(
    "createSlider",
    "Create slider",
    "Creates a new draft slider from a type and optional template. Use when a collaborator asks to create a slider or start from a slider template.",
    object(
      {
        name: string("New slider name."),
        type: { type: "string", description: "Slider type." },
        templateId: string("Optional template ID."),
      },
      ["name"],
    ),
  ),
  tool(
    "updateSlider",
    "Update slider",
    "Saves complete slider settings and content. Use after reading a slider when a collaborator asks to change its name, settings, responsiveness, visibility, schedule, or slides.",
    object({ sliderId, slider }, ["sliderId", "slider"]),
  ),
  tool(
    "duplicateSlider",
    "Duplicate slider",
    "Creates a draft copy of a slider, including new slide IDs. Use when a collaborator asks to clone an existing slider.",
    object({ sliderId }, ["sliderId"]),
  ),
  tool(
    "publishSlider",
    "Publish slider",
    "Publishes a slider snapshot for visitors. Use when a collaborator asks to make a slider live; enabled media and product slides must be complete.",
    object({ sliderId }, ["sliderId"]),
  ),
  tool(
    "disableSlider",
    "Disable slider",
    "Stops a published slider from appearing to visitors while preserving its draft. Use when a collaborator asks to unpublish or turn off a slider.",
    object({ sliderId }, ["sliderId"]),
  ),
  tool(
    "deleteSlider",
    "Delete slider",
    "Permanently removes a slider and its published copy. First ask the collaborator for explicit final confirmation, then call only with confirmed set to true.",
    object(
      {
        sliderId,
        confirmed: boolean("Must be true after explicit user confirmation."),
      },
      ["sliderId", "confirmed"],
    ),
  ),
  tool(
    "listSlides",
    "List slides",
    "Lists the slides in a slider. Use when a collaborator wants to inspect or manage a slider's slide order and content.",
    object({ sliderId }, ["sliderId"]),
  ),
  tool(
    "addSlide",
    "Add slide",
    "Adds a complete slide to a slider. Use when a collaborator asks to add image, video, product, promotion, or text content.",
    object({ sliderId, slide }, ["sliderId", "slide"]),
  ),
  tool(
    "updateSlide",
    "Update slide",
    "Updates one slide using the slider revision from a prior read. Use when a collaborator asks to edit an existing slide.",
    object({ sliderId, slideId, revision, slide }, [
      "sliderId",
      "slideId",
      "revision",
      "slide",
    ]),
  ),
  tool(
    "duplicateSlide",
    "Duplicate slide",
    "Duplicates a slide using the slider revision from a prior read. Use when a collaborator asks to clone a slide.",
    object({ sliderId, slideId, revision }, [
      "sliderId",
      "slideId",
      "revision",
    ]),
  ),
  tool(
    "reorderSlides",
    "Reorder slides",
    "Reorders every slide in a slider. Use when a collaborator asks to change slide order; ids must contain each slide exactly once.",
    object(
      {
        sliderId,
        revision,
        ids: {
          type: "array",
          items: string("Slide ID."),
          description: "All slide IDs in desired order.",
        },
      },
      ["sliderId", "revision", "ids"],
    ),
  ),
  tool(
    "deleteSlide",
    "Delete slide",
    "Permanently removes a slide. First ask the collaborator for explicit final confirmation, then call only with confirmed set to true.",
    object(
      {
        sliderId,
        slideId,
        revision,
        confirmed: boolean("Must be true after explicit user confirmation."),
      },
      ["sliderId", "slideId", "revision", "confirmed"],
    ),
  ),
  tool(
    "listTemplates",
    "List templates",
    "Lists built-in and saved slider templates. Use when a collaborator wants template ideas or needs a template ID.",
    object({}),
  ),
  tool(
    "saveTemplate",
    "Save template",
    "Saves a reusable slider template. Use when a collaborator asks to preserve the current slider design for later use.",
    object(
      {
        template: {
          type: "object",
          description: "Template content without _id.",
        },
      },
      ["template"],
    ),
  ),
  tool(
    "useTemplate",
    "Use template",
    "Creates a new slider from a template. Use when a collaborator selects a template and provides a name for the new slider.",
    object(
      {
        templateId: string("Template ID."),
        name: string("Name for the new slider."),
      },
      ["templateId", "name"],
    ),
  ),
  tool(
    "getSettings",
    "Get settings",
    "Returns Sliders app preferences. Use when a collaborator asks about analytics, do-not-track, autoplay, or catalog settings.",
    object({}),
  ),
  tool(
    "updateSettings",
    "Update settings",
    "Updates Sliders app preferences. Use when a collaborator asks to change default autoplay, analytics, do-not-track, or catalog settings.",
    object(
      {
        settings: {
          type: "object",
          description: "Complete app settings object.",
        },
      },
      ["settings"],
    ),
  ),
  tool(
    "getAnalytics",
    "Get analytics",
    "Returns aggregate Sliders analytics for a date range and optional slider. Use when a collaborator asks about slider performance, views, clicks, or engagement.",
    object({
      from: string("ISO timestamp, optional."),
      to: string("ISO timestamp, optional."),
      sliderId,
    }),
  ),
  tool(
    "listProducts",
    "List products",
    "Lists Wix Stores products available for product slides. Use when a collaborator needs to find a product to feature in a slider.",
    object({
      search: string("Optional product search."),
      collectionId: string("Optional Wix Stores collection ID."),
      sort: {
        type: "string",
        enum: ["manual", "newest", "name", "price"],
        description: "Product sort order.",
      },
      offset: integer("Zero-based result offset."),
    }),
  ),
  tool(
    "listCollections",
    "List product collections",
    "Lists Wix Stores product collections available for product sliders. Use when a collaborator wants to source a slider from a product collection.",
    object({}),
  ),
];

export default extensions.appTools({
  id: "7cd7567f-02c6-44f2-841b-ba2a98f62370",
  name: "sliders-ai-tools",
  tools: sliderTools,
});
