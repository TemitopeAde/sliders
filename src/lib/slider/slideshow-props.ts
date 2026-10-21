import { z } from "zod";
import {
  createSlide,
  safeUrl,
  type Slide,
  type Slider,
} from "../../schemas/slider";
// Converts between dashboard sliders and the Harmony Slideshow component's
// props, so the AI tools can move content either way. The component holds a
// simpler model: one image, a title, a description and one button per slide.
export const slideshowSlideSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    image: z
      .object({
        url: z.string().max(2048),
        uri: z.string().max(500).optional(),
        alt: z.string().max(300).optional(),
      })
      .passthrough(),
    title: z.string().max(160).optional(),
    description: z.string().max(3000).optional(),
    buttonLabel: z.string().max(80).optional(),
    link: z
      .object({
        href: z.string().max(2048).optional(),
        target: z.enum(["_self", "_blank"]).optional(),
        rel: z.string().max(100).optional(),
      })
      .optional(),
  })
  .strict();
export const slideshowPlaybackSchema = z
  .object({
    autoPlay: z.boolean().optional(),
    intervalSeconds: z.number().min(2).max(20).optional(),
    loop: z.boolean().optional(),
  })
  .strict();
export type SlideshowSlide = z.infer<typeof slideshowSlideSchema>;
export type SlideshowPlayback = z.infer<typeof slideshowPlaybackSchema>;
/** Wix media URLs carry the file URI the editor's image picker expects. */
const mediaUri = (url: string) =>
  url.match(/static\.wixstatic\.com\/media\/([^/?#]+)/)?.[1];
const layerText = (slide: Slide, variant: "heading" | "paragraph") =>
  slide.layers.find((l) => l.kind === "text" && l.variant === variant && l.text)
    ?.text;
// Video and product slides have no equivalent in the component.
const supported = new Set<Slide["type"]>(["image", "promotion", "text"]);
export function sliderToSlideshowProps(slider: Slider) {
  const slides: SlideshowSlide[] = [];
  const skipped: { title: string; reason: string }[] = [];
  for (const slide of slider.slides) {
    if (!slide.enabled) {
      skipped.push({ title: slide.title, reason: "Slide is turned off." });
      continue;
    }
    if (!supported.has(slide.type)) {
      skipped.push({
        title: slide.title,
        reason: `${slide.type} slides can't be shown by the Slideshow component.`,
      });
      continue;
    }
    const button = slide.layers.find(
      (l) => l.kind === "button" && l.text && l.button.url,
    );
    const uri = mediaUri(slide.media.url);
    slides.push({
      name: slide.title,
      image: {
        url: slide.media.url,
        ...(uri ? { uri } : {}),
        alt: slide.media.alt,
      },
      title: layerText(slide, "heading") ?? slide.title,
      description: layerText(slide, "paragraph") ?? slide.description,
      ...(button
        ? {
            buttonLabel: button.text,
            link: {
              href: button.button.url,
              target: button.button.newTab ? "_blank" : "_self",
            },
          }
        : {}),
    });
  }
  return {
    slides,
    autoPlay: slider.settings.autoplay,
    intervalSeconds: Math.min(
      20,
      Math.max(2, Math.round(slider.settings.delay / 1000)),
    ),
    loop: slider.settings.loop,
    skipped,
  };
}
/** Builds dashboard slides; links the dashboard can't store are dropped and
 * reported, since only web URLs and site paths are allowed there. */
export function slideshowPropsToSlides(slides: SlideshowSlide[]) {
  const warnings: string[] = [];
  const result = slides.map((s) => {
    const href = s.link?.href ?? "";
    const linkOk = !!href && safeUrl.safeParse(href).success;
    if (href && !linkOk)
      warnings.push(`Dropped the button link on "${s.name}": ${href}`);
    return createSlide("image", {
      title: (s.title || s.name).slice(0, 160),
      description: s.description ?? "",
      media: { url: s.image.url, alt: s.image.alt ?? "" },
      primaryButton:
        s.buttonLabel && linkOk
          ? {
              label: s.buttonLabel,
              url: href,
              newTab: s.link?.target === "_blank",
            }
          : {},
    });
  });
  return { slides: result, warnings };
}
