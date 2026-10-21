import assert from "node:assert/strict";
import test from "node:test";
import { sliderTools } from "../src/extensions/backend/app-tools/sliders-ai-tools/sliders-ai-tools.extension";
import {
  sliderToolMethods,
  runSliderTool,
} from "../src/extensions/backend/service-plugins/slider-tools/slider-tools.logic";
import {
  sliderToSlideshowProps,
  slideshowPropsToSlides,
} from "../src/lib/slider/slideshow-props";
import { createSlide, sliderSchema } from "../src/schemas/slider";

const wixUser = { identity: { identityType: "WIX_USER" } };

test("every active App Tool has a dispatcher route", () => {
  assert.deepEqual(
    sliderTools.map((tool) => tool.methodName).sort(),
    [...sliderToolMethods].sort(),
  );
  assert.ok(sliderTools.every((tool) => tool.activated));
});

test("the dispatcher rejects malformed payloads before accessing data", async () => {
  await assert.rejects(
    runSliderTool("listSliders", { status: "archived" }, wixUser),
  );
  await assert.rejects(
    runSliderTool(
      "deleteSlider",
      { sliderId: "slider-1", confirmed: false },
      wixUser,
    ),
  );
});

test("the dispatcher rejects unknown tools", async () => {
  await assert.rejects(
    runSliderTool("removeEverything", {}, wixUser),
    /Unknown Sliders tool/,
  );
});

test("the Slideshow tools reject malformed payloads before accessing data", async () => {
  await assert.rejects(runSliderTool("getSlideshowContent", {}, wixUser));
  await assert.rejects(
    runSliderTool("listEmbeddableSliders", { status: "draft" }, wixUser),
  );
  await assert.rejects(
    runSliderTool(
      "createSliderFromSlideshow",
      { name: "Spring", slides: [{ title: "No name or image" }] },
      wixUser,
    ),
  );
  await assert.rejects(
    runSliderTool(
      "createSliderFromSlideshow",
      {
        name: "Spring",
        slides: [{ name: "One", image: { url: "" } }],
        intervalSeconds: 60,
      },
      wixUser,
    ),
  );
});

test("Slideshow slides round-trip through dashboard slides", () => {
  const image = {
    url: "https://static.wixstatic.com/media/11062b_abc~mv2.jpg",
    alt: "Beach",
  };
  const { slides, warnings } = slideshowPropsToSlides([
    {
      name: "Summer",
      image,
      title: "Summer sale",
      description: "Up to 40% off",
      buttonLabel: "Shop",
      link: { href: "https://example.com/shop", target: "_blank" },
    },
    {
      name: "Contact",
      image,
      buttonLabel: "Email us",
      link: { href: "mailto:hi@example.com" },
    },
  ]);
  assert.equal(warnings.length, 1, "mailto links can't be stored");
  const slider = sliderSchema.parse({
    _id: "s1",
    name: "Spring",
    type: "image",
    settings: { autoplay: true, delay: 7000, loop: false },
    slides: [
      ...slides,
      createSlide("video", { title: "Clip" }),
      createSlide("image", { title: "Hidden", enabled: false }),
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  const props = sliderToSlideshowProps(slider);
  assert.deepEqual(props.slides[0], {
    name: "Summer sale",
    image: { ...image, uri: "11062b_abc~mv2.jpg" },
    title: "Summer sale",
    description: "Up to 40% off",
    buttonLabel: "Shop",
    link: { href: "https://example.com/shop", target: "_blank" },
  });
  assert.equal(props.slides[1]?.buttonLabel, undefined);
  assert.equal(props.slides.length, 2);
  assert.deepEqual(
    props.skipped.map((s) => s.title),
    ["Clip", "Hidden"],
  );
  assert.equal(props.autoPlay, true);
  assert.equal(props.intervalSeconds, 7);
  assert.equal(props.loop, false);
});
