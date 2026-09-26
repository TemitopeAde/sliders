import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Layers, Loader2 } from "lucide-react";
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
  const form = useForm<z.infer<typeof createSliderSchema>>({
    resolver: zodResolver(createSliderSchema),
    defaultValues: { name: "", type: "image" },
  });
  useEffect(() => {
    if (open)
      form.reset({
        name: templates.find((t) => t._id === templateId)?.name ?? "",
        type: "image",
        templateId,
      });
  }, [open, templateId, form, templates]);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Layers size={22} />
          </div>
          <DialogTitle>Create a slider</DialogTitle>
          <DialogDescription>
            Start with a blank canvas or make a template your own.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
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
          <div>
            <label htmlFor="slider-template" className="field-label">
              Starting point
            </label>
            <select
              id="slider-template"
              className="w-full border rounded-md p-2 text-sm bg-white"
              {...form.register("templateId")}
            >
              <option value="">Start blank</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
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
      </DialogContent>
    </Dialog>
  );
}
