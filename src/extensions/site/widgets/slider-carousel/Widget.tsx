import { useEffect, useState, useCallback } from "react";
import { items } from "@wix/data";
import { window as wixWindow } from "@wix/site-window";
import { members } from "@wix/members";
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
import {
  getProduct,
  queryProducts,
  type StoreProduct,
} from "../../../../lib/wix/products";
// A slider holds at most 200 slides.
const MAX_PRODUCTS = 200;
async function collectionProducts(collectionId: string, sort: string) {
  const all: StoreProduct[] = [];
  for (let offset = 0; all.length < MAX_PRODUCTS; offset += 48) {
    const page = await queryProducts("", collectionId, sort, offset);
    all.push(...page.items);
    if (!page.hasNext) break;
  }
  return all.slice(0, MAX_PRODUCTS);
}
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
  const [products, setProducts] = useState<Record<string, StoreProduct>>({});
  const [context, setContext] = useState<{
    member?: boolean;
    stock?: Record<string, boolean>;
  }>({});
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
        const products: Record<string, StoreProduct> = {};
        if (!isEditor && result.settings.collectionId) {
          const list = await collectionProducts(
            result.settings.collectionId,
            result.settings.productSort,
          );
          result = {
            ...result,
            slides: list.map((p) =>
              createSlide("product", {
                _id: p.id,
                productId: p.id,
                title: p.name.slice(0, 160) || "Product",
              }),
            ),
          };
          for (const p of list) products[p.id] = p;
        }
        // Inventory rules need each product's stock; unknown stock stays
        // unmatched, like the other rules.
        if (!isEditor)
          await Promise.all(
            result.slides.map(async (s) => {
              if (
                s.type !== "product" ||
                !s.productId ||
                s.productId in products ||
                !s.visibility.conditions.some((c) => c.kind === "inventory")
              )
                return;
              try {
                const p = await getProduct(s.productId);
                if (p) products[s.productId] = p;
              } catch (e) {
                console.warn("Slider widget could not check stock", e);
              }
            }),
          );
        // Member/guest rules need to know who is visiting; if the lookup
        // fails, those rules stay unmatched rather than guessing.
        let member: boolean | undefined;
        if (
          !isEditor &&
          result.slides.some((s) =>
            s.visibility.conditions.some(
              (c) => c.kind === "member" || c.kind === "guest",
            ),
          )
        ) {
          try {
            member = !!(await members.getCurrentMember()).member?._id;
          } catch (e) {
            console.warn("Slider widget could not check member status", e);
          }
        }
        if (alive) {
          setContext({
            member,
            stock: Object.fromEntries(
              Object.values(products).map((p) => [p.id, p.inStock]),
            ),
          });
          setProducts(products);
          setSlider(result);
        }
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
    <Slider
      slider={slider}
      preview={editor}
      context={context}
      products={products}
      onEvent={onEvent}
    />
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
