import { useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import {
  slideSchema,
  imageSlideSchema,
  productSlideSchema,
  type Slide,
} from "../../schemas/slider";
import { SchemaFields } from "./SchemaFields";
import { LayersPanel } from "./LayersPanel";
import { VisibilitySettings } from "./VisibilitySettings";
import { ProductPicker } from "../forms/ProductPicker";
import { Button } from "../ui/button";
import { Choice } from "../forms/Fields";
export function SlideSettings({
  slide,
  onChange,
  selectedLayer,
  onSelectLayer,
}: {
  slide: Slide;
  onChange: (s: Slide) => void;
  selectedLayer?: string;
  onSelectLayer: (id?: string) => void;
}) {
  const [tab, setTab] = useState("Content");
  const [error, setError] = useState("");
  useEffect(() => {
    if (selectedLayer) setTab("Content");
  }, [selectedLayer]);
  const schema =
    slide.type === "product" ? productSlideSchema : imageSlideSchema;
  const set = (value: Record<string, unknown>) => {
    const result = slideSchema.safeParse({ ...value, type: slide.type });
    if (result.success) {
      setError("");
      onChange(result.data);
    } else {
      setError(result.error.issues[0]?.message ?? "Check this value");
      onChange({ ...value, type: slide.type } as Slide);
    }
  };
  const tabs = [
    "Content",
    "Media",
    "Layout",
    "Style",
    "Animation",
    "Responsive",
    "Visibility",
    "Advanced",
  ];
  return (
    <div className="space-y-5">
      <Choice
        label="Slide settings"
        value={tab}
        options={tabs}
        onChange={setTab}
      />
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {tab === "Content" && (
        <>
          <SchemaFields
            schema={schema}
            value={slide}
            only={["title"]}
            labels={{ title: "Slide name" }}
            onChange={set}
          />
          {slide.type !== "product" && (
            <LayersPanel
              layers={slide.layers}
              selected={selectedLayer}
              onSelect={onSelectLayer}
              onChange={(layers) => set({ ...slide, layers })}
            />
          )}
          {slide.type === "product" && (
            <>
              <ProductPicker
                selected={slide.productId}
                onSelect={(p) =>
                  onChange({ ...slide, productId: p.id, title: p.name })
                }
              />
              <SchemaFields
                schema={productSlideSchema.shape.productFields}
                value={slide.productFields}
                onChange={(v) => set({ ...slide, productFields: v })}
              />
            </>
          )}
        </>
      )}
      {tab === "Media" && (
        <>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                const result = await dashboard.openMediaManager({
                  category: slide.type === "video" ? "VIDEO" : "IMAGE",
                  multiSelect: false,
                });
                const file = result?.items[0];
                if (file?.url)
                  set({
                    ...slide,
                    media: {
                      ...slide.media,
                      url: file.url,
                      alt: file.displayName ?? slide.title,
                    },
                  });
              } catch (e) {
                toast.error(
                  e instanceof Error
                    ? e.message
                    : "Open the editor inside Wix to use Media Manager.",
                );
              }
            }}
          >
            <ImagePlus size={16} />
            Choose from Wix Media
          </Button>
          <SchemaFields
            schema={imageSlideSchema.shape.media}
            value={slide.media}
            exclude={
              slide.type === "video"
                ? []
                : [
                    "autoplay",
                    "muted",
                    "loop",
                    "controls",
                    "playsInline",
                    "pauseInactive",
                    "resumeActive",
                    "poster",
                  ]
            }
            onChange={(v) => set({ ...slide, media: v })}
          />
        </>
      )}
      {tab === "Layout" && (
        <>
          <SchemaFields
            schema={imageSlideSchema.shape.style}
            value={slide.style}
            only={["padding"]}
            labels={{ padding: "Edge spacing (px)" }}
            onChange={(v) => set({ ...slide, style: v })}
          />
          <p className="muted">
            Space kept between the slide edges and its text and buttons. Place
            each text or button from the Content tab, or drag it in the preview.
          </p>
        </>
      )}
      {tab === "Style" && (
        <SchemaFields
          schema={imageSlideSchema.shape.style}
          value={slide.style}
          only={[
            "background",
            "useGradient",
            "gradient",
            "overlay",
            "overlayColor",
            "inheritTypography",
            "heading",
            "description",
          ]}
          onChange={(v) => set({ ...slide, style: v })}
        />
      )}
      {tab === "Animation" && (
        <SchemaFields
          schema={imageSlideSchema.shape.animation}
          value={slide.animation}
          onChange={(v) => set({ ...slide, animation: v })}
        />
      )}
      {tab === "Responsive" && (
        <SchemaFields
          schema={imageSlideSchema.shape.responsive}
          value={slide.responsive}
          onChange={(v) => set({ ...slide, responsive: v })}
        />
      )}
      {tab === "Visibility" && (
        <VisibilitySettings slide={slide} onChange={onChange} />
      )}
      {tab === "Advanced" && (
        <>
          <SchemaFields
            schema={schema}
            value={slide}
            only={["enabled"]}
            onChange={set}
          />
          <div>
            <span className="field-label">Slide ID</span>
            <code className="text-[10px] break-all">{slide._id}</code>
          </div>
          <p className="muted">
            All changes apply only to this slide. Save your work, then publish
            to update your site.
          </p>
        </>
      )}
    </div>
  );
}
