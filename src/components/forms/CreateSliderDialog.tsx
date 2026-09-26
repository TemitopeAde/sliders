import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  LayoutTemplate,
  Layers,
  Loader2,
  Search,
} from "lucide-react";
import {
  createSliderSchema,
  type Slider,
  type SliderTemplate,
} from "../../schemas/slider";
import { api } from "../../lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Choice } from "./Fields";
export function CreateSliderDialog({
  open,
  onOpenChange,
  onCreated,
  templates,
  templateId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (v: Slider) => void;
  templates: SliderTemplate[];
  templateId?: string;
}) {
  const [browsing, setBrowsing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const initialized = useRef(false);
  const form = useForm<z.infer<typeof createSliderSchema>>({
    resolver: zodResolver(createSliderSchema),
    defaultValues: { name: "", type: "image" },
  });
  useEffect(() => {
    if (!open) {
      initialized.current = false;
    } else if (!initialized.current) {
      form.reset({
        name: templates.find((t) => t._id === templateId)?.name ?? "",
        type: "image",
        templateId,
      });
      setBrowsing(false);
      setSearch("");
      setCategory("All");
      initialized.current = true;
    }
  }, [open, templateId, form, templates]);
  const selectedId = form.watch("templateId");
  const selected = templates.find((t) => t._id === selectedId);
  const categories = ["All", ...new Set(templates.map((t) => t.category))];
  const visibleTemplates = templates.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      `${t.name} ${t.category}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const chooseTemplate = (template?: SliderTemplate) => {
    const currentName = form.getValues("name");
    if (template && (!currentName || currentName === selected?.name)) {
      form.setValue("name", template.name, { shouldValidate: true });
    }
    form.setValue("templateId", template?._id, { shouldValidate: true });
    setBrowsing(false);
  };
  const submit = form.handleSubmit(async (data) => {
    try {
      const slider = await api<Slider>("sliders", "POST", data);
      toast.success("Slider created");
      form.reset();
      onOpenChange(false);
      onCreated(slider);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create slider");
    }
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !form.formState.isSubmitting && onOpenChange(v)}
    >
      <DialogContent
        className={
          browsing ? "sm:max-w-3xl max-h-[90vh] overflow-y-auto" : "sm:max-w-lg"
        }
      >
        <DialogHeader>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Layers size={22} />
          </div>
          <DialogTitle>
            {browsing ? "Choose a template" : "Create a slider"}
          </DialogTitle>
          <DialogDescription>
            {browsing
              ? "Pick a starting point. You can customize every slide after creation."
              : "Start with a blank canvas or make a template your own."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className={browsing ? "hidden" : "space-y-5"}>
          <div>
            <label htmlFor="slider-name" className="field-label">
              Slider name
            </label>
            <Input
              id="slider-name"
              placeholder="e.g. Summer collection"
              autoFocus
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          {!selected && (
            <Choice
              label="Slider type"
              value={form.watch("type")}
              options={[
                "image",
                "video",
                "product",
                "promotion",
                "mixed",
                "hero",
                "portfolio",
                "logo",
                "announcement",
              ]}
              onChange={(v) =>
                form.setValue(
                  "type",
                  v as z.infer<typeof createSliderSchema>["type"],
                )
              }
            />
          )}
          <div>
            <span className="field-label">Starting point</span>
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {selected?.name ?? "Blank slider"}
                </p>
                <p className="text-xs text-gray-500">
                  {selected
                    ? `${selected.category} · ${selected.slides.length} ${selected.slides.length === 1 ? "slide" : "slides"}`
                    : "Build your slides from scratch"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBrowsing(true)}
              >
                <LayoutTemplate size={16} />
                {selected ? "Change template" : "Choose template"}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Create slider
            </Button>
          </div>
        </form>
        {browsing && (
          <div className="space-y-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <Input
                aria-label="Search templates"
                placeholder="Search templates by name or category"
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
              />
            </div>
            <div
              className="flex gap-1 overflow-x-auto pb-1"
              aria-label="Template categories"
            >
              {categories.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={category === item ? "secondary" : "ghost"}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 max-h-[52vh] overflow-y-auto pr-1">
              {!search.trim() && category === "All" && (
                <button
                  type="button"
                  onClick={() => chooseTemplate()}
                  aria-pressed={!selected}
                  className={`text-left rounded-md border p-3 min-h-32 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${!selected ? "border-blue-500 bg-blue-50" : ""}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Layers size={17} /> Blank slider{" "}
                    {!selected && <Check size={16} className="ml-auto" />}
                  </span>
                  <span className="block text-xs text-gray-500 mt-2">
                    Start from scratch with your choice of slider type.
                  </span>
                </button>
              )}
              {visibleTemplates.map((template) => (
                <button
                  key={template._id}
                  type="button"
                  onClick={() => chooseTemplate(template)}
                  aria-pressed={selectedId === template._id}
                  className={`text-left rounded-md border p-2 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selectedId === template._id ? "border-blue-500 bg-blue-50" : ""}`}
                >
                  <div
                    className="relative h-24 rounded overflow-hidden"
                    style={{ background: template.slides[0]?.style.background }}
                  >
                    {template.thumbnail && (
                      <img
                        src={template.thumbnail}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    {template.thumbnail && (
                      <span
                        className="absolute inset-0 bg-black/35"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`absolute left-3 bottom-3 right-3 text-sm font-semibold leading-tight line-clamp-2 ${template.thumbnail ? "text-white" : "text-gray-800"}`}
                    >
                      {template.slides[0]?.title}
                    </span>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-medium mt-2">
                    <span className="truncate">{template.name}</span>
                    {selectedId === template._id && (
                      <Check size={16} className="ml-auto shrink-0" />
                    )}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {template.category} · {template.slides.length}{" "}
                    {template.slides.length === 1 ? "slide" : "slides"}
                  </span>
                </button>
              ))}
            </div>
            {visibleTemplates.length === 0 && (
              <p className="text-sm text-gray-500 text-center">
                No templates match these filters.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setBrowsing(false)}
            >
              <ArrowLeft size={16} /> Back to slider details
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
