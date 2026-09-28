import { items } from "@wix/data";
import { z } from "zod";
import {
  appSettingsSchema,
  createSliderSchema,
  slideSchema,
  sliderSchema,
  templateSchema,
  updateSliderSchema,
} from "../../../../schemas/slider";
import { rangeSchema } from "../../../../schemas/analytics";
import { readAnalytics } from "../../../../lib/api/analytics";
import * as repo from "../../../../lib/api/repository";
import { ApiError } from "../../../../lib/api/server";
import { templateToSlider } from "../../../../lib/slider/templates";
import { COLLECTIONS as C } from "../../../../lib/wix/collections";
import { queryCollections, queryProducts } from "../../../../lib/wix/products";

const id = z.string().min(1).max(100);
const payload = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const confirmed = z.literal(true, {
  errorMap: () => ({
    message: "Explicit confirmation is required before deletion.",
  }),
});
function requireWixUser(metadata: unknown) {
  const identity = (
    metadata as { identity?: { identityType?: string } } | undefined
  )?.identity;
  if (identity?.identityType !== "WIX_USER")
    throw new ApiError(
      403,
      "FORBIDDEN",
      "A Wix site collaborator must perform this action.",
    );
}
const blankSlider = (
  name: string,
  type: z.infer<typeof createSliderSchema>["type"],
) =>
  sliderSchema.parse({
    _id: crypto.randomUUID(),
    name,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

export const sliderToolMethods = [
  "listSliders",
  "getSlider",
  "createSlider",
  "updateSlider",
  "duplicateSlider",
  "publishSlider",
  "disableSlider",
  "deleteSlider",
  "listSlides",
  "addSlide",
  "updateSlide",
  "duplicateSlide",
  "reorderSlides",
  "deleteSlide",
  "listTemplates",
  "saveTemplate",
  "useTemplate",
  "getSettings",
  "updateSettings",
  "getAnalytics",
  "listProducts",
  "listCollections",
] as const;

export async function runSliderTool(
  methodName: string | undefined,
  input: unknown,
  metadata?: unknown,
) {
  requireWixUser(metadata);
  const value = payload(input);
  switch (methodName) {
    case "listSliders": {
      const filters = z
        .object({
          search: z.string().trim().max(100).optional(),
          status: z.enum(["draft", "published", "disabled"]).optional(),
        })
        .strict()
        .parse(value);
      return { success: true, data: await repo.listSliders(filters) };
    }
    case "getSlider":
      return {
        success: true,
        data: await repo.getSlider(id.parse(value.sliderId)),
      };
    case "createSlider": {
      const request = createSliderSchema.parse(value);
      let next = blankSlider(request.name, request.type);
      if (request.templateId) {
        const template = (await repo.templates()).find(
          (item) => item._id === request.templateId,
        );
        if (!template)
          throw new ApiError(404, "NOT_FOUND", "Template not found.");
        next = templateToSlider(template, request.name);
      } else {
        const settings = await repo.getSettings();
        next.settings.autoplay = settings.defaultAutoplay;
        next.settings.analytics = settings.analytics;
      }
      return { success: true, data: await repo.insertSlider(next) };
    }
    case "updateSlider": {
      const request = z
        .object({ sliderId: id, slider: updateSliderSchema })
        .strict()
        .parse(value);
      const current = await repo.getSlider(request.sliderId);
      return {
        success: true,
        data: await repo.saveSlider({
          ...current,
          ...request.slider,
          status: current.status,
        }),
      };
    }
    case "duplicateSlider": {
      const current = await repo.getSlider(id.parse(value.sliderId));
      const now = new Date().toISOString();
      return {
        success: true,
        data: await repo.insertSlider({
          ...current,
          _id: crypto.randomUUID(),
          name: `${current.name.slice(0, 90)} (copy)`,
          status: "draft",
          revision: 0,
          createdAt: now,
          updatedAt: now,
          slides: current.slides.map((item) => ({
            ...item,
            _id: crypto.randomUUID(),
          })),
        }),
      };
    }
    case "publishSlider":
      return {
        success: true,
        data: await repo.publishSlider(
          await repo.getSlider(id.parse(value.sliderId)),
        ),
      };
    case "disableSlider":
      return {
        success: true,
        data: await repo.disableSlider(
          await repo.getSlider(id.parse(value.sliderId)),
        ),
      };
    case "deleteSlider": {
      const request = z
        .object({ sliderId: id, confirmed })
        .strict()
        .parse(value);
      return { success: true, data: await repo.deleteSlider(request.sliderId) };
    }
    case "listSlides":
      return {
        success: true,
        data: (await repo.getSlider(id.parse(value.sliderId))).slides,
      };
    case "addSlide": {
      const request = z
        .object({ sliderId: id, slide: slideSchema })
        .strict()
        .parse(value);
      const current = await repo.getSlider(request.sliderId);
      return {
        success: true,
        data: await repo.saveSlider({
          ...current,
          slides: [...current.slides, request.slide],
        }),
      };
    }
    case "updateSlide": {
      const request = z
        .object({
          sliderId: id,
          slideId: id,
          revision: z.number().int().nonnegative(),
          slide: slideSchema,
        })
        .strict()
        .parse(value);
      const current = await repo.getSlider(request.sliderId);
      if (
        request.slide._id !== request.slideId ||
        !current.slides.some((item) => item._id === request.slideId)
      )
        throw new ApiError(404, "NOT_FOUND", "Slide not found.");
      return {
        success: true,
        data: await repo.saveSlider({
          ...current,
          revision: request.revision,
          slides: current.slides.map((item) =>
            item._id === request.slideId ? request.slide : item,
          ),
        }),
      };
    }
    case "duplicateSlide": {
      const request = z
        .object({
          sliderId: id,
          slideId: id,
          revision: z.number().int().nonnegative(),
        })
        .strict()
        .parse(value);
      const current = await repo.getSlider(request.sliderId);
      const source = current.slides.find(
        (item) => item._id === request.slideId,
      );
      if (!source) throw new ApiError(404, "NOT_FOUND", "Slide not found.");
      return {
        success: true,
        data: await repo.saveSlider({
          ...current,
          revision: request.revision,
          slides: [
            ...current.slides,
            {
              ...source,
              _id: crypto.randomUUID(),
              title: `${source.title.slice(0, 150)} (copy)`,
            },
          ],
        }),
      };
    }
    case "reorderSlides": {
      const request = z
        .object({
          sliderId: id,
          revision: z.number().int().nonnegative(),
          ids: z.array(id).max(200),
        })
        .strict()
        .parse(value);
      const current = await repo.getSlider(request.sliderId);
      if (
        request.ids.length !== current.slides.length ||
        new Set(request.ids).size !== request.ids.length ||
        request.ids.some(
          (slideId) => !current.slides.some((item) => item._id === slideId),
        )
      )
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Order must include every slide exactly once.",
        );
      return {
        success: true,
        data: await repo.saveSlider({
          ...current,
          revision: request.revision,
          slides: request.ids.map((slideId) =>
            current.slides.find((item) => item._id === slideId)!,
          ),
        }),
      };
    }
    case "deleteSlide": {
      const request = z
        .object({
          sliderId: id,
          slideId: id,
          revision: z.number().int().nonnegative(),
          confirmed,
        })
        .strict()
        .parse(value);
      const current = await repo.getSlider(request.sliderId);
      if (!current.slides.some((item) => item._id === request.slideId))
        throw new ApiError(404, "NOT_FOUND", "Slide not found.");
      return {
        success: true,
        data: await repo.saveSlider({
          ...current,
          revision: request.revision,
          slides: current.slides.filter((item) => item._id !== request.slideId),
        }),
      };
    }
    case "listTemplates":
      return { success: true, data: await repo.templates() };
    case "saveTemplate": {
      const request = z
        .object({ template: templateSchema.omit({ _id: true }) })
        .strict()
        .parse(value);
      return {
        success: true,
        data: await items.insert(C.templates, {
          ...request.template,
          _id: crypto.randomUUID(),
        }),
      };
    }
    case "useTemplate": {
      const request = z
        .object({ templateId: id, name: z.string().trim().min(1).max(100) })
        .strict()
        .parse(value);
      const template = (await repo.templates()).find(
        (item) => item._id === request.templateId,
      );
      if (!template)
        throw new ApiError(404, "NOT_FOUND", "Template not found.");
      return {
        success: true,
        data: await repo.insertSlider(templateToSlider(template, request.name)),
      };
    }
    case "getSettings":
      return { success: true, data: await repo.getSettings() };
    case "updateSettings": {
      const request = z
        .object({ settings: appSettingsSchema })
        .strict()
        .parse(value);
      return {
        success: true,
        data: await items.save(C.settings, {
          ...request.settings,
          _id: "preferences",
        }),
      };
    }
    case "getAnalytics": {
      const request = z
        .object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
          sliderId: id.optional(),
        })
        .strict()
        .parse(value);
      const from =
        request.from ?? new Date(Date.now() - 30 * 86400000).toISOString();
      const to = request.to ?? new Date().toISOString();
      rangeSchema.parse({ from, to });
      const url = new URL("https://sliders.invalid/analytics");
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      if (request.sliderId) url.searchParams.set("sliderId", request.sliderId);
      return { success: true, data: await readAnalytics(url) };
    }
    case "listProducts": {
      const request = z
        .object({
          search: z.string().max(100).optional(),
          collectionId: id.optional(),
          sort: z.enum(["manual", "newest", "name", "price"]).optional(),
          offset: z.number().int().min(0).max(100000).optional(),
        })
        .strict()
        .parse(value);
      return {
        success: true,
        data: await queryProducts(
          request.search ?? "",
          request.collectionId ?? "",
          request.sort ?? "manual",
          request.offset ?? 0,
        ),
      };
    }
    case "listCollections":
      return { success: true, data: await queryCollections() };
    default:
      throw new ApiError(
        400,
        "UNKNOWN_TOOL",
        `Unknown Sliders tool: ${methodName ?? "(missing)"}.`,
      );
  }
}
