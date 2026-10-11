// Records the "Slide show" launch film from the real app UI.
//
// 1. Start the studio:  npx astro dev --config astro.shots.config.mjs --port 4340
// 2. Run:               node launch/record-slideshow.mjs [--dry]
//
// The stage page (screenshots/src/pages/film.astro) hosts the dashboard, the
// widget settings panel and a storefront in iframes. This script moves the
// camera, drives real clicks/typing inside those iframes, captures frames via
// the Chrome screencast, renders the score, and encodes an H.264/AAC MP4.
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.FILM_URL ?? "http://127.0.0.1:4340";
const DRY = process.argv.includes("--dry");
const root = path.dirname(new URL(import.meta.url).pathname);
const work = path.join(root, ".render-slideshow");
const out = path.join(root, "slide-show-launch.mp4");
const ffmpeg = createRequire("/tmp/fftools/package.json")("ffmpeg-static");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });

await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: Number(process.env.FILM_DPR ?? 1.5),
});
page.setDefaultTimeout(8000);
page.setDefaultNavigationTimeout(90000);
process.on("unhandledRejection", async (e) => {
  console.error(e);
  await page.screenshot({ path: path.join(root, "failure.png") }).catch(() => {});
  process.exit(1);
});
page.on("pageerror", (e) => console.warn("page error:", e.message));
// Autoplaying sliders keep the network busy, so wait for load, then images.
await page.goto(`${BASE}/film`, { waitUntil: "load" });

const frames = {
  app: page.frameLocator("#app-frame"),
  panel: page.frameLocator("#panel-frame"),
};
const film = (fn, ...args) =>
  page.evaluate(([f, a]) => window.__film[f](...a), [fn, args]);

// Wait until every iframe has painted its images so nothing pops in on camera.
async function settle() {
  for (const f of page.frames()) {
    await f.waitForLoadState("load").catch(() => {});
    await f
      .evaluate(() =>
        Promise.all(
          [...document.images].map((img) =>
            img.complete
              ? null
              : new Promise((r) => {
                  img.addEventListener("load", r, { once: true });
                  img.addEventListener("error", r, { once: true });
                  setTimeout(r, 8000);
                }),
          ),
        ),
      )
      .catch(() => {});
  }
}
await settle();
// Warm every slide image (lazy-loaded ones included) into the cache.
for (const f of page.frames())
  await f
    .evaluate(() =>
      Promise.all(
        [...document.querySelectorAll("img")].map((img) => {
          img.loading = "eager";
          return img.decode().catch(() => {});
        }),
      ),
    )
    .catch(() => {});
await sleep(800);

/** Centre of an element in its iframe's 1920×1080 space. */
async function centre(loc) {
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  try {
    return await loc.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
  } catch (error) {
    await page.screenshot({ path: path.join(root, "failure.png") });
    throw error;
  }
}
async function aim(layer, loc, ms = 420) {
  const p = await centre(loc);
  await film("cursor", layer, p.x, p.y, ms);
  await sleep(ms);
  return p;
}
/** Move the on-screen cursor to an element, then really click it. */
async function tap(layer, loc, { ms = 420, hold = 180 } = {}) {
  await aim(layer, loc, ms);
  await film("click");
  // Skip Playwright's stability wait: the camera may still be gliding.
  await loc.click({ force: true });
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(hold);
  if (process.env.FILM_DEBUG) await trace(`tap ${loc}`);
}
async function trace(tag) {
  const st = await page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    const all = [...document.querySelectorAll("*")].filter((e) => e.scrollLeft || e.scrollTop);
    return {
      rig: q("#app-rig").style.transform.replace(/rotate[XYZ]\(0deg\) |translateZ\(0px\) /g, ""),
      scrolled: all.map((e) => `${e.tagName}#${e.id}.${e.className}:${e.scrollLeft},${e.scrollTop}`),
      win: [scrollX, scrollY],
    };
  });
  console.log(tag.slice(0, 90), JSON.stringify(st));
}
async function type(loc, text, delay = 70) {
  await loc.click();
  await loc.fill("");
  await loc.pressSequentially(text, { delay });
}
/** Choose an option from one of the dashboard's Radix select menus. */
async function choose(layer, trigger, option) {
  await tap(layer, trigger, { hold: 260 });
  const item = frames[layer].getByRole("option", { name: option, exact: true });
  await tap(layer, item, { ms: 320, hold: 260 });
}
/** Aim the camera at an element, zoomed. */
async function focus(layer, loc, s, ms = 1400, extra = {}) {
  const p = await centre(loc);
  await film("shot", layer, { x: p.x, y: p.y, s, rx: 0, ry: 0, ...extra }, ms);
  await sleep(ms);
}
const flat = (layer, ms = 1200) =>
  film("shot", layer, { x: 960, y: 540, s: 1, rx: 0, ry: 0, rz: 0 }, ms);

// ---- Recording: Chrome screencast frames with their capture timestamps.
const cdp = await page.context().newCDPSession(page);
const shots = [];
let index = 0;
let writing = Promise.resolve();
cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
  const file = path.join(work, `f${String(index++).padStart(6, "0")}.jpg`);
  shots.push({ file, t: metadata.timestamp, at: Date.now() });
  writing = writing.then(() => writeFile(file, Buffer.from(data, "base64")));
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

const cues = [];
let start = 0;
const now = () => (Date.now() - start) / 1000;
const cue = (extra = {}) => cues.push({ t: now(), ...extra });
const cut = async (layer) => {
  cue({ cut: true });
  await film("show", layer);
};

await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 92,
  maxWidth: 1920,
  maxHeight: 1080,
  everyNthFrame: 1,
});
await sleep(300);
start = Date.now();
const A = frames.app;
const P = frames.panel;

// 0 — Title
console.log(`[${now().toFixed(1)}s] 0 Title`);
await film("show", "title");
await sleep(5200);

// 1 — Overview: tilted dolly-in that settles flat
console.log(`[${now().toFixed(1)}s] 1 Overview: tilted dolly-in that`);
await film("shot", "app", { x: 960, y: 540, s: 0.6, rx: 22, ry: -24, rz: 2 }, 0);
await cut("app");
cue({ groove: true });
await film("shot", "app", { s: 0.8, rx: 10, ry: -10, rz: 0 }, 2400);
await film("caption", "Your slideshow workspace", "Stats, recent sliders and top performers");
await sleep(2400);
await flat("app", 1500);
await sleep(1500);
await focus("app", A.getByText("Impressions").first(), 1.45, 1600, { x: 1070, y: 290 });
await sleep(900);

// 2 — Sliders list: search, filters, grid, quick actions
console.log(`[${now().toFixed(1)}s] 2 Sliders list: search, filters,`);
await flat("app", 1000);
await tap("app", A.getByRole("button", { name: /^Sliders/ }).first());
await film("caption", "Every slider in one place", "Search, filter and manage in seconds");
await focus("app", A.getByLabel("Search sliders"), 1.35, 1100, { x: 760 });
await type(A.getByLabel("Search sliders"), "home");
await sleep(700);
await A.getByLabel("Search sliders").fill("");
await tap("app", A.getByRole("button", { name: /^published/ }));
await flat("app", 700);
await tap("app", A.getByRole("button", { name: "Grid view" }));
await sleep(900);
await tap("app", A.getByRole("button", { name: "Table view" }));
await tap("app", A.getByRole("button", { name: "Actions for Homepage Hero" }));
await focus("app", A.getByRole("menuitem").first(), 1.6, 900, { y: 380 });
await sleep(900);
await page.keyboard.press("Escape");
await flat("app", 900);

if (process.env.FILM_STOP === "2") {
  await trace("end of scene 2");
  await page.screenshot({ path: path.join(root, "failure.png") });
  process.exit(0);
}
// 3 — Templates gallery, then create-from-template
console.log(`[${now().toFixed(1)}s] 3 Templates gallery, then create`);
cue({ arp: true });
await tap("app", A.getByRole("button", { name: "Templates", exact: true }).first());
await film("caption", "Start from a template", "Hero, product, promotion, gallery and more");
await film("shot", "app", { x: 1100, y: 560, s: 0.92, rx: 14, ry: 0 }, 1400);
await A.locator("main").evaluate(() =>
  document.scrollingElement.scrollTo({ top: 700, behavior: "smooth" }),
);
await sleep(1400);
await A.locator("main").evaluate(() =>
  document.scrollingElement.scrollTo({ top: 0, behavior: "instant" }),
);
await flat("app", 700);
await tap("app", A.getByRole("button", { name: "Products", exact: true }));
await sleep(300);
await tap("app", A.getByRole("button", { name: "Use Product Carousel" }));
await focus("app", A.getByRole("dialog"), 1.35, 900);
await type(A.getByRole("dialog").getByLabel("Slider name"), "Summer Launch", 45);
await sleep(600);
await page.keyboard.press("Escape");
await flat("app", 500);

// 4 — Editor: slides, layers, live preview
console.log(`[${now().toFixed(1)}s] 4 Editor: slides, layers, live p`);
await cut("app");
await A.getByRole("button", { name: /^Sliders/ }).first().click();
await sleep(400);
await A.getByText("Homepage Hero").first().click();
await sleep(900);
await film("caption", "A real-time visual editor", "What you see is exactly what visitors get");
await film("shot", "app", { x: 960, y: 540, s: 0.86, rx: 0, ry: 12 }, 0);
await flat("app", 1400);
await sleep(1400);
await focus("app", A.getByRole("heading", { name: /^Slides/ }), 1.7, 1000, { x: 150, y: 330 });
await tap("app", A.getByRole("button", { name: /^Slide actions: Materials/ }));
await sleep(800);
await page.keyboard.press("Escape");
await flat("app", 800);
await film("caption", "Add text and buttons", "Then drag them anywhere on the slide");
await tap("app", A.getByRole("button", { name: "Button", exact: true }));
await sleep(400);
// Drag the new button across the preview (camera is flat, so page = stage coords).
{
  const layer = A.locator(".swiper-slide-active .sl-layer").last();
  const p = await centre(layer);
  await film("cursor", "app", p.x, p.y, 500);
  await sleep(500);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  for (let i = 1; i <= 24; i++) {
    const x = p.x + i * 18;
    const y = p.y - i * 6;
    await page.mouse.move(x, y);
    await film("cursor", "app", x, y, 40);
    await sleep(35);
  }
  await page.mouse.up();
  await sleep(700);
}
await tap("app", A.getByRole("button", { name: "Undo" }));
await sleep(300);
await tap("app", A.getByRole("button", { name: "Undo" }), { ms: 200 });
await sleep(400);

// 5 — Style: blur, overlay, frosted panel, text shadow
console.log(`[${now().toFixed(1)}s] 5 Style: blur, overlay, frosted `);
await cut("app");
await choose("app", A.getByRole("combobox").first(), "Style");
await film("caption", "Style every slide", "Blur, gradient overlays, frosted glass");
await film("shot", "app", { x: 960, y: 560, s: 1.02, rx: 2, ry: -5 }, 1300);
await sleep(600);
await type(A.getByLabel("Blur (px)"), "2", 100);
await sleep(400);
await choose("app", A.getByLabel("Overlay type"), "Gradient");
await sleep(400);
const panelToggle = A.locator("summary", { hasText: "Frosted text panel" });
await tap("app", panelToggle);
await tap("app", A.locator("details", { has: panelToggle }).getByRole("switch").first());
await sleep(700);
await choose("app", A.getByLabel("Text shadow"), "Soft");
await sleep(600);

// 6 — Motion, visibility and devices
console.log(`[${now().toFixed(1)}s] 6 Motion, visibility and devices`);
await choose("app", A.getByRole("combobox").first(), "Animation");
await film("caption", "Motion, rules and every device");
await choose("app", A.getByLabel("Type"), "Fade up");
await choose("app", A.getByRole("combobox").first(), "Visibility");
await tap("app", A.getByRole("button", { name: "Add condition" }));
await sleep(500);
await flat("app", 700);
await tap("app", A.getByRole("button", { name: "tablet preview" }));
await film("shot", "app", { x: 900, y: 520, s: 1.05, rx: 6, ry: 0 }, 700);
await sleep(700);
await tap("app", A.getByRole("button", { name: "mobile preview" }));
await sleep(800);
await tap("app", A.getByRole("button", { name: "desktop preview" }));
await flat("app", 600);

// 7 — Slider settings with tooltips
console.log(`[${now().toFixed(1)}s] 7 Slider settings with tooltips`);
await cut("app");
await tap("app", A.getByRole("button", { name: "Slider settings" }));
await film("caption", "Fine-tune the whole slider", "With a helpful tip on every setting");
await film("shot", "app", { x: 1640, y: 470, s: 1.65, rx: 0, ry: 0 }, 1100);
await sleep(400);
await aim("app", A.getByRole("button", { name: "About Effect" }));
await A.getByRole("button", { name: "About Effect" }).hover({ force: true });
await sleep(1500);
await choose("app", A.getByLabel("Effect", { exact: true }), "Crossfade");
await tap("app", A.getByRole("switch").first());
await sleep(500);
await choose("app", A.getByLabel("Settings section"), "Dots");
await sleep(800);
await tap("app", A.getByRole("tab", { name: "Responsive" }));
await sleep(900);
await flat("app", 700);
await tap("app", A.getByRole("button", { name: "Save", exact: true }));
await sleep(700);

// 8 — Analytics and media
console.log(`[${now().toFixed(1)}s] 8 Analytics and media`);
await cut("app");
await A.getByRole("button", { name: "Back to sliders" }).click();
await sleep(500);
await A.getByRole("button", { name: "Analytics", exact: true }).first().click();
await film("caption", "Know what performs", "Impressions, clicks and devices");
await film("shot", "app", { x: 960, y: 560, s: 0.78, rx: 18, ry: 10 }, 0);
await film("shot", "app", { x: 960, y: 480, s: 1.08, rx: 4, ry: 0 }, 2200);
await sleep(2200);
await tap("app", A.getByRole("button", { name: "Media", exact: true }).first());
await film("caption", "All your media, ready to use");
await film("shot", "app", { x: 1100, y: 600, s: 0.95, rx: 10, ry: -6 }, 1500);
await sleep(1500);

// 9 — Site editor: the real widget settings panel
console.log(`[${now().toFixed(1)}s] 9 Site editor: the real widget s`);
await film("hideCursor");
await film("shot", "panel", { x: 960, y: 540, s: 0.7, rx: 12, ry: -26 }, 0);
await cut("panel");
await film("caption", "Add it to any page", "Tune it right in the site editor");
await film("shot", "panel", { x: 1000, y: 540, s: 0.86, rx: 4, ry: -10 }, 1800);
await sleep(1800);
await flat("panel", 900);
await focus("panel", P.getByText("Play automatically"), 1.7, 1000, { x: 1720 });
// Wix toggles: click the switch on the same row as each label.
const toggle = (label) =>
  P.getByText(label, { exact: true })
    .locator("xpath=ancestor::*[.//input[@type='checkbox']][1]")
    .locator("input[type=checkbox]")
    .first();
await tap("panel", toggle("Play automatically"), { hold: 500 }).catch((e) =>
  console.warn("panel toggle:", e.message.split("\n")[0]),
);
await tap("panel", toggle("Center active slide"), { hold: 500 }).catch((e) =>
  console.warn("panel toggle:", e.message.split("\n")[0]),
);
await sleep(600);
await flat("panel", 900);
await film("hideCursor");
await sleep(900);

// 10 — Live site on every screen
console.log(`[${now().toFixed(1)}s] 10 Live site on every screen`);
await film("devices", "stack");
await cut("site");
await film("caption", "Beautiful on every screen", "Desktop, tablet and mobile");
await sleep(200);
await film("devices", "spread");
await film("shot", "site", { x: 960, y: 560, s: 0.94, rx: 6, ry: -8 }, 2400);
await sleep(2600);
await film("shot", "site", { x: 1500, y: 650, s: 1.35, rx: 0, ry: -14 }, 1800);
await sleep(2000);

// 11 — End card
console.log(`[${now().toFixed(1)}s] 11 End card`);
await film("caption", null);
cue({ outro: true });
await cut("end");
await sleep(4800);
const duration = now();

await cdp.send("Page.stopScreencast");
await writing;
console.log(`recorded ${duration.toFixed(1)}s, ${shots.length} frames`);

// Screencast timestamps run on Chrome's own clock, so anchor them to the
// arrival time of the first frame after the film started.
const kept = shots.filter((s) => s.at >= start);
const origin = kept[0].t - (kept[0].at - start) / 1000;
const end = origin + duration;
const gaps = kept.slice(1).map((s, i) => s.t - kept[i].t);
console.log(
  `avg fps ${(kept.length / duration).toFixed(1)}, longest gap ${Math.max(...gaps).toFixed(3)}s`,
);
{
  // Busiest second approximates achievable fps during motion.
  const perSecond = new Map();
  for (const s of kept) {
    const k = Math.floor(s.t - origin);
    perSecond.set(k, (perSecond.get(k) ?? 0) + 1);
  }
  const counts = [...perSecond.values()].sort((a, b) => b - a);
  console.log(`fps p90 ${counts[Math.floor(counts.length * 0.1)]}, median ${counts[Math.floor(counts.length / 2)]}`);
}
if (DRY) {
  await browser.close();
  process.exit(0);
}

// ---- Score
const wav = Buffer.from(
  await page.evaluate(([c, d]) => window.__film.renderWav(c, d), [cues, duration]),
  "base64",
);
await writeFile(path.join(work, "score.wav"), wav);
await browser.close();

// ---- Encode: resample to an exact 30 fps sequence. For each output tick,
// pipe the newest frame captured at or before it into ffmpeg (the concat
// demuxer stretches sub-1/25 s images, which made the picture drift).
const FPS = 30;
const encoder = spawn(
  ffmpeg,
  [
    "-y",
    "-f", "image2pipe",
    "-c:v", "mjpeg",
    "-framerate", String(FPS),
    "-i", "-",
    "-i", path.join(work, "score.wav"),
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-r", String(FPS),
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    out,
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);
const encoded = new Promise((resolve, reject) => {
  encoder.on("error", reject);
  encoder.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
  );
});
let j = 0;
const total = Math.round(duration * FPS);
for (let k = 0; k < total; k++) {
  const t = origin + k / FPS;
  while (j + 1 < kept.length && kept[j + 1].t <= t) j++;
  const buf = await readFile(kept[j].file);
  if (!encoder.stdin.write(buf))
    await new Promise((r) => encoder.stdin.once("drain", r));
}
encoder.stdin.end();
await encoded;
await rm(work, { recursive: true, force: true });
console.log(out);
