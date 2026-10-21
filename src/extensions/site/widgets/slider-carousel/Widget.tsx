import { window as wixWindow } from "@wix/site-window";
import { Slider } from "../../../../components/slider/Slider";
import {
  usePublishedSlider,
  type PublishedSliderError,
} from "../../../../hooks/usePublishedSlider";
const detectEditor = async () => (await wixWindow.viewMode()) === "Editor";
const editorMessages: Record<PublishedSliderError, string> = {
  "": "",
  missing: "Choose a published slider in widget settings.",
  unpublished: "Publish a slider and select it in widget settings.",
  unavailable: "This slider is temporarily unavailable.",
};
export interface WidgetProps {
  sliderId: string;
  settings: string;
  responsive: string;
  previewSnapshot: string;
}
export function Widget({
  sliderId,
  settings,
  responsive,
  previewSnapshot,
}: WidgetProps) {
  const { slider, editor, error, products, context, onEvent } =
    usePublishedSlider({
      sliderId,
      settings,
      responsive,
      previewSnapshot,
      detectEditor,
    });
  // Visitors only see the load-failure message; setup hints are editor-only.
  const message =
    editor || error === "unavailable" ? editorMessages[error] : "";
  return slider ? (
    <Slider
      slider={slider}
      preview={editor}
      context={context}
      products={products}
      onEvent={onEvent}
    />
  ) : message ? (
    <p
      role="status"
      style={{
        padding: 24,
        fontFamily: "sans-serif",
        fontSize: 14,
        color: "#727782",
      }}
    >
      {message}
    </p>
  ) : null;
}
