import {
  slideSchema,
  settingsSchema,
  responsiveSchema,
  type SliderTemplate,
  type Slider,
} from "../../schemas/slider";
const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=85`;
const designs = [
  [
    "hero-banner",
    "Hero Banner",
    "Hero",
    "photo-1600210492486-724fe5c67fb0",
    "Make room for beautiful living.",
    "Thoughtfully designed. Made for everyday.",
    "#363d36",
  ],
  [
    "product-carousel",
    "Product Carousel",
    "Products",
    "photo-1495474472287-4d71bcdd2085",
    "Your next everyday favorite.",
    "Discover the collection.",
    "#7e654d",
  ],
  [
    "featured-products",
    "Featured Products",
    "Products",
    "photo-1541643600914-78b084683601",
    "Considered essentials.",
    "The details make the difference.",
    "#b7a68b",
  ],
  [
    "best-sellers",
    "Best Sellers",
    "Products",
    "photo-1542291026-7eec264c27ff",
    "The favorites, for a reason.",
    "Discover our most-loved pieces.",
    "#ab3c32",
  ],
  [
    "new-arrivals",
    "New Arrivals",
    "Products",
    "photo-1441986300917-64674bd600d8",
    "A fresh perspective.",
    "Meet the newest additions.",
    "#283c35",
  ],
  [
    "sale-promotion",
    "Sale Promotion",
    "Promotions",
    "photo-1441986300917-64674bd600d8",
    "Good things. Better prices.",
    "A little something you will love.",
    "#294d43",
  ],
  [
    "collection-slider",
    "Collection Slider",
    "Products",
    "photo-1600210492486-724fe5c67fb0",
    "Find your signature.",
    "Explore our curated collections.",
    "#323d35",
  ],
  [
    "portfolio",
    "Portfolio",
    "Galleries",
    "photo-1518837695005-2083093ee35b",
    "A different point of view.",
    "Selected work. Lasting impressions.",
    "#304b50",
  ],
  [
    "photography",
    "Photography",
    "Galleries",
    "photo-1470770841072-f978cf4d019e",
    "Chasing the extraordinary.",
    "Stories told through a lens.",
    "#3b4941",
  ],
  [
    "video-showcase",
    "Video Showcase",
    "Video",
    "photo-1464822759023-fed622ff2c3b",
    "Every moment tells a story.",
    "Add your video to bring this scene to life.",
    "#303c48",
  ],
  [
    "logo-carousel",
    "Logo Carousel",
    "Content",
    "",
    "In good company.",
    "Trusted by teams who care about the details.",
    "#e8ede8",
  ],
  [
    "testimonial-slider",
    "Testimonial Slider",
    "Content",
    "",
    "“A thoughtful experience from start to finish.”",
    "Your customer name · Verified customer",
    "#e7e4dd",
  ],
  [
    "restaurant-promotion",
    "Restaurant Promotion",
    "Promotions",
    "photo-1414235077428-338989a2e8c0",
    "Something worth savoring.",
    "Seasonal ingredients. Memorable evenings.",
    "#433e32",
  ],
  [
    "event-promotion",
    "Event Promotion",
    "Promotions",
    "photo-1492684223066-81342ee5ff30",
    "Be part of something special.",
    "One evening. Endless possibilities.",
    "#373147",
  ],
  [
    "real-estate",
    "Real Estate Showcase",
    "Galleries",
    "photo-1600596542815-ffad4c1539a9",
    "Your next chapter starts here.",
    "Spaces that feel like home.",
    "#303c35",
  ],
  [
    "minimal-image",
    "Minimal Image Slider",
    "Galleries",
    "photo-1518837695005-2083093ee35b",
    "Less, but better.",
    "Let your images do the talking.",
    "#34454c",
  ],
  [
    "full-screen",
    "Full-Screen Slider",
    "Hero",
    "photo-1464822759023-fed622ff2c3b",
    "Go a little further.",
    "Discover what is waiting beyond the ordinary.",
    "#344c4b",
  ],
  [
    "multi-card",
    "Multi-Card Carousel",
    "Content",
    "photo-1495474472287-4d71bcdd2085",
    "Small rituals. Big difference.",
    "Discover something inspiring.",
    "#554337",
  ],
] as const;
export const starterTemplates: SliderTemplate[] = designs.map(
  ([id, name, category, image, title, description, background]) => {
    const multi =
      ["Products", "Content"].includes(category) && id !== "testimonial-slider";
    const isText = !image;
    const slide = slideSchema.parse({
      _id: `${id}-slide`,
      type: isText ? "text" : category === "Promotions" ? "promotion" : "image",
      title,
      description,
      badge: category === "Promotions" ? "LIMITED TIME" : "THE NEW COLLECTION",
      media: { url: image ? photo(image) : "", alt: name },
      style: {
        background,
        overlay: image ? 0.22 : 0,
        heading: { color: isText ? "#28372f" : "#ffffff" },
        description: { color: isText ? "#526257" : "#ffffff" },
        inheritTypography: !isText,
        position: "center-left",
      },
      primaryButton: { label: isText ? "" : "Explore collection", url: "" },
    });
    return {
      _id: id,
      name,
      category,
      thumbnail: image ? photo(image) : "",
      settings: settingsSchema.parse({
        effect: multi ? "multi-item" : "slide",
        radius: 12,
      }),
      responsiveSettings: responsiveSchema.parse({
        desktop: {
          slidesPerView: multi ? 3 : 1,
          height: id === "full-screen" ? 700 : 480,
          gap: 24,
        },
        tablet: { slidesPerView: multi ? 2 : 1, height: 400, gap: 16 },
        mobile: { height: 360, gap: 12 },
      }),
      slides: multi
        ? [
            slide,
            { ...slide, _id: `${id}-slide-2`, title: "Made to be enjoyed." },
            { ...slide, _id: `${id}-slide-3`, title: "Find your everyday." },
          ]
        : [slide],
    };
  },
);
export function templateToSlider(
  template: SliderTemplate,
  name = template.name,
): Slider {
  const now = new Date().toISOString();
  return {
    _id: crypto.randomUUID(),
    name,
    type:
      template.category === "Products"
        ? "product"
        : template.category === "Promotions"
          ? "promotion"
          : "image",
    status: "draft",
    settings: structuredClone(template.settings),
    responsiveSettings: structuredClone(template.responsiveSettings),
    slides: template.slides.map((s) => ({
      ...structuredClone(s),
      _id: crypto.randomUUID(),
    })),
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
}
