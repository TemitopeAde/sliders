import { aggregate } from "../../src/lib/analytics/aggregate";
import {
  starterTemplates,
  templateToSlider,
} from "../../src/lib/slider/templates";
import { appSettingsSchema, type Slider } from "../../src/schemas/slider";
import type { AnalyticsRecord } from "../../src/schemas/analytics";

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=85`;

const shots: Array<{
  templateId: string;
  id: string;
  name: string;
  status: Slider["status"];
  daysAgo: number;
  images: string[];
  titles?: string[];
  height?: number;
}> = [
  {
    templateId: "hero-banner",
    id: "slider-hero",
    name: "Homepage Hero",
    status: "published",
    daysAgo: 0,
    images: [
      "photo-1600210492486-724fe5c67fb0",
      "photo-1616486338812-3dadae4b4ace",
      "photo-1618221195710-dd6b41faaea6",
    ],
    height: 860,
    titles: [
      "Make room for beautiful living.",
      "Materials chosen to last.",
      "Designed for everyday light.",
    ],
  },
  {
    templateId: "product-carousel",
    id: "slider-products",
    name: "Spring Collection",
    status: "published",
    daysAgo: 1,
    images: [
      "photo-1495474472287-4d71bcdd2085",
      "photo-1514228742587-6b1558fcca3d",
      "photo-1442512595331-e89e73853f31",
    ],
    titles: [
      "Your next everyday favorite.",
      "Morning, poured slowly.",
      "The cup you reach for.",
    ],
  },
  {
    templateId: "portfolio",
    id: "slider-portfolio",
    name: "Studio Portfolio",
    status: "published",
    daysAgo: 3,
    images: [
      "photo-1518837695005-2083093ee35b",
      "photo-1470770841072-f978cf4d019e",
      "photo-1500530855697-b586d89ba3ee",
    ],
  },
  {
    templateId: "sale-promotion",
    id: "slider-sale",
    name: "Weekend Edit",
    status: "draft",
    daysAgo: 2,
    images: ["photo-1441986300917-64674bd600d8"],
  },
  {
    templateId: "photography",
    id: "slider-stories",
    name: "Lookbook",
    status: "published",
    daysAgo: 6,
    images: [
      "photo-1470770841072-f978cf4d019e",
      "photo-1469474968028-56623f02e42e",
      "photo-1500530855697-b586d89ba3ee",
    ],
  },
  {
    templateId: "new-arrivals",
    id: "slider-arrivals",
    name: "New Arrivals",
    status: "disabled",
    daysAgo: 12,
    images: [
      "photo-1523381210434-271e8be1f52b",
      "photo-1521572163474-6864f9cf17ab",
      "photo-1434389677669-e08b4cac3105",
    ],
  },
];

function stamp(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

export const sliders: Slider[] = shots.map((shot) => {
  const template = starterTemplates.find((item) => item._id === shot.templateId);
  if (!template) throw new Error(`Missing template ${shot.templateId}`);
  const slider = templateToSlider(template, shot.name);
  return {
    ...slider,
    _id: shot.id,
    status: shot.status,
    responsiveSettings: shot.height
      ? {
          ...slider.responsiveSettings,
          desktop: { ...slider.responsiveSettings.desktop, height: shot.height },
        }
      : slider.responsiveSettings,
    createdAt: stamp(shot.daysAgo + 20),
    updatedAt: stamp(shot.daysAgo),
    slides: (shot.images.length ? shot.images : [""]).map((image, index) => {
      const slide = slider.slides[Math.min(index, slider.slides.length - 1)];
      const title = shot.titles?.[index] ?? slide.title;
      return {
        ...structuredClone(slide),
        _id: `${shot.id}-slide-${index + 1}`,
        title,
        description: index === 0 ? slide.description : "Thoughtfully made for everyday.",
        media: image
          ? { ...slide.media, url: photo(image), alt: title }
          : slide.media,
      };
    }),
  };
});

const weights: Record<string, number> = {
  "slider-hero": 42,
  "slider-products": 28,
  "slider-portfolio": 16,
  "slider-stories": 9,
};

const session = (n: number) =>
  `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
const events: AnalyticsRecord[] = [];
for (let day = 29; day >= 0; day--) {
  const date = new Date(Date.now() - day * 86400000);
  for (const slider of sliders) {
    const weight = weights[slider._id];
    if (!weight) continue;
    const wave = 0.65 + 0.35 * Math.sin((29 - day) / 4);
    const views = Math.round(weight * wave * (day % 6 === 0 ? 0.75 : 1));
    for (let i = 0; i < views; i++) {
      const timestamp = new Date(date.getTime() + i * 60000).toISOString();
      const device = i % 5 === 0 ? "mobile" : i % 4 === 0 ? "tablet" : "desktop";
      const sessionId = session(day * 20 + (i % 6));
      const slideId = slider.slides[i % slider.slides.length]?._id ?? "";
      events.push({
        sliderId: slider._id,
        slideId,
        event: "slider_impression",
        sessionId,
        eventId: session(1_000_000 + day * 1000 + i),
        device,
        page: i % 3 === 0 ? "/shop" : "/",
        timestamp,
      });
      events.push({
        sliderId: slider._id,
        slideId,
        event: "slide_impression",
        sessionId,
        eventId: session(3_000_000 + day * 1000 + i),
        device,
        page: i % 3 === 0 ? "/shop" : "/",
        timestamp,
      });
      if (i % 7 === 0) {
        events.push({
          sliderId: slider._id,
          slideId: slider.slides[i % slider.slides.length]?._id ?? "",
          event: "cta_click",
          sessionId,
          eventId: session(2_000_000 + day * 1000 + i),
          device,
          page: "/",
          timestamp,
        });
      }
    }
  }
}

export const analytics = aggregate(events);
const safePhoto = (url: string) =>
  url
    .replaceAll("photo-1541643600914-78b084683601", "photo-1523381210434-271e8be1f52b")
    .replaceAll("photo-1542291026-7eec264c27ff", "photo-1521572163474-6864f9cf17ab");
export const templates = starterTemplates.map((template) => ({
  ...template,
  thumbnail: safePhoto(template.thumbnail),
  slides: template.slides.map((slide) => ({
    ...slide,
    media: { ...slide.media, url: safePhoto(slide.media.url) },
  })),
}));
export const settings = appSettingsSchema.parse({
  analytics: true,
  respectDnt: true,
  defaultAutoplay: false,
});
export const hero = sliders[0];
export const collection = sliders[1];
