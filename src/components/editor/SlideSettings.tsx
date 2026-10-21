import { useEffect, useRef, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { toast } from "sonner";
import { ImagePlus, Upload, RefreshCw, Trash2, Film } from "lucide-react";
import { uploadSlideMedia } from "../../lib/wix/upload-slide-media";
import { formatLimit } from "../../lib/media-limits";
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
import { Choice, InfoTip } from "../forms/Fields";
import { slideHelp } from "../../lib/slider/editor-help";
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
  const kind = slide.type === "video" ? "video" : "image";
  const pickFromWix = async (
    category: "IMAGE" | "VIDEO",
    apply: (file: { url: string; name?: string }) => void,
  ) => {
    try {
      const result = await dashboard.openMediaManager({
        category,
        multiSelect: false,
      });
      const file = result?.items[0];
      if (file?.url) apply({ url: file.url, name: file.displayName });
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Open the editor inside Wix to use Media Manager.",
      );
    }
  };
  const chooseMedia = () =>
    pickFromWix(slide.type === "video" ? "VIDEO" : "IMAGE", (file) =>
      set({
        ...slide,
        media: { ...slide.media, url: file.url, alt: file.name ?? slide.title },
      }),
    );
  const removeMedia = () => {
    set({ ...slide, media: { ...slide.media, url: "", alt: "", poster: "" } });
    toast.success(
      `${kind === "video" ? "Video" : "Image"} removed — use Undo to restore it`,
    );
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
        tip="Choose which settings to edit for the selected slide. Changes apply to this slide only."
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
            hints={slideHelp}
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
                hints={slideHelp}
                path="productFields"
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
          {slide.media.url ? (
            <div className="rounded-lg overflow-hidden border bg-white">
              <div className="bg-gray-900/5">
                {slide.type === "video" ? (
                  <video
                    key={slide.media.url}
                    src={slide.media.url}
                    poster={slide.media.poster || undefined}
                    controls
                    preload="metadata"
                    className="w-full max-h-48 object-contain"
                  />
                ) : (
                  <img
                    src={slide.media.url}
                    alt={slide.media.alt || slide.title}
                    className="w-full max-h-48 object-contain"
                  />
                )}
              </div>
              <div className="grid grid-cols-3 border-t divide-x">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                  className="py-2 text-[11px] flex flex-col items-center gap-1 text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                  {uploading ? `${progress}%` : "Replace"}
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void chooseMedia()}
                  className="py-2 text-[11px] flex flex-col items-center gap-1 text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50"
                >
                  <ImagePlus size={14} />
                  Wix Media
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={removeMedia}
                  className="py-2 text-[11px] flex flex-col items-center gap-1 text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-5 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void uploadFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2">
                {kind === "video" ? (
                  <Film size={18} />
                ) : (
                  <ImagePlus size={18} />
                )}
              </div>
              <p className="text-xs font-medium mb-1">
                No {kind} on this slide
              </p>
              <p className="muted text-[11px] mb-3">
                Drop a file here, upload one, or pick from Wix Media.
                <br />
                Max {formatLimit(kind)} per {kind}.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={14} />
                  {uploading ? `Uploading ${progress}%` : `Upload ${kind}`}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => void chooseMedia()}
                >
                  <ImagePlus size={14} />
                  Choose from Wix Media
                </Button>
              </div>
            </div>
          )}
          {uploading && (
            <progress
              className="w-full"
              max={100}
              value={progress}
              aria-label="Media upload progress"
            />
          )}
          {slide.type === "video" && slide.media.url && (
            <div>
              <div className="flex items-center gap-1 mb-[7px]">
                <span className="field-label mb-0!">Poster image</span>
                <InfoTip
                  label="Poster image"
                  text={slideHelp["media.poster"] ?? ""}
                />
              </div>
              <div className="flex items-center gap-3 border rounded-lg p-2">
                <div className="w-16 h-10 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {slide.media.poster ? (
                    <img
                      src={slide.media.poster}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlus size={14} className="text-gray-400" />
                  )}
                </div>
                <span className="text-[11px] text-gray-500 flex-1">
                  {slide.media.poster
                    ? "Shown before the video plays"
                    : "No poster yet"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() =>
                    void pickFromWix("IMAGE", (file) =>
                      set({
                        ...slide,
                        media: { ...slide.media, poster: file.url },
                      }),
                    )
                  }
                >
                  {slide.media.poster ? "Replace" : "Choose"}
                </Button>
                {slide.media.poster && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Remove poster"
                    className="hover:text-red-600"
                    onClick={() =>
                      set({ ...slide, media: { ...slide.media, poster: "" } })
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          )}
          {slide.media.url && (
            <SchemaFields
              schema={imageSlideSchema.shape.media}
              hints={slideHelp}
              path="media"
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
          )}
        </>
      )}
      {tab === "Layout" && (
        <>
          <SchemaFields
            schema={imageSlideSchema.shape.style}
            value={slide.style}
            only={["padding"]}
            labels={{ padding: "Edge spacing (px)" }}
            hints={slideHelp}
            path="style"
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
              hints={slideHelp}
              path="style"
              onChange={(v) => set({ ...slide, style: v })}
            />
          </section>
        ))}
      {tab === "Animation" && (
        <SchemaFields
          schema={imageSlideSchema.shape.animation}
          hints={slideHelp}
          path="animation"
          value={slide.animation}
          onChange={(v) => set({ ...slide, animation: v })}
        />
      )}
      {tab === "Responsive" && (
        <SchemaFields
          schema={imageSlideSchema.shape.responsive}
          hints={slideHelp}
          path="responsive"
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
            hints={slideHelp}
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
