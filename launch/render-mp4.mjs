import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "playwright";

const root = path.dirname(new URL(import.meta.url).pathname);
const work = path.join(root, ".render");
const mp4 = path.join(root, "sliders-launch.mp4");
const require = createRequire("/tmp/fftools/package.json");
const ffmpeg = require("ffmpeg-static");

const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  });

const probe = (file) =>
  new Promise((resolve, reject) => {
    let out = "";
    const child = spawn(ffmpeg, ["-i", file], { stdio: ["ignore", "ignore", "pipe"] });
    child.stderr.on("data", (chunk) => {
      out += chunk;
    });
    child.on("error", reject);
    child.on("exit", () => {
      const match = out.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!match) reject(new Error(`No duration in ${out}`));
      else resolve(Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]));
    });
  });

await mkdir(work, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: work, size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();
const opened = Date.now();
await page.goto("http://127.0.0.1:8765/?record=1", { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.click("#gate");
const clicked = Date.now();
console.log("recording");
const started = await page.waitForFunction(() => window.__film.time() > 0.2, null, { timeout: 8000 }).then(() => true).catch(() => false);
if (!started) {
  const state = await page.evaluate(() => ({ state: window.__film.state(), error: window.__film.error || null }));
  throw new Error(`Film clock did not start: ${JSON.stringify(state)}`);
}
await page.waitForFunction(() => document.body.classList.contains("ended"), null, { timeout: 100000 });
const ended = Date.now();
const video = page.video();
await context.close();
const webm = await video.path();

const audioPage = await browser.newPage();
await audioPage.goto("http://127.0.0.1:8765/?record=1", { waitUntil: "load" });
const wavPath = path.join(work, "score.wav");
const stream = createWriteStream(wavPath);
const b64 = await audioPage.evaluate(() => window.__film.renderWav());
await new Promise((resolve, reject) => {
  stream.on("finish", resolve);
  stream.on("error", reject);
  stream.end(Buffer.from(b64, "base64"));
});
await browser.close();

const duration = await probe(webm);
const played = (ended - clicked) / 1000;
const prefix = Math.max(0, duration - played - 0.35);
console.log(`video ${duration.toFixed(2)}s, trim ${prefix.toFixed(2)}s, played ${played.toFixed(2)}s`);

await run([
  "-y",
  "-ss",
  prefix.toFixed(3),
  "-i",
  webm,
  "-i",
  wavPath,
  "-map",
  "0:v:0",
  "-map",
  "1:a:0",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-crf",
  "18",
  "-preset",
  "medium",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-movflags",
  "+faststart",
  "-t",
  "75",
  mp4,
]);
await rm(work, { recursive: true, force: true });
console.log(mp4);
