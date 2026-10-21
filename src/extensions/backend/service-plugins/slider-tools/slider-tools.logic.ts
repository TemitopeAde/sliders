import { z } from "zod";
import { slideSchema, updateSliderSchema } from "../../../../schemas/slider";
import { rangeSchema } from "../../../../schemas/analytics";
import { readAnalytics } from "../../../../lib/api/analytics";
import * as repo from "../../../../lib/api/repository";
import * as service from "../../../../lib/api/service";
import { ApiError } from "../../../../lib/api/server";
import { queryCollections, queryProducts } from "../../../../lib/wix/products";
import {
  sliderToSlideshowProps,
  slideshowPlaybackSchema,
  slideshowPropsToSlides,
  slideshowSlideSchema,
} from "../../../../lib/slider/slideshow-props";

const id = z.string().min(1).max(100);
const revision = z.number().int().nonnegative();
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
  "renameTemplate",
  "deleteTemplate",
  "useTemplate",
  "getSettings",
  "updateSettings",
  "getAnalytics",
  "listProducts",
  "listCollections",
  "listEmbeddableSliders",
  "getSlideshowContent",
  "createSliderFromSlideshow",
] as const;

const ok = async (data: Promise<unknown>) => ({
  success: true,
  data: await data,
});

export async function runSliderTool(
  methodName: string | undefined,
  input: unknown,
  metadata?: unknown,
) {
  requireWixUser(metadata);
  const value = payload(input);
  const parse = <T extends z.ZodRawShape>(shape: T) =>
    z.object(shape).strict().parse(value);
  switch (methodName) {
    case "listSliders":
      return ok(
        repo.listSliders(
          parse({
            search: z.string().trim().max(100).optional(),
            status: z.enum(["draft", "published", "disabled"]).optional(),
          }),
        ),
      );
    case "getSlider":
      return ok(repo.getSlider(id.parse(value.sliderId)));
    case "createSlider":
      return ok(service.createSlider(value));
    case "updateSlider": {
      const r = parse({ sliderId: id, slider: updateSliderSchema });
      return ok(service.updateSlider(r.sliderId, r.slider));
    }
    case "duplicateSlider":
      return ok(service.duplicateSlider(id.parse(value.sliderId)));
    case "publishSlider":
      return ok(
        repo.publishSlider(await repo.getSlider(id.parse(value.sliderId))),
      );
    case "disableSlider":
      return ok(
        repo.disableSlider(await repo.getSlider(id.parse(value.sliderId))),
      );
    case "deleteSlider":
      return ok(repo.deleteSlider(parse({ sliderId: id, confirmed }).sliderId));
    case "listSlides":
      return ok(repo.getSlider(id.parse(value.sliderId)).then((s) => s.slides));
    case "addSlide": {
      const r = parse({ sliderId: id, revision, slide: slideSchema });
      return ok(service.addSlide(r.sliderId, r.revision, r.slide));
    }
    case "updateSlide": {
      const r = parse({
        sliderId: id,
        slideId: id,
        revision,
        slide: slideSchema,
      });
      return ok(
        service.updateSlide(r.sliderId, r.slideId, r.revision, r.slide),
      );
    }
    case "duplicateSlide": {
      const r = parse({ sliderId: id, slideId: id, revision });
      return ok(service.duplicateSlide(r.sliderId, r.slideId, r.revision));
    }
    case "reorderSlides": {
      const r = parse({ sliderId: id, revision, ids: z.array(id).max(200) });
      return ok(service.reorderSlides(r.sliderId, r.revision, r.ids));
    }
    case "deleteSlide": {
      const r = parse({ sliderId: id, slideId: id, revision, confirmed });
      return ok(service.deleteSlide(r.sliderId, r.slideId, r.revision));
    }
    case "listTemplates":
      return ok(repo.templates());
    case "saveTemplate":
      return ok(
        service.saveTemplate(
          parse({ template: service.savedTemplateSchema }).template,
        ),
      );
    case "renameTemplate": {
      const r = parse({ templateId: id, name: service.templateName });
      return ok(service.renameTemplate(r.templateId, r.name));
    }
    case "deleteTemplate":
      return ok(
        service.deleteTemplate(parse({ templateId: id, confirmed }).templateId),
      );
    case "useTemplate": {
      const r = parse({ templateId: id, name: service.templateName });
      return ok(service.useTemplate(r.templateId, r.name));
    }
    case "getSettings":
      return ok(repo.getSettings());
    case "updateSettings":
      return ok(
        service.saveSettings(parse({ settings: z.unknown() }).settings),
      );
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
    case "listEmbeddableSliders": {
      const r = parse({ search: z.string().trim().max(100).optional() });
      const sliders = await repo.listSliders({
        search: r.search,
        status: "published",
      });
      return {
        success: true,
        data: sliders.map((s) => ({
          sliderId: s._id,
          name: s.name,
          slideCount: s.slides.length,
          updatedAt: s.updatedAt,
        })),
      };
    }
    case "getSlideshowContent":
      return ok(
        repo
          .getSlider(parse({ sliderId: id }).sliderId)
          .then(sliderToSlideshowProps),
      );
    case "createSliderFromSlideshow": {
      const r = z
        .object({
          name: z.string().trim().min(1).max(100),
          slides: z.array(slideshowSlideSchema).min(1).max(200),
        })
        .merge(slideshowPlaybackSchema)
        .strict()
        .parse(value);
      const { slides, warnings } = slideshowPropsToSlides(r.slides);
      const { _id, createdAt, updatedAt, ...draft } =
        await service.createSlider({ name: r.name, type: "image" });
      const saved = await service.updateSlider(_id, {
        ...draft,
        slides,
        settings: {
          ...draft.settings,
          autoplay: r.autoPlay ?? draft.settings.autoplay,
          delay: (r.intervalSeconds ?? draft.settings.delay / 1000) * 1000,
          loop: r.loop ?? draft.settings.loop,
        },
      });
      return {
        success: true,
        data: { sliderId: saved._id, status: saved.status, warnings },
      };
    }
    default:
      throw new ApiError(
        400,
        "UNKNOWN_TOOL",
        `Unknown Sliders tool: ${methodName ?? "(missing)"}.`,
      );
  }
}
