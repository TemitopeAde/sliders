import { items } from "@wix/data";
import { z } from "zod";
import {
  createSliderSchema,
  sliderSchema,
  updateSliderSchema,
  slideSchema,
  templateSchema,
  appSettingsSchema,
} from "../../schemas/slider";
import { templateToSlider } from "../slider/templates";
import { COLLECTIONS as C } from "../wix/collections";
import { route, body, idParam, ApiError } from "./server";
import * as repo from "./repository";
import { readAnalytics, recordEvent } from "./analytics";
const blank = (
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
export const list = route(() => repo.listSliders());
export const create = route(async ({ request }) => {
  const data = createSliderSchema.parse(await body(request));
  let slider = blank(data.name, data.type);
  if (data.templateId) {
    const t = (await repo.templates()).find((v) => v._id === data.templateId);
    if (!t) throw new ApiError(404, "NOT_FOUND", "Template not found.");
    slider = templateToSlider(t, data.name);
  } else {
    const settings = await repo.getSettings();
    slider.settings.autoplay = settings.defaultAutoplay;
    slider.settings.analytics = settings.analytics;
  }
  return repo.insertSlider(slider);
});
export const get = route(({ params }) => repo.getSlider(idParam(params.id)));
export const update = route(async ({ params, request }) => {
  const value = updateSliderSchema.parse(await body(request));
  const current = await repo.getSlider(idParam(params.id));
  return repo.saveSlider({ ...current, ...value, status: current.status });
});
export const remove = route(({ params }) =>
  repo.deleteSlider(idParam(params.id)),
);
export const duplicate = route(async ({ params }) => {
  const slider = await repo.getSlider(idParam(params.id));
  const now = new Date().toISOString();
  return repo.insertSlider({
    ...slider,
    _id: crypto.randomUUID(),
    name: `${slider.name.slice(0, 90)} (copy)`,
    status: "draft",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    slides: slider.slides.map((s) => ({ ...s, _id: crypto.randomUUID() })),
  });
});
export const publish = route(async ({ params }) =>
  repo.publishSlider(await repo.getSlider(idParam(params.id))),
);
export const disable = route(async ({ params }) =>
  repo.disableSlider(await repo.getSlider(idParam(params.id))),
);
export const listSlides = route(
  async ({ params }) => (await repo.getSlider(idParam(params.id))).slides,
);
export const addSlide = route(async ({ params, request }) => {
  const slider = await repo.getSlider(idParam(params.id));
  const slide = slideSchema.parse(await body(request));
  return repo.saveSlider({ ...slider, slides: [...slider.slides, slide] });
});
const slideRequest = z
  .object({
    sliderId: z.string(),
    revision: z.number().int().nonnegative(),
    slide: slideSchema.optional(),
  })
  .strict();
export const patchSlide = route(async ({ params, request }) => {
  const data = slideRequest.parse(await body(request));
  const slider = await repo.getSlider(data.sliderId);
  const id = idParam(params.id);
  if (!slider.slides.some((s) => s._id === id))
    throw new ApiError(404, "NOT_FOUND", "Slide not found.");
  if (!data.slide || data.slide._id !== id)
    throw new ApiError(400, "VALIDATION_ERROR", "Slide ID mismatch.");
  return repo.saveSlider({
    ...slider,
    revision: data.revision,
    slides: slider.slides.map((s) => (s._id === id ? data.slide! : s)),
  });
});
export const removeSlide = route(async ({ params, request }) => {
  const data = slideRequest.parse(await body(request));
  const slider = await repo.getSlider(data.sliderId);
  return repo.saveSlider({
    ...slider,
    revision: data.revision,
    slides: slider.slides.filter((s) => s._id !== idParam(params.id)),
  });
});
export const duplicateSlide = route(async ({ params, request }) => {
  const data = slideRequest.parse(await body(request));
  const slider = await repo.getSlider(data.sliderId);
  const slide = slider.slides.find((s) => s._id === idParam(params.id));
  if (!slide) throw new ApiError(404, "NOT_FOUND", "Slide not found.");
  return repo.saveSlider({
    ...slider,
    revision: data.revision,
    slides: [
      ...slider.slides,
      {
        ...slide,
        _id: crypto.randomUUID(),
        title: `${slide.title.slice(0, 150)} (copy)`,
      },
    ],
  });
});
export const reorder = route(async ({ request }) => {
  const data = z
    .object({
      sliderId: z.string(),
      revision: z.number(),
      ids: z.array(z.string()).max(200),
    })
    .strict()
    .parse(await body(request));
  const slider = await repo.getSlider(data.sliderId);
  if (
    data.ids.length !== slider.slides.length ||
    new Set(data.ids).size !== data.ids.length ||
    data.ids.some((id) => !slider.slides.some((s) => s._id === id))
  )
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Order must include every slide exactly once.",
    );
  return repo.saveSlider({
    ...slider,
    revision: data.revision,
    slides: data.ids.map((id) => slider.slides.find((s) => s._id === id)!),
  });
});
export const listTemplates = route(() => repo.templates());
export const saveTemplate = route(async ({ request }) => {
  const t = templateSchema.omit({ _id: true }).parse(await body(request));
  return items.insert(C.templates, { ...t, _id: crypto.randomUUID() });
});
export const useTemplate = route(async ({ params, request }) => {
  const { name } = z
    .object({ name: z.string().min(1).max(100) })
    .parse(await body(request));
  const t = (await repo.templates()).find((v) => v._id === params.id);
  if (!t) throw new ApiError(404, "NOT_FOUND", "Template not found.");
  return repo.insertSlider(templateToSlider(t, name));
});
export const settingsGet = route(() => repo.getSettings());
export const settingsSave = route(async ({ request }) =>
  items.save(C.settings, {
    ...appSettingsSchema.parse(await body(request)),
    _id: "preferences",
  }),
);
export const analyticsGet = route(({ url }) => readAnalytics(url));
export const analyticsPost = route(
  async ({ request }) => recordEvent(await body(request)),
  false,
);
