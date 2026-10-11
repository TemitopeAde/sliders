import { items } from "@wix/data";
import { z } from "zod";
import {
  appSettingsSchema,
  createSliderSchema,
  sliderSchema,
  templateSchema,
  type Slide,
  type Slider,
} from "../../schemas/slider";
import { starterTemplates, templateToSlider } from "../slider/templates";
import { COLLECTIONS as C } from "../wix/collections";
import { ApiError } from "./server";
import * as repo from "./repository";
// Slider operations shared by the dashboard API and the AI tools, so both
// apply the same validation and revision checks.
const now = () => new Date().toISOString();
export async function createSlider(input: unknown) {
  const data = createSliderSchema.parse(input);
  if (data.templateId)
    return repo.insertSlider(
      templateToSlider(await findTemplate(data.templateId), data.name),
    );
  const settings = await repo.getSettings();
  const slider = sliderSchema.parse({
    _id: crypto.randomUUID(),
    name: data.name,
    type: data.type,
    createdAt: now(),
    updatedAt: now(),
  });
  slider.settings.autoplay = settings.defaultAutoplay;
  slider.settings.analytics = settings.analytics;
  return repo.insertSlider(slider);
}
/** Status and publish state only change through publish/disable. */
export async function updateSlider(
  id: string,
  value: Omit<Slider, "_id" | "createdAt" | "updatedAt">,
) {
  const current = await repo.getSlider(id);
  return repo.saveSlider({
    ...current,
    ...value,
    status: current.status,
    publishedRevision: current.publishedRevision,
  });
}
export async function duplicateSlider(id: string) {
  const slider = await repo.getSlider(id);
  return repo.insertSlider({
    ...slider,
    _id: crypto.randomUUID(),
    name: `${slider.name.slice(0, 90)} (copy)`,
    status: "draft",
    revision: 0,
    publishedRevision: undefined,
    createdAt: now(),
    updatedAt: now(),
    slides: slider.slides.map((s) => ({ ...s, _id: crypto.randomUUID() })),
  });
}
function findSlide(slider: Slider, slideId: string) {
  const slide = slider.slides.find((s) => s._id === slideId);
  if (!slide) throw new ApiError(404, "NOT_FOUND", "Slide not found.");
  return slide;
}
export async function addSlide(
  sliderId: string,
  revision: number,
  slide: Slide,
) {
  const slider = await repo.getSlider(sliderId);
  if (slider.slides.some((s) => s._id === slide._id))
    throw new ApiError(400, "VALIDATION_ERROR", "Slide ID already exists.");
  return repo.saveSlider({
    ...slider,
    revision,
    slides: [...slider.slides, slide],
  });
}
export async function updateSlide(
  sliderId: string,
  slideId: string,
  revision: number,
  slide: Slide,
) {
  const slider = await repo.getSlider(sliderId);
  findSlide(slider, slideId);
  if (slide._id !== slideId)
    throw new ApiError(400, "VALIDATION_ERROR", "Slide ID mismatch.");
  return repo.saveSlider({
    ...slider,
    revision,
    slides: slider.slides.map((s) => (s._id === slideId ? slide : s)),
  });
}
export async function duplicateSlide(
  sliderId: string,
  slideId: string,
  revision: number,
) {
  const slider = await repo.getSlider(sliderId);
  const slide = findSlide(slider, slideId);
  return repo.saveSlider({
    ...slider,
    revision,
    slides: [
      ...slider.slides,
      {
        ...slide,
        _id: crypto.randomUUID(),
        title: `${slide.title.slice(0, 150)} (copy)`,
      },
    ],
  });
}
export async function deleteSlide(
  sliderId: string,
  slideId: string,
  revision: number,
) {
  const slider = await repo.getSlider(sliderId);
  findSlide(slider, slideId);
  return repo.saveSlider({
    ...slider,
    revision,
    slides: slider.slides.filter((s) => s._id !== slideId),
  });
}
export async function reorderSlides(
  sliderId: string,
  revision: number,
  ids: string[],
) {
  const slider = await repo.getSlider(sliderId);
  if (
    ids.length !== slider.slides.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !slider.slides.some((s) => s._id === id))
  )
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Order must include every slide exactly once.",
    );
  return repo.saveSlider({
    ...slider,
    revision,
    slides: ids.map((id) => findSlide(slider, id)),
  });
}
async function findTemplate(id: string) {
  const template = (await repo.templates()).find((t) => t._id === id);
  if (!template) throw new ApiError(404, "NOT_FOUND", "Template not found.");
  return template;
}
export const savedTemplateSchema = templateSchema.omit({ _id: true });
export async function saveTemplate(input: unknown) {
  const template = savedTemplateSchema.parse(input);
  return templateSchema.parse(
    await items.insert(C.templates, { ...template, _id: crypto.randomUUID() }),
  );
}
function savedTemplateId(id: string) {
  if (starterTemplates.some((t) => t._id === id))
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Built-in templates can't be changed.",
    );
  return id;
}
export async function renameTemplate(id: string, name: string) {
  const current = await items.get(C.templates, savedTemplateId(id));
  if (!current) throw new ApiError(404, "NOT_FOUND", "Template not found.");
  const template = templateSchema.parse({ ...current, name });
  return templateSchema.parse(await items.update(C.templates, template));
}
export async function deleteTemplate(id: string) {
  const current = await items.get(C.templates, savedTemplateId(id));
  if (!current) throw new ApiError(404, "NOT_FOUND", "Template not found.");
  await items.remove(C.templates, id);
  return { id };
}
export const templateName = z.string().trim().min(1).max(100);
export async function useTemplate(id: string, name: string) {
  return repo.insertSlider(templateToSlider(await findTemplate(id), name));
}
export async function saveSettings(input: unknown) {
  return appSettingsSchema.parse(
    await items.save(C.settings, {
      ...appSettingsSchema.parse(input),
      _id: "preferences",
    }),
  );
}
