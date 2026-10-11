import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { sliderSchema, type Slider } from "../src/schemas/slider";

// In-memory stand-in for Wix Data with a switch to fail one operation.
const store = new Map<string, Map<string, Record<string, unknown>>>();
const table = (name: string) => {
  if (!store.has(name)) store.set(name, new Map());
  return store.get(name)!;
};
let failNext: string | undefined;
const maybeFail = (op: string) => {
  if (failNext === op) {
    failNext = undefined;
    throw new Error(`${op} failed`);
  }
};
const items = {
  async get(c: string, id: string) {
    return table(c).get(id) ?? null;
  },
  async insert(c: string, item: Record<string, unknown>) {
    maybeFail("insert");
    if (table(c).has(String(item._id))) throw new Error("WDE0074 duplicate");
    table(c).set(String(item._id), structuredClone(item));
    return item;
  },
  async update(c: string, item: Record<string, unknown>) {
    maybeFail("update");
    table(c).set(String(item._id), structuredClone(item));
    return item;
  },
  async save(c: string, item: Record<string, unknown>) {
    maybeFail("save");
    table(c).set(String(item._id), structuredClone(item));
    return item;
  },
  async remove(c: string, id: string) {
    maybeFail("remove");
    table(c).delete(id);
    return null;
  },
  filter: () => ({ eq: () => ({}) }),
  query: () => {
    const q = {
      eq: () => q,
      ge: () => q,
      count: async () => 0,
    };
    return q;
  },
};
mock.module("@wix/data", { namedExports: { items } });
mock.module("@wix/essentials", {
  namedExports: {
    auth: {
      elevate: <T>(fn: T) => fn,
      getTokenInfo: async () => ({
        active: true,
        subjectType: "VISITOR",
        subjectId: "visitor-1",
        siteId: "site-1",
      }),
    },
  },
});
const repo = await import("../src/lib/api/repository");
const analytics = await import("../src/lib/api/analytics");
const { COLLECTIONS: C } = await import("../src/lib/wix/collections");

function seed(overrides: Partial<Slider> = {}) {
  store.clear();
  const slider = sliderSchema.parse({
    _id: "s1",
    name: "Hero",
    type: "image",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    slides: [{ _id: "a", type: "text", title: "Hello" }],
    ...overrides,
  });
  table(C.sliders).set("s1", slider);
  return slider;
}

test("publishing records the live revision and writes the snapshot", async () => {
  const published = await repo.publishSlider(seed());
  assert.equal(published.status, "published");
  assert.equal(published.publishedRevision, published.revision);
  assert.equal(table(C.published).get("s1")?.revision, published.revision);
});

test("a failed snapshot write rolls the publish back", async () => {
  seed();
  failNext = "save";
  await assert.rejects(repo.publishSlider(await repo.getSlider("s1")));
  const after = await repo.getSlider("s1");
  assert.equal(after.status, "draft");
  assert.equal(after.publishedRevision, undefined);
  assert.equal(table(C.published).has("s1"), false);
});

test("a revision conflict stops disable before the site changes", async () => {
  const live = await repo.publishSlider(seed());
  await assert.rejects(
    repo.disableSlider({ ...live, revision: live.revision - 1 }),
    /changed in another window/,
  );
  assert.equal(table(C.published).has("s1"), true);
  assert.equal((await repo.getSlider("s1")).status, "published");
});

test("a failed snapshot removal rolls the disable back", async () => {
  const live = await repo.publishSlider(seed());
  failNext = "remove";
  await assert.rejects(repo.disableSlider(live));
  const after = await repo.getSlider("s1");
  assert.equal(after.status, "published");
  assert.equal(after.publishedRevision, live.publishedRevision);
  assert.equal(table(C.published).has("s1"), true);
});

test("a retried analytics event is stored once and still succeeds", async () => {
  const live = await repo.publishSlider(seed());
  assert.ok(live.settings.analytics);
  const event = {
    sliderId: "s1",
    event: "slider_impression",
    sessionId: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    page: "/",
    device: "desktop",
  };
  assert.deepEqual(await analytics.recordEvent(event), { recorded: true });
  assert.deepEqual(await analytics.recordEvent(event), { recorded: true });
  assert.equal(table(C.analytics).size, 1);
});
