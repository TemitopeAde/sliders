import { app } from "@wix/astro/builders";
import myPage from "./extensions/dashboard/pages/my-page/my-page.extension.ts";

import sliderCarousel from "./extensions/site/widgets/slider-carousel/slider-carousel.extension.ts";

import dataCollections from "./extensions/backend/data-collections/data-collections.extension.ts";

import slidersAiTools from "./extensions/backend/app-tools/sliders-ai-tools/sliders-ai-tools.extension.ts";

import sliderTools from "./extensions/backend/service-plugins/slider-tools/slider-tools.extension.ts";

import appInstalled from "./extensions/backend/events/app-installed/app-installed.extension.ts";

import paidPlanPurchased from "./extensions/backend/events/paid-plan-purchased/paid-plan-purchased.extension.ts";

import paidPlanChanged from "./extensions/backend/events/paid-plan-changed/paid-plan-changed.extension.ts";

import appRemoved from "./extensions/backend/events/app-removed/app-removed.extension.ts";

import paidPlanAutoRenewalCancelled from './extensions/backend/events/paid-plan-auto-renewal-cancelled/paid-plan-auto-renewal-cancelled.extension.ts';

import planConvertedToPaid from './extensions/backend/events/plan-converted-to-paid/plan-converted-to-paid.extension.ts';

import planReactivated from './extensions/backend/events/plan-reactivated/plan-reactivated.extension.ts';

import planTransferred from './extensions/backend/events/plan-transferred/plan-transferred.extension.ts';

import slideshow from './extensions/site/components/slideshow/slideshow.extension.ts';
import slideshowPanel from './extensions/site/components/slideshow/panel.extension.ts';

export default app()
  .use(myPage)
  .use(sliderCarousel)
  .use(dataCollections)
  .use(slidersAiTools)
  .use(sliderTools)
  .use(appInstalled)
  .use(paidPlanPurchased)
  .use(paidPlanChanged)
  .use(appRemoved).use(paidPlanAutoRenewalCancelled).use(planConvertedToPaid).use(planReactivated).use(planTransferred).use(slideshow).use(slideshowPanel);
