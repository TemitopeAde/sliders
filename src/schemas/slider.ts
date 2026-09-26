import { z } from "zod";
const n = (min: number, max: number, value: number) =>
  z.number().finite().min(min).max(max).default(value);
export const safeUrl = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      !value ||
      /^\/(?!\/)/.test(value) ||
      (() => {
        try {
          return ["https:", "http:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      })(),
    "Use an https:// URL or a relative /path",
  );
export const color = z.string().regex(/^#[\da-fA-F]{3,8}$/, "Use a hex color");
export const positionSchema = z.enum([
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
]);
export const typographySchema = z.object({
  fontFamily: z.string().max(100).default("inherit"),
  fontSize: n(8, 160, 40),
  fontWeight: n(100, 900, 600),
  lineHeight: n(0.8, 3, 1.2),
  letterSpacing: n(-5, 20, 0),
  color: color.default("#ffffff"),
});
export const buttonSchema = z.object({
  label: z.string().max(80).default(""),
  url: safeUrl.default(""),
  newTab: z.boolean().default(false),
  background: color.default("#ffffff"),
  color: color.default("#20252f"),
  hoverBackground: color.default("#e6e8ee"),
  hoverColor: color.default("#20252f"),
  radius: n(0, 100, 6),
  padding: n(0, 60, 14),
  fontSize: n(8, 40, 14),
  fontWeight: n(100, 900, 600),
  borderWidth: n(0, 10, 0),
  borderColor: color.default("#ffffff"),
});
export const deviceSchema = z.enum(["desktop", "tablet", "mobile"]);
export const breakpointSchema = z.object({
  slidesPerView: n(1, 12, 1),
  slidesPerGroup: n(1, 12, 1),
  gap: n(0, 100, 16),
  height: n(100, 1500, 480),
  navigation: z.boolean().default(true),
  pagination: z.boolean().default(true),
  textSize: n(10, 120, 40),
  buttonSize: n(8, 40, 14),
  alignment: positionSchema.default("center-left"),
  mediaFit: z.enum(["cover", "contain", "fill"]).default("cover"),
});
export const responsiveSchema = z.object({
  desktop: breakpointSchema.default({}),
  tablet: breakpointSchema.default({ height: 400, textSize: 32 }),
  mobile: breakpointSchema.default({ height: 360, textSize: 26, gap: 12 }),
});
export const settingsSchema = z.object({
  effect: z
    .enum([
      "slide",
      "fade",
      "crossfade",
      "centered",
      "multi-item",
      "free-scroll",
    ])
    .default("slide"),
  autoplay: z.boolean().default(false),
  delay: n(1000, 60000, 5000),
  speed: n(0, 5000, 500),
  pauseOnHover: z.boolean().default(true),
  pauseOnInteraction: z.boolean().default(true),
  loop: z.boolean().default(true),
  swipe: z.boolean().default(true),
  mouseDrag: z.boolean().default(true),
  keyboard: z.boolean().default(true),
  centered: z.boolean().default(false),
  autoHeight: z.boolean().default(false),
  direction: z.enum(["horizontal", "vertical"]).default("horizontal"),
  initialSlide: n(0, 199, 0),
  loopAdditionalSlides: n(0, 20, 0),
  pagination: z
    .enum(["bullets", "fraction", "progressbar", "none"])
    .default("bullets"),
  paginationColor: color.default("#bfc6d4"),
  paginationActiveColor: color.default("#4263eb"),
  paginationSize: n(3, 30, 8),
  paginationSpacing: n(0, 30, 8),
  paginationPosition: z.enum(["bottom", "top"]).default("bottom"),
  arrowSize: n(16, 80, 36),
  arrowColor: color.default("#20252f"),
  arrowBackground: color.default("#ffffff"),
  arrowBorder: color.default("#e6e8ee"),
  arrowRadius: n(0, 100, 50),
  arrowOpacity: n(0, 1, 1),
  arrowPosition: z.enum(["inside", "outside"]).default("inside"),
  arrowIcon: z.enum(["chevron", "arrow"]).default("chevron"),
  width: n(10, 100, 100),
  maxWidth: n(200, 3840, 1600),
  minHeight: n(0, 1500, 0),
  background: color.default("#ffffff"),
  borderWidth: n(0, 20, 0),
  borderColor: color.default("#e6e8ee"),
  borderStyle: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  radius: n(0, 100, 12),
  padding: n(0, 100, 0),
  margin: n(0, 100, 0),
  shadow: z.enum(["none", "soft", "strong"]).default("none"),
  analytics: z.boolean().default(true),
  typography: z
    .object({
      heading: typographySchema.default({}),
      description: typographySchema.default({
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.6,
      }),
      badge: typographySchema.default({ fontSize: 12 }),
      price: typographySchema.default({ fontSize: 24 }),
    })
    .default({}),
  collectionId: z.string().max(100).default(""),
  productSort: z.enum(["manual", "newest", "name", "price"]).default("manual"),
  syncProducts: z.boolean().default(true),
});
export const layerSchema = z.object({
  _id: z.string().min(1).max(100),
  kind: z.enum(["text", "button"]),
  text: z.string().max(3000).default(""),
  variant: z
    .enum(["heading", "paragraph", "badge", "price"])
    .default("paragraph"),
  zone: positionSchema.default("center-left"),
  offsetX: n(-2000, 2000, 0),
  offsetY: n(-2000, 2000, 0),
  width: n(5, 100, 80),
  maxWidth: n(40, 2000, 640),
  inheritTypography: z.boolean().default(true),
  typography: typographySchema.default({}),
  button: buttonSchema.default({}),
  devices: z
    .object({
      desktop: z.boolean().default(true),
      tablet: z.boolean().default(true),
      mobile: z.boolean().default(true),
    })
    .default({}),
});
export const scheduleSchema = z
  .object({ start: z.string().default(""), end: z.string().default("") })
  .superRefine((v, ctx) => {
    for (const key of ["start", "end"] as const)
      if (v[key] && !Number.isFinite(Date.parse(v[key])))
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Enter a valid date and time",
        });
    if (v.start && v.end && Date.parse(v.start) >= Date.parse(v.end))
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End must be after start",
      });
  });
export const conditionSchema = z.object({
  kind: z.enum([
    "page",
    "not-page",
    "member",
    "guest",
    "device",
    "country",
    "day",
    "time",
    "role",
    "inventory",
  ]),
  value: z.string().max(200),
});
export const visibilitySchema = z.object({
  operator: z.enum(["AND", "OR"]).default("AND"),
  conditions: z.array(conditionSchema).max(30).default([]),
});
const common = {
  _id: z.string().min(1).max(100),
  title: z.string().trim().min(1, "Enter a slide title").max(160),
  enabled: z.boolean().default(true),
  description: z.string().max(3000).default(""),
  badge: z.string().max(100).default(""),
  subtitle: z.string().max(200).default(""),
  discount: z.string().max(100).default(""),
  primaryButton: buttonSchema.default({}),
  secondaryButton: buttonSchema.default({}),
  link: safeUrl.default(""),
  media: z
    .object({
      url: safeUrl.default(""),
      alt: z.string().max(300).default(""),
      poster: safeUrl.default(""),
      fit: z.enum(["cover", "contain", "fill"]).default("cover"),
      focalX: n(0, 100, 50),
      focalY: n(0, 100, 50),
      zoom: n(1, 3, 1),
      radius: n(0, 100, 0),
      autoplay: z.boolean().default(false),
      muted: z.boolean().default(true),
      loop: z.boolean().default(true),
      controls: z.boolean().default(true),
      playsInline: z.boolean().default(true),
      pauseInactive: z.boolean().default(true),
      resumeActive: z.boolean().default(false),
    })
    .default({}),
  style: z
    .object({
      background: color.default("#183c37"),
      gradient: color.default("#183c37"),
      useGradient: z.boolean().default(false),
      overlay: n(0, 1, 0.2),
      overlayColor: color.default("#000000"),
      position: positionSchema.default("center-left"),
      offsetX: n(-500, 500, 0),
      offsetY: n(-500, 500, 0),
      contentWidth: n(10, 100, 80),
      maxContentWidth: n(100, 2000, 640),
      padding: n(0, 200, 40),
      heading: typographySchema.default({}),
      description: typographySchema.default({
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.6,
      }),
      inheritTypography: z.boolean().default(true),
    })
    .default({}),
  animation: z
    .object({
      type: z
        .enum([
          "none",
          "fade",
          "fade-up",
          "fade-down",
          "fade-left",
          "fade-right",
          "zoom",
          "scale",
          "slide-up",
          "slide-down",
        ])
        .default("none"),
      duration: n(0, 5000, 600),
      delay: n(0, 10000, 0),
      easing: z
        .enum(["ease", "ease-in", "ease-out", "ease-in-out", "linear"])
        .default("ease-out"),
    })
    .default({}),
  responsive: z
    .object({
      desktop: z.boolean().default(true),
      tablet: z.boolean().default(true),
      mobile: z.boolean().default(true),
      mobileHeadingSize: n(10, 120, 26),
      tabletHeadingSize: n(10, 120, 32),
    })
    .default({}),
  visibility: visibilitySchema.default({}),
  schedule: scheduleSchema.default({}),
  layers: z.array(layerSchema).max(40).default([]),
};
export const imageSlideSchema = z.object({
  ...common,
  type: z.literal("image"),
});
export const videoSlideSchema = z.object({
  ...common,
  type: z.literal("video"),
});
export const promotionSlideSchema = z.object({
  ...common,
  type: z.literal("promotion"),
});
export const textSlideSchema = z.object({ ...common, type: z.literal("text") });
export const productSlideSchema = z.object({
  ...common,
  type: z.literal("product"),
  productId: z.string().max(100).default(""),
  productFields: z
    .object({
      image: z.boolean().default(true),
      name: z.boolean().default(true),
      description: z.boolean().default(false),
      price: z.boolean().default(true),
      discountedPrice: z.boolean().default(true),
      saleBadge: z.boolean().default(true),
      sku: z.boolean().default(false),
      stock: z.boolean().default(false),
      viewProduct: z.boolean().default(true),
      addToCart: z.boolean().default(false),
    })
    .default({}),
});
type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw =>
  typeof v === "object" && v !== null ? (v as Raw) : {};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
/** Converts slides saved before layers existed (fixed badge/title/description/
 * buttons fields) into equivalent layers, so older sliders keep rendering. */
function migrateLegacyLayers(input: unknown) {
  const raw = obj(input);
  if (Array.isArray(raw.layers) || raw.type === "product" || !raw._id)
    return input;
  const style = obj(raw.style);
  const base = {
    zone: style.position ?? "center-left",
    offsetX: style.offsetX ?? 0,
    offsetY: style.offsetY ?? 0,
    width: style.contentWidth ?? 80,
    maxWidth: style.maxContentWidth ?? 640,
  };
  const layers: Raw[] = [];
  const add = (layer: Raw) =>
    layers.push({ ...base, ...layer, _id: `${raw._id}-l${layers.length}` });
  const text = (value: unknown, variant: string) =>
    str(value) && add({ kind: "text", variant, text: str(value) });
  text(raw.badge, "badge");
  text(raw.subtitle, "paragraph");
  text(raw.title, "heading");
  text(raw.description, "paragraph");
  text(raw.discount, "price");
  for (const key of ["primaryButton", "secondaryButton"]) {
    const b = obj(raw[key]);
    if (str(b.label)) add({ kind: "button", text: str(b.label), button: b });
  }
  if (str(raw.link))
    add({
      kind: "button",
      text: "Learn more →",
      button: {
        url: str(raw.link),
        background: "#00000000",
        hoverBackground: "#00000000",
        color: obj(style.heading).color ?? "#ffffff",
        hoverColor: obj(style.heading).color ?? "#ffffff",
        padding: 0,
      },
    });
  return {
    ...raw,
    layers,
    badge: "",
    subtitle: "",
    description: "",
    discount: "",
    link: "",
    primaryButton: {},
    secondaryButton: {},
  };
}
export const slideSchema = z.preprocess(
  migrateLegacyLayers,
  z.discriminatedUnion("type", [
    imageSlideSchema,
    videoSlideSchema,
    productSlideSchema,
    promotionSlideSchema,
    textSlideSchema,
  ]),
);
export const sliderTypeSchema = z.enum([
  "image",
  "video",
  "product",
  "promotion",
  "mixed",
  "hero",
  "portfolio",
  "logo",
  "announcement",
]);
export const createSliderSchema = z
  .object({
    name: z.string().trim().min(1, "Give your slider a name").max(100),
    type: sliderTypeSchema.default("image"),
    templateId: z.string().max(100).optional(),
  })
  .strict();
export const sliderSchema = z.object({
  _id: z.string(),
  name: z.string().trim().min(1).max(100),
  type: sliderTypeSchema,
  status: z.enum(["draft", "published", "disabled"]).default("draft"),
  settings: settingsSchema.default({}),
  responsiveSettings: responsiveSchema.default({}),
  slides: z.array(slideSchema).max(200).default([]),
  revision: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const updateSliderSchema = sliderSchema
  .omit({ _id: true, createdAt: true, updatedAt: true })
  .strict();
export const templateSchema = z.object({
  _id: z.string(),
  name: z.string().min(1).max(100),
  category: z.string().max(100),
  thumbnail: safeUrl,
  settings: settingsSchema,
  responsiveSettings: responsiveSchema,
  slides: z.array(slideSchema).max(200),
});
export const appSettingsSchema = z.object({
  analytics: z.boolean().default(true),
  respectDnt: z.boolean().default(true),
  defaultAutoplay: z.boolean().default(false),
  catalogVersion: z.enum(["V1", "V3"]).default("V1"),
});
export type Slide = z.infer<typeof slideSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type LayerZone = z.infer<typeof positionSchema>;
export type Slider = z.infer<typeof sliderSchema>;
export type SliderSettings = z.infer<typeof settingsSchema>;
export type ResponsiveSettings = z.infer<typeof responsiveSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type SliderTemplate = z.infer<typeof templateSchema>;
export type VisibilityCondition = z.infer<typeof conditionSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export const createSlide = (type: Slide["type"] = "image"): Slide =>
  slideSchema.parse({
    _id: crypto.randomUUID(),
    title: `Untitled ${type}`,
    type,
  });
