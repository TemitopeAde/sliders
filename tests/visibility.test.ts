import assert from "node:assert/strict";
import test from "node:test";
import { createSlide, type Slide } from "../src/schemas/slider";
import {
  isSlideVisible,
  type VisibilityContext,
} from "../src/lib/slider/visibility";

const context = (
  extra: Partial<VisibilityContext> = {},
): VisibilityContext => ({
  device: "desktop",
  page: "/",
  now: new Date("2026-09-29T12:00:00Z"),
  ...extra,
});
const withCondition = (kind: string, value = ""): Slide =>
  createSlide("image", {
    visibility: { conditions: [{ kind, value }] },
  });

test("member and guest rules follow the visitor's login state", () => {
  const member = withCondition("member");
  const guest = withCondition("guest");
  assert.equal(isSlideVisible(member, context({ member: true })), true);
  assert.equal(isSlideVisible(member, context({ member: false })), false);
  assert.equal(isSlideVisible(guest, context({ member: false })), true);
  assert.equal(isSlideVisible(guest, context({ member: true })), false);
  // Unknown login state matches neither rule.
  assert.equal(isSlideVisible(member, context()), false);
  assert.equal(isSlideVisible(guest, context()), false);
});

test("schedules show a slide only inside its window", () => {
  const slide = createSlide("image", {
    schedule: {
      start: "2026-09-29T10:00:00Z",
      end: "2026-09-29T14:00:00Z",
    },
  });
  assert.equal(isSlideVisible(slide, context()), true);
  assert.equal(
    isSlideVisible(slide, context({ now: new Date("2026-09-29T09:59:00Z") })),
    false,
  );
  assert.equal(
    isSlideVisible(slide, context({ now: new Date("2026-09-29T14:00:00Z") })),
    false,
  );
});

test("time ranges can wrap past midnight", () => {
  const slide = withCondition("time", "22:00-06:00");
  const at = (h: number, m = 0) =>
    context({ now: new Date(2026, 8, 29, h, m) });
  assert.equal(isSlideVisible(slide, at(23)), true);
  assert.equal(isSlideVisible(slide, at(3)), true);
  assert.equal(isSlideVisible(slide, at(12)), false);
});

test("inventory rules use each product slide's own stock", () => {
  const slide = (productId: string, value: string) =>
    createSlide("product", {
      productId,
      visibility: { conditions: [{ kind: "inventory", value }] },
    });
  const stock = { a: true, b: false };
  assert.equal(
    isSlideVisible(slide("a", "in-stock"), context({ stock })),
    true,
  );
  assert.equal(
    isSlideVisible(slide("b", "in-stock"), context({ stock })),
    false,
  );
  assert.equal(
    isSlideVisible(slide("b", "out-of-stock"), context({ stock })),
    true,
  );
  // Unknown stock matches neither rule.
  assert.equal(
    isSlideVisible(slide("c", "in-stock"), context({ stock })),
    false,
  );
  assert.equal(
    isSlideVisible(slide("c", "out-of-stock"), context({ stock })),
    false,
  );
});
