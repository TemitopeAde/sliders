import { extensions } from "@wix/astro/builders";
import panelUrl from "./panel.tsx?url";

export const SLIDER_PICKER_PANEL_ID = "0dbafec9-28e0-4a52-8d38-da9df8314cb8";

export default extensions.editorReactComponentPanel({
  id: SLIDER_PICKER_PANEL_ID,
  displayName: "Choose slider",
  contentType: "code",
  code: {
    bundleUrl: panelUrl,
  },
  size: {
    height: 320,
    width: "SMALL",
  },
});
