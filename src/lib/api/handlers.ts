import { z } from "zod";
import { slideSchema, updateSliderSchema } from "../../schemas/slider";
import { route, body, idParam } from "./server";
import * as repo from "./repository";
import * as service from "./service";
import { readAnalytics, recordEvent } from "./analytics";
const listFilters = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["draft", "published", "disabled"]).optional(),
});
const revision = z.number().int().nonnegative();
export const list = route(({ url }) =>
  repo.listSliders(
    listFilters.parse({
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status") || undefined,
    }),
  ),
);
export const create = route(async ({ request }) =>
  service.createSlider(await body(request)),
);
export const get = route(({ params }) => repo.getSlider(idParam(params.id)));
export const update = route(async ({ params, request }) =>
  service.updateSlider(
    idParam(params.id),
    updateSliderSchema.parse(await body(request)),
  ),
);
export const remove = route(({ params }) =>
  repo.deleteSlider(idParam(params.id)),
);
export const duplicate = route(({ params }) =>
  service.duplicateSlider(idParam(params.id)),
);
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
  const data = z
    .object({ revision, slide: slideSchema })
    .strict()
    .parse(await body(request));
  return service.addSlide(idParam(params.id), data.revision, data.slide);
});
const slideRequest = z.object({ sliderId: z.string(), revision }).strict();
export const patchSlide = route(async ({ params, request }) => {
  const data = slideRequest
    .extend({ slide: slideSchema })
    .parse(await body(request));
  return service.updateSlide(
    idParam(data.sliderId),
    idParam(params.id),
    data.revision,
    data.slide,
  );
});
export const removeSlide = route(async ({ params, request }) => {
  const data = slideRequest.parse(await body(request));
  return service.deleteSlide(
    idParam(data.sliderId),
    idParam(params.id),
    data.revision,
  );
});
export const duplicateSlide = route(async ({ params, request }) => {
  const data = slideRequest.parse(await body(request));
  return service.duplicateSlide(
    idParam(data.sliderId),
    idParam(params.id),
    data.revision,
  );
});
export const reorder = route(async ({ request }) => {
  const data = z
    .object({
      sliderId: z.string(),
      revision,
      ids: z.array(z.string()).max(200),
    })
    .strict()
    .parse(await body(request));
  return service.reorderSlides(idParam(data.sliderId), data.revision, data.ids);
});
export const listTemplates = route(() => repo.templates());
export const saveTemplate = route(async ({ request }) =>
  service.saveTemplate(await body(request)),
);
export const renameTemplate = route(async ({ params, request }) => {
  const { name } = z
    .object({ name: service.templateName })
    .strict()
    .parse(await body(request));
  return service.renameTemplate(idParam(params.id), name);
});
export const deleteTemplate = route(({ params }) =>
  service.deleteTemplate(idParam(params.id)),
);
export const useTemplate = route(async ({ params, request }) => {
  const { name } = z
    .object({ name: service.templateName })
    .parse(await body(request));
  return service.useTemplate(idParam(params.id), name);
});
export const settingsGet = route(() => repo.getSettings());
export const settingsSave = route(async ({ request }) =>
  service.saveSettings(await body(request)),
);
export const analyticsGet = route(({ url }) => readAnalytics(url));
export const analyticsPost = route(
  async ({ request }) => recordEvent(await body(request)),
  false,
);
