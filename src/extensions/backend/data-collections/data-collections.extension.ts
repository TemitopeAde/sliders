import { extensions } from "@wix/astro/builders";

import slidersCollection from "./sliders";

import publishedSlidersCollection from "./published-sliders";

import sliderTemplatesCollection from "./slider-templates";

import sliderAnalyticsCollection from "./slider-analytics";

import sliderSettingsCollection from "./slider-settings";

export default extensions.dataCollections({
  id: "4ca8805a-cdcf-4461-a761-97441491c5d3",
  name: "Data Collections",
  collections: [
    slidersCollection,
    publishedSlidersCollection,
    sliderTemplatesCollection,
    sliderAnalyticsCollection,
    sliderSettingsCollection,
  ],
});
