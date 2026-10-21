import { extensions } from "@wix/astro/builders";
import { LAYOUT } from "@wix/react-component-schema";
import { withEditorElementDefaults } from "@wix/react-component-utils";
import merge from "deepmerge";
import { editorElement } from "./slideshow.generated";
import { defaultProps } from "./slideshow.props";
import componentUrl from "./component.tsx?url";
import componentPreviewUrl from "./component.preview.tsx?url";
import { SLIDER_PICKER_PANEL_ID } from "./panel.extension";

const editorElementWithDefaults = withEditorElementDefaults(
  editorElement,
  defaultProps,
);

export default extensions.editorReactComponent({
  id: "0777b48b-fee3-4613-9721-361fc452f4a0",
  type: "sliders.Slideshow",
  displayName: "Slideshow",
  description:
    "Image slideshow with captions and buttons; can also show a slider built in the Slideshow Studio dashboard",
  editorElement: merge(editorElementWithDefaults, {
    layout: {
      resizeDirection: LAYOUT.RESIZE_DIRECTION.horizontalAndVertical,
    },
    // Panel and AI-facing labels for props whose generated names read poorly.
    data: {
      intervalSeconds: { displayName: "Seconds per slide" },
      dashboardSliderId: { displayName: "Dashboard slider ID" },
    },
    elements: {
      slideshowNavButton: { inlineElement: { displayName: "Arrows" } },
      slideshowDot: { inlineElement: { displayName: "Slide dots" } },
    },
    // The slider ID is chosen from a list in the "Choose slider" panel, not
    // typed. deepmerge appends this to the generated hide list.
    displayFilters: { data: { hide: ["dashboardSliderId"] } },
    customActions: {
      chooseSlider: {
        displayName: "Choose slider",
        execution: {
          actionType: "panel",
          panel: { panelType: "panelId", panelId: SLIDER_PICKER_PANEL_ID },
        },
      },
    },
  }),
  installation: {
    staticContainer: "HOMEPAGE",
    initialSize: {
      width: {
        sizingType: LAYOUT.SIZING_TYPE.pixels,
        pixels: 980,
      },
      height: {
        sizingType: LAYOUT.SIZING_TYPE.pixels,
        pixels: 480,
      },
    },
  },
  resources: {
    client: {
      componentUrl,
    },
    editor: {
      componentUrl: componentPreviewUrl,
    },
  },
});
