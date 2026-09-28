import { app } from "@wix/astro/builders";
import myPage from "./extensions/dashboard/pages/my-page/my-page.extension.ts";

import sliderCarousel from "./extensions/site/widgets/slider-carousel/slider-carousel.extension.ts";

import dataCollections from "./extensions/backend/data-collections/data-collections.extension.ts";

import slidersAiTools from "./extensions/backend/app-tools/sliders-ai-tools/sliders-ai-tools.extension.ts";

import sliderTools from "./extensions/backend/service-plugins/slider-tools/slider-tools.extension.ts";

export default app()
  .use(myPage)
  .use(sliderCarousel)
  .use(dataCollections)
  .use(slidersAiTools)
  .use(sliderTools);
