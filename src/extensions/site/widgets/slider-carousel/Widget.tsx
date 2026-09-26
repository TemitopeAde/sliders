import { useEffect, useState, useCallback } from "react";
import { items } from "@wix/data";
import { window as wixWindow } from "@wix/site-window";
import {
  sliderSchema,
  settingsSchema,
  responsiveSchema,
  createSlide,
  type Slider as SliderModel,
} from "../../../../schemas/slider";
import { Slider } from "../../../../components/slider/Slider";
import { COLLECTIONS } from "../../../../lib/wix/collections";
import { track } from "../../../../lib/analytics/tracker";
import type { AnalyticsEvent } from "../../../../schemas/analytics";
import { queryProducts } from "../../../../lib/wix/products";
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
  const [slider, setSlider] = useState<SliderModel>();
  const [editor, setEditor] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setSlider(undefined);
    setError("");
    async function load() {
      try {
        const mode = await wixWindow.viewMode();
        if (!alive) return;
        const isEditor = mode === "Editor";
        setEditor(isEditor);
        if (!sliderId) {
          setError(
            isEditor ? "Choose a published slider in widget settings." : "",
          );
          return;
        }
        const raw = isEditor
          ? previewSnapshot
            ? JSON.parse(previewSnapshot)
            : undefined
          : await items.get(COLLECTIONS.published, sliderId);
        if (!raw) {
          setError(
            isEditor
              ? "Publish a slider and select it in widget settings."
              : "",
          );
          return;
        }
        let result = sliderSchema.parse(raw);
        if (settings)
          result = {
            ...result,
            settings: settingsSchema.parse(JSON.parse(settings)),
          };
        if (responsive)
          result = {
            ...result,
            responsiveSettings: responsiveSchema.parse(JSON.parse(responsive)),
          };
        if (!isEditor && result.settings.collectionId) {
          const products = await queryProducts(
            "",
            result.settings.collectionId,
            result.settings.productSort,
          );
          result = {
            ...result,
            slides: products.items.map((p) => ({
              ...createSlide("product"),
              _id: p.id,
              type: "product" as const,
              productId: p.id,
              title: p.name,
              productFields: {
                image: true,
                name: true,
                description: false,
                price: true,
                discountedPrice: true,
                saleBadge: true,
                sku: false,
                stock: false,
                viewProduct: true,
                addToCart: false,
              },
            })),
          };
        }
        if (alive) setSlider(result);
      } catch (e) {
        console.error("Slider widget could not load", e);
        if (alive) setError("This slider is temporarily unavailable.");
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [sliderId, settings, responsive, previewSnapshot]);
  const onEvent = useCallback(
    (event: AnalyticsEvent["event"], slideId?: string) => {
      if (slider?.settings.analytics && !editor)
        track(slider._id, event, slideId);
    },
    [slider, editor],
  );
  return slider ? (
    <Slider slider={slider} preview={editor} onEvent={onEvent} />
  ) : error ? (
    <p
      role="status"
      style={{
        padding: 24,
        fontFamily: "sans-serif",
        fontSize: 14,
        color: "#727782",
      }}
    >
      {error}
    </p>
  ) : null;
}
