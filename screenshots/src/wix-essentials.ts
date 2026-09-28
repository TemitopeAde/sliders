import { analytics, settings, sliders, templates } from "./catalog";

function json(data: unknown, status = 200) {
  return Response.json({ success: status < 400, data, message: "Success" }, { status });
}

export const httpClient = {
  async fetchWithAuth(input: string) {
    const url = new URL(input, "http://localhost");
    const path = url.pathname.replace(/^\/api\//, "");
    if (path === "sliders") {
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const status = url.searchParams.get("status");
      return json(
        sliders.filter(
          (slider) =>
            (!search || slider.name.toLowerCase().includes(search)) &&
            (!status || slider.status === status),
        ),
      );
    }
    if (path === "templates") return json(templates);
    if (path === "settings") return json(settings);
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
