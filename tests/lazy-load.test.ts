import assert from "node:assert/strict";
import test from "node:test";
import { nearbySlides } from "../src/lib/slider/lazy-load";
import { settingsSchema } from "../src/schemas/slider";

const sorted = (set: Set<number>) => [...set].sort((a, b) => a - b);

test("loads the active slide and one on each side", () => {
  assert.deepEqual(sorted(nearbySlides(3, 10)), [2, 3, 4]);
});

test("stops at the ends when the slider doesn't loop", () => {
  assert.deepEqual(sorted(nearbySlides(0, 10)), [0, 1]);
  assert.deepEqual(sorted(nearbySlides(9, 10)), [8, 9]);
});

test("wraps around the ends when the slider loops", () => {
  assert.deepEqual(sorted(nearbySlides(0, 10, 1, true)), [0, 1, 9]);
  assert.deepEqual(sorted(nearbySlides(9, 10, 1, true)), [0, 8, 9]);
});

test("covers every visible slide in multi-item layouts", () => {
  assert.deepEqual(sorted(nearbySlides(2, 10, 3)), [1, 2, 3, 4, 5]);
});

test("lazy loading is on by default, including for saved sliders", () => {
  assert.equal(settingsSchema.parse({}).lazyLoad, true);
});
