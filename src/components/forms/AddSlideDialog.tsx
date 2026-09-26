import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image, Video, ShoppingBag, Tag, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  createSlide,
  safeUrl,
  slideSchema,
  type Slide,
} from "../../schemas/slider";
import { ProductPicker } from "./ProductPicker";
const schema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(160),
  url: safeUrl.default(""),
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
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", url: "", description: "" },
  });
  const types = [
    { value: "image", icon: Image },
    { value: "video", icon: Video },
    { value: "product", icon: ShoppingBag },
    { value: "promotion", icon: Tag },
    { value: "text", icon: Type },
  ] as const;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => setType(t.value)}
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
            if (type === "product" && !productId) {
              form.setError("title", { message: "Select a product first" });
              return;
            }
            const slide = slideSchema.parse({
              ...createSlide(type),
              title: data.title,
              description: data.description,
              media: { url: data.url, alt: data.title },
              ...(type === "product" ? { productId } : {}),
            });
            onAdd(slide);
            form.reset();
            setProductId("");
            onOpenChange(false);
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
            <div>
              <label htmlFor="slide-media" className="field-label">
                {type === "video" ? "Video" : "Image"} URL
              </label>
              <Input
                id="slide-media"
                placeholder="https://…"
                {...form.register("url")}
              />
              <p className="muted mt-1">
                You can also choose from Wix Media Manager in the editor.
              </p>
              {form.formState.errors.url && (
                <p className="text-red-600 text-xs">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting}>Add slide</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
