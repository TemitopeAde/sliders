import { analytics, settings, sliders, templates } from "./catalog";
import { templateToSlider } from "../../src/lib/slider/templates";
import { sliderSchema, type Slider } from "../../src/schemas/slider";

function json(data: unknown, status = 200) {
  return Response.json(
    { success: status < 400, data, message: "Success" },
    { status },
  );
}

// In-memory store so saves, publishes and creates succeed while filming.
const db: Slider[] = structuredClone(sliders);
const now = () => new Date().toISOString();
const touch = (s: Slider): Slider => ({
  ...s,
  revision: s.revision + 1,
  updatedAt: now(),
});

export const httpClient = {
  async fetchWithAuth(input: string, init: RequestInit = {}) {
    const url = new URL(input, "http://localhost");
    const path = url.pathname.replace(/^\/api\//, "");
    const method = (init.method ?? "GET").toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const [, id, action] = path.match(/^sliders\/([^/]+)(?:\/(\w+))?$/) ?? [];
    if (path === "sliders" && method === "POST") {
      const template = templates.find((t) => t._id === body?.templateId);
      const created = template
        ? templateToSlider(template, body.name)
        : sliderSchema.parse({
            _id: crypto.randomUUID(),
            name: body?.name ?? "Untitled",
            type: body?.type ?? "image",
            createdAt: now(),
            updatedAt: now(),
          });
      db.unshift(created);
      return json(created);
    }
    if (path === "sliders") {
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const status = url.searchParams.get("status");
      return json(
        db.filter(
          (slider) =>
            (!search || slider.name.toLowerCase().includes(search)) &&
            (!status || slider.status === status),
        ),
      );
    }
    if (id) {
      const index = db.findIndex((s) => s._id === id);
      const current = db[index];
      if (!current) return json(null, 404);
      if (method === "DELETE") {
        db.splice(index, 1);
        return json({ id });
      }
      let next: Slider = current;
      // Mirrors the server: status and publish state only change on publish.
      if (method === "PATCH")
        next = touch({
          ...current,
          ...body,
          status: current.status,
          publishedRevision: current.publishedRevision,
        });
      else if (action === "publish")
        next = touch({
          ...current,
          status: "published",
          publishedRevision: current.revision + 1,
        });
      else if (action === "disable")
        next = touch({
          ...current,
          status: "disabled",
          publishedRevision: undefined,
        });
      else if (action === "duplicate") {
        const copy = {
          ...structuredClone(current),
          _id: crypto.randomUUID(),
          name: `${current.name} (copy)`,
          status: "draft" as const,
          revision: 0,
          createdAt: now(),
          updatedAt: now(),
        };
        db.unshift(copy);
        return json(copy);
      } else return json(current);
      db[index] = next;
      return json(next);
    }
    if (path === "templates" && method === "POST") {
      const saved = { ...body, _id: crypto.randomUUID() };
      templates.push(saved);
      return json(saved);
    }
    if (path === "templates") return json(templates);
    const [, templateId] = path.match(/^templates\/([^/]+)$/) ?? [];
    if (templateId) {
      const index = templates.findIndex((t) => t._id === templateId);
      const template = templates[index];
      if (!template) return json(null, 404);
      if (method === "DELETE") {
        templates.splice(index, 1);
        return json({ id: templateId });
      }
      template.name = body?.name ?? template.name;
      return json(template);
    }
    if (path === "settings") return json(method === "GET" ? settings : body);
    if (path === "collections")
      return json([
        { id: "col-home", name: "Home" },
        { id: "col-shop", name: "Shop" },
        { id: "col-journal", name: "Journal" },
      ]);
    if (path.startsWith("analytics")) return json(analytics);
    return json(null, 404);
  },
};

export const auth = {
  async getTokenInfo() {
    return {
      active: true,
      subjectType: "USER",
      subjectId: "screenshot",
      siteId: "screenshot",
      exp: 0,
      iat: 0,
    };
  },
};
