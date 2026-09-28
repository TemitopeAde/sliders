import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const out = new URL("../app-market/", import.meta.url);
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1600, height: 1200 },
  deviceScaleFactor: 1,
});

async function settle() {
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                const done = () => resolve();
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
                setTimeout(done, 8000);
              }),
      ),
    );
  });
  await page.waitForTimeout(200);
}

async function shot(name) {
  const file = new URL(name, out).pathname;
  await page.screenshot({ path: file, type: "png" });
  console.log(file);
}

await page.goto("http://127.0.0.1:4334/#overview", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Let your content take center stage." }).waitFor();
await page.addStyleTag({
  content: ".page-content{padding-top:18px!important;padding-bottom:8px!important}.mb-7{margin-bottom:12px!important}.mb-8{margin-bottom:14px!important}",
});
await settle();
await shot("01-overview.png");

await page.locator('nav[aria-label="Main navigation"]').getByRole("button", { name: /Sliders/ }).click();
await page.getByRole("heading", { name: "Your sliders" }).waitFor();
await page.getByRole("button", { name: "Grid view" }).click();
await settle();
await shot("02-sliders.png");

await page.locator('nav[aria-label="Main navigation"]').getByRole("button", { name: "Templates" }).click();
await page.getByRole("heading", { name: "A head start for every idea" }).waitFor();
await settle();
await shot("03-templates.png");

await page.locator('nav[aria-label="Main navigation"]').getByRole("button", { name: /Sliders/ }).click();
await page.getByRole("button", { name: /Homepage Hero/ }).first().click();
await page.getByRole("textbox", { name: "Slider name" }).waitFor();
await settle();
await shot("04-editor.png");

await page.goto("http://127.0.0.1:4334/?view=analytics#analytics", {
  waitUntil: "domcontentloaded",
});
await page.getByRole("heading", { name: "A closer look at your impact" }).waitFor();
await settle();
await shot("05-analytics.png");

await page.goto("http://127.0.0.1:4334/?view=media#media", {
  waitUntil: "domcontentloaded",
});
await page.getByRole("heading", { name: "Your media, ready to shine" }).waitFor();
await settle();
await shot("06-media.png");

await page.goto("http://127.0.0.1:4334/?scene=site", { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "Explore collection" }).waitFor();
await settle();
await shot("07-live-slider.png");

await browser.close();
