import { useState } from "react";
import { dashboard } from "@wix/dashboard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image, Video, ShoppingBag, Tag, Type, ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createSlide, slideSchema, type Slide } from "../../schemas/slider";
import { uploadSlideMedia } from "../../lib/wix/upload-slide-media";
import { ProductPicker } from "./ProductPicker";
const schema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(160),
  description: z.string().max(3000).default(""),
});
export function AddSlideDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (s: Slide) => void;
}) {
  const [type, setType] = useState<Slide["type"]>("image");
  const [productId, setProductId] = useState("");
  const [media, setMedia] = useState({ url: "", name: "" });
  const [busyAction, setBusyAction] = useState<"upload" | "picker" | null>(
    null,
  );
  const busy = busyAction !== null;
  const [progress, setProgress] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });
  const changeOpen = (next: boolean) => {
    if (!next && busy) return;
    if (!next) {
      form.reset();
      setType("image");
      setProductId("");
      setMedia({ url: "", name: "" });
      setMediaError("");
      setProgress(0);
    }
    onOpenChange(next);
  };
  const selectFile = async (file?: File) => {
    if (!file) return;
    const expected = type === "video" ? "video/" : "image/";
    if (!file.type.startsWith(expected)) {
      setMediaError(
        `Choose ${type === "video" ? "a video" : "an image"} file.`,
      );
      return;
    }
    setBusyAction("upload");
    setMediaError("");
    setProgress(0);
    try {
      const uploaded = await uploadSlideMedia(file, setProgress);
      setMedia(uploaded);
    } catch (error) {
      console.error("Slide media upload failed", error);
      setMediaError(
        error instanceof Error ? error.message : "Media upload failed.",
      );
    } finally {
      setBusyAction(null);
    }
  };
  const selectFromWix = async () => {
    setBusyAction("picker");
    setMediaError("");
    try {
      const result = await dashboard.openMediaManager({
        category: type === "video" ? "VIDEO" : "IMAGE",
        multiSelect: false,
      });
      const file = result?.items[0];
      if (file?.url)
        setMedia({ url: file.url, name: file.displayName ?? "Wix media" });
    } catch (error) {
      console.error("Wix Media Manager selection failed", error);
      setMediaError(
        error instanceof Error
          ? error.message
          : "Could not open Wix Media Manager.",
      );
    } finally {
      setBusyAction(null);
    }
  };
  const types = [
    { value: "image", icon: Image },
    { value: "video", icon: Video },
    { value: "product", icon: ShoppingBag },
    { value: "promotion", icon: Tag },
    { value: "text", icon: Type },
  ] as const;
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a slide</DialogTitle>
          <DialogDescription>
            Choose the content you want to bring to life.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2">
          {types.map((t) => (
            <button
              key={t.value}
              disabled={busy}
              onClick={() => {
                setType(t.value);
                setMedia({ url: "", name: "" });
                setMediaError("");
              }}
              className={`border rounded-lg py-3 flex flex-col gap-2 items-center text-xs capitalize ${type === t.value ? "border-blue-500 bg-blue-50 text-blue-600" : ""}`}
            >
              <t.icon size={20} />
              {t.value}
            </button>
          ))}
        </div>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((data) => {
            if ((type === "image" || type === "video") && !media.url) {
              setMediaError(
                `Choose ${type === "video" ? "a video" : "an image"} first.`,
              );
              return;
            }
            if (type === "product" && !productId) {
              form.setError("title", { message: "Select a product first" });
              return;
            }
            const slide = slideSchema.parse({
              ...createSlide(type),
              title: data.title,
              description: data.description,
              media: { url: media.url, alt: media.name || data.title },
              ...(type === "product" ? { productId } : {}),
            });
            onAdd(slide);
            changeOpen(false);
          })}
        >
          <div>
            <label htmlFor="slide-title" className="field-label">
              Title
            </label>
            <Input id="slide-title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-red-600">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          {type === "product" ? (
            <ProductPicker
              selected={productId}
              onSelect={(p) => {
                setProductId(p.id);
                form.setValue("title", p.name);
              }}
            />
          ) : type !== "text" ? (
            <div className="space-y-2">
              <label htmlFor="slide-media" className="field-label">
                {type === "video" ? "Video" : "Image"} file
              </label>
              <Input
                id="slide-media"
                type="file"
                accept={type === "video" ? "video/*" : "image/*"}
                disabled={busy}
                onChange={(event) => {
                  void selectFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={() => void selectFromWix()}
              >
                <ImagePlus size={16} /> Choose from Wix Media Manager
              </Button>
              {busy && (
                <div className="space-y-1" role="status">
                  <span className="text-xs">
                    {busyAction === "upload"
                      ? `Uploading ${progress}%`
                      : "Opening Wix Media Manager…"}
                  </span>
                  {busyAction === "upload" && (
                    <progress className="w-full" max={100} value={progress} />
                  )}
                </div>
              )}
              {media.url && (
                <div className="rounded-lg border p-2">
                  {type === "video" ? (
                    <video
                      src={media.url}
                      controls
                      preload="metadata"
                      className="w-full"
                    />
                  ) : (
                    <img src={media.url} alt={media.name} className="w-full" />
                  )}
                  <p className="text-xs mt-1 truncate">{media.name}</p>
                </div>
              )}
              {mediaError && (
                <p role="alert" className="text-red-600 text-xs">
                  {mediaError}
                </p>
              )}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={busy || form.formState.isSubmitting}>
              Add slide
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
