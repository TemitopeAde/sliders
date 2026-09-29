import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Image, Video, ShoppingBag, Tag, Type, Upload } from "lucide-react";
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
import { api } from "../../lib/api/client";
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
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const stores = useQuery({
    queryKey: ["stores-installation"],
    queryFn: () => api<{ installed: boolean }>("products?mode=installation"),
    enabled: open,
  });
  const productAvailable =
    stores.data?.installed === true && !stores.isFetching && !stores.isError;
  useEffect(() => {
    if (open && stores.isError && !stores.isFetching)
      toast.error(
        `Could not verify Wix Stores. Product slides are unavailable. ${stores.error.message}`,
        { duration: 5000 },
      );
  }, [open, stores.isError, stores.isFetching, stores.error]);
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
    setBusy(true);
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
      setBusy(false);
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
              type="button"
              disabled={busy || (t.value === "product" && !productAvailable)}
              aria-pressed={type === t.value}
              onClick={() => {
                setType(t.value);
                setMedia({ url: "", name: "" });
                setMediaError("");
              }}
              className={`border rounded-lg py-3 flex flex-col gap-2 items-center text-xs capitalize ${t.value === "product" && !productAvailable ? "border-dashed border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed" : ""} ${type === t.value ? "border-blue-500 bg-blue-50 text-blue-600" : ""}`}
            >
              <t.icon size={20} />
              {t.value}
              {t.value === "product" && !productAvailable && (
                <span className="text-[9px] normal-case">
                  {stores.isFetching
                    ? "Checking…"
                    : stores.data?.installed === false
                      ? "Stores needed"
                      : "Unavailable"}
                </span>
              )}
            </button>
          ))}
        </div>
        {stores.isFetching && open && (
          <p className="muted text-xs" role="status">
            Checking Wix Stores on this site…
          </p>
        )}
        {stores.data?.installed === false && (
          <p className="muted text-xs">
            Install Wix Stores to add product slides.
          </p>
        )}
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((data) => {
            if (type === "product" && !productAvailable) return;
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
              <input
                key={type}
                ref={fileInput}
                id="slide-media"
                type="file"
                accept={type === "video" ? "video/*" : "image/*"}
                disabled={busy}
                className="sr-only"
                aria-label={`Choose ${type === "video" ? "video" : "image"} from computer`}
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
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={16} /> Upload{" "}
                {type === "video" ? "video" : "image"} from computer
              </Button>
              {busy && (
                <div className="space-y-1" role="status">
                  <span className="text-xs">Uploading {progress}%</span>
                  <progress className="w-full" max={100} value={progress} />
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
