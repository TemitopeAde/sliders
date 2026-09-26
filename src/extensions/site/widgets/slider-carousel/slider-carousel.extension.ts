import { extensions } from "@wix/astro/builders";

export default extensions.customElement({
  id: "ccea1a56-11df-49eb-935d-1c8c6d2974b8",
  name: "Sliders Carousel",
  width: {
    defaultWidth: 980,
    allowStretch: true,
  },
  height: {
    defaultHeight: 480,
  },
  installation: {
    autoAdd: false,
  },
  presets: [
    {
      id: "367c3aed-cf38-413f-b7b8-ec900cfeae65",
      name: "default",
      thumbnailUrl: "{{BASE_URL}}/slider-carousel-thumbnail.png",
    },
  ],

  tagName: "slider-carousel",
  element: "./extensions/site/widgets/slider-carousel/slider-carousel.tsx",
  settings:
    "./extensions/site/widgets/slider-carousel/slider-carousel.panel.tsx",
});
