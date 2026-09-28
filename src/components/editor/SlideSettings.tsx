import { useEffect, useRef, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { toast } from "sonner";
import { ImagePlus, Upload } from "lucide-react";
import { uploadSlideMedia } from "../../lib/wix/upload-slide-media";
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
const styleLabels = {
  gradient: "Gradient end color",
  gradientAngle: "Gradient angle (°)",
  mediaBlur: "Blur (px)",
  mediaOpacity: "Opacity",
  mediaBrightness: "Brightness (%)",
  mediaContrast: "Contrast (%)",
  mediaSaturation: "Saturation (%)",
  mediaGrayscale: "Grayscale (%)",
  overlay: "Overlay opacity",
  overlayType: "Overlay type",
  overlayColor: "Overlay color",
  overlayColor2: "Overlay end color",
  overlayAngle: "Overlay angle (°)",
  panel: "Frosted text panel",
};
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
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
  const uploadFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith(slide.type === "video" ? "video/" : "image/")) {
      toast.error(
        `Choose ${slide.type === "video" ? "a video" : "an image"} file.`,
      );
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadSlideMedia(file, setProgress);
      set({
        ...slide,
        media: { ...slide.media, url: uploaded.url, alt: uploaded.name },
      });
      toast.success(
        "Added to Wix Media Manager. Processing may take a moment.",
      );
    } catch (e) {
      console.error("Slide media upload failed", e);
      toast.error(e instanceof Error ? e.message : "Media upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
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
          <input
            ref={fileInput}
            type="file"
            accept={slide.type === "video" ? "video/*" : "image/*"}
            className="sr-only"
            aria-label={`Upload ${slide.type === "video" ? "video" : "image"}`}
            onChange={(event) => void uploadFile(event.target.files?.[0])}
          />
          <Button
            variant="outline"
            className="w-full"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} />
            {uploading ? `Uploading ${progress}%` : "Upload to Wix Media"}
          </Button>
          {uploading && (
            <progress
              className="w-full"
              max={100}
              value={progress}
              aria-label="Media upload progress"
            />
          )}
          <Button
            variant="outline"
            className="w-full"
            disabled={uploading}
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
          {slide.media.url && (
            <div className="rounded-lg overflow-hidden border">
              {slide.type === "video" ? (
                <video
                  src={slide.media.url}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              ) : (
                <img
                  src={slide.media.url}
                  alt={slide.media.alt || slide.title}
                  className="w-full"
                />
              )}
            </div>
          )}
          {slide.type === "video" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  const result = await dashboard.openMediaManager({
                    category: "IMAGE",
                    multiSelect: false,
                  });
                  const poster = result?.items[0];
                  if (poster?.url)
                    set({
                      ...slide,
                      media: { ...slide.media, poster: poster.url },
                    });
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Could not choose a poster.",
                  );
                }
              }}
            >
              Choose video poster from Wix Media
            </Button>
          )}
          <SchemaFields
            schema={imageSlideSchema.shape.media}
            value={slide.media}
            exclude={
              slide.type === "video"
                ? ["url", "poster"]
                : [
                    "url",
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
      {tab === "Style" &&
        [
          {
            title: "Background",
            only: ["background", "useGradient", "gradient", "gradientAngle"],
          },
          ...(slide.media.url
            ? [
                {
                  title: "Media",
                  only: [
                    "mediaBlur",
                    "mediaOpacity",
                    "mediaBrightness",
                    "mediaContrast",
                    "mediaSaturation",
                    "mediaGrayscale",
                  ],
                },
              ]
            : []),
          {
            title: "Overlay",
            only: [
              "overlay",
              "overlayType",
              "overlayColor",
              ...(slide.style.overlayType === "gradient"
                ? ["overlayColor2", "overlayAngle"]
                : []),
            ],
          },
          {
            title: "Text",
            only: [
              "panel",
              "textShadow",
              "inheritTypography",
              "heading",
              "description",
            ],
          },
        ].map((group) => (
          <section key={group.title}>
            <h3 className="eyebrow mb-3">{group.title}</h3>
            <SchemaFields
              schema={imageSlideSchema.shape.style}
              value={slide.style}
              only={group.only}
              labels={styleLabels}
              onChange={(v) => set({ ...slide, style: v })}
            />
          </section>
        ))}
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
