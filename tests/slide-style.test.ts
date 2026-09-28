import assert from "node:assert/strict";
import test from "node:test";
import { slideSchema } from "../src/schemas/slider";

const saved = {
  _id: "slide-1",
  title: "Saved slide",
  type: "image",
  layers: [],
  style: { background: "#183c37", overlay: 0.4, overlayColor: "#000000" },
};

test("slides saved before the new style fields keep their current look", () => {
  const { style } = slideSchema.parse(saved);
  assert.equal(style.overlay, 0.4);
  assert.equal(style.gradientAngle, 135);
  assert.equal(style.mediaBlur, 0);
  assert.equal(style.mediaOpacity, 1);
  assert.equal(style.mediaBrightness, 100);
  assert.equal(style.overlayType, "solid");
  assert.equal(style.textShadow, "none");
  assert.equal(style.panel.enabled, false);
});

test("out-of-range style values are rejected", () => {
  for (const style of [
    { mediaBlur: 99 },
    { mediaOpacity: 1.5 },
    { panel: { opacity: 2 } },
    { overlayType: "radial" },
  ])
    assert.equal(
      slideSchema.safeParse({ ...saved, style: { ...saved.style, ...style } })
        .success,
      false,
      JSON.stringify(style),
    );
});
