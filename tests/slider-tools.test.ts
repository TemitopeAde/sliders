import assert from "node:assert/strict";
import test from "node:test";
import { sliderTools } from "../src/extensions/backend/app-tools/sliders-ai-tools/sliders-ai-tools.extension";
import {
  sliderToolMethods,
  runSliderTool,
} from "../src/extensions/backend/service-plugins/slider-tools/slider-tools.logic";

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
