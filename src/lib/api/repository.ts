import { items } from "@wix/data";
import { COLLECTIONS as C } from "../wix/collections";
import {
  sliderSchema,
  templateSchema,
  appSettingsSchema,
  type Slider,
  type SliderTemplate,
} from "../../schemas/slider";
import { starterTemplates } from "../slider/templates";
import { ApiError } from "./server";
export async function listSliders() {
  let result = await items
    .query(C.sliders)
    .descending("updatedAt")
    .limit(100)
    .find();
  const all = [...result.items];
  while (result.hasNext()) {
    result = await result.next();
    all.push(...result.items);
  }
  return all.map((v) => sliderSchema.parse(v));
}
export async function getSlider(id: string) {
  const data = await items.get(C.sliders, id, { consistentRead: true });
  if (!data) throw new ApiError(404, "NOT_FOUND", "Slider not found.");
  return sliderSchema.parse(data);
}
export async function insertSlider(slider: Slider) {
  return sliderSchema.parse(await items.insert(C.sliders, slider));
}
export async function saveSlider(slider: Slider) {
  const current = await getSlider(slider._id);
  if (current.revision !== slider.revision)
    throw new ApiError(
      409,
      "CONFLICT",
      "This slider was changed in another window. Reload before saving.",
    );
  const next = {
    ...slider,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  return sliderSchema.parse(
    await items.update(C.sliders, next, {
      condition: items.filter().eq("revision", current.revision),
    }),
  );
}
export async function publishSlider(slider: Slider) {
  const invalid = slider.slides.filter(
    (s) =>
      s.enabled &&
      (((s.type === "image" || s.type === "video") && !s.media.url) ||
        (s.type === "product" && !s.productId)),
  );
  if (invalid.length)
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Add media or select a product for every enabled media slide.",
    );
  if (!slider.slides.some((s) => s.enabled) && !slider.settings.collectionId)
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Add an enabled slide before publishing.",
    );
  // Public data is an explicit snapshot; draft edits never leak to visitors.
  await items.save(C.published, { ...slider, status: "published" });
  return saveSlider({ ...slider, status: "published" });
}
export async function disableSlider(slider: Slider) {
  await items.remove(C.published, slider._id);
  return saveSlider({ ...slider, status: "disabled" });
}
export async function deleteSlider(id: string) {
  await getSlider(id);
  await items.remove(C.published, id);
  await items.remove(C.sliders, id);
  return { id };
}
export async function templates(): Promise<SliderTemplate[]> {
  let result = await items.query(C.templates).limit(100).find();
  const all = [...result.items];
  while (result.hasNext()) {
    result = await result.next();
    all.push(...result.items);
  }
  return [...starterTemplates, ...all.map((v) => templateSchema.parse(v))];
}
export async function getSettings() {
  const row = await items.get(C.settings, "preferences");
  return appSettingsSchema.parse(row ?? {});
}
