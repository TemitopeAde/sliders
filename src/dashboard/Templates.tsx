import { useState } from "react";
import { ArrowUpRight, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Slider } from "../components/slider/Slider";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../components/ui/alert-dialog";
import { starterTemplates, templateToSlider } from "../lib/slider/templates";
import { api } from "../lib/api/client";
import type { SliderTemplate } from "../schemas/slider";
import { PageHeading } from "./Shared";
const SAVED = "My templates";
const isSaved = (t: SliderTemplate) =>
  !starterTemplates.some((s) => s._id === t._id);
export function TemplateCard({
  template,
  onUse,
  onPreview,
  onRename,
  onDelete,
}: {
  template: SliderTemplate;
  onUse: (t: SliderTemplate) => void;
  onPreview?: (t: SliderTemplate) => void;
  onRename?: (t: SliderTemplate) => void;
  onDelete?: (t: SliderTemplate) => void;
}) {
  return (
    <article className="surface p-3">
      <button
        onClick={() => onPreview?.(template)}
        aria-label={`Preview ${template.name}`}
        className="template-art w-full text-left block"
        style={{ background: template.slides[0]?.style.background }}
      >
        {template.thumbnail && (
          <img src={template.thumbnail} alt="" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <div className="absolute left-5 bottom-6 right-10 text-white">
          <span className="text-[8px] tracking-[.2em]">
            {template.slides[0]?.layers.find((l) => l.variant === "badge")
              ?.text || "MAKE IT YOUR OWN"}
          </span>
          <p className="text-xl leading-tight font-semibold mt-1 mb-0 max-w-44">
            {template.slides[0]?.title}
          </p>
        </div>
        <span className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5">
          <Eye size={13} />
        </span>
      </button>
      <div className="flex items-center justify-between pt-4 pb-1 px-1">
        <div>
          <h3 className="text-sm font-semibold mb-1">{template.name}</h3>
          <span className="text-xs text-gray-400">
            {template.category} · {template.slides.length}{" "}
            {template.slides.length === 1 ? "slide" : "slides"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onRename && (
            <Button
              aria-label={`Rename ${template.name}`}
              size="icon-sm"
              variant="ghost"
              onClick={() => onRename(template)}
            >
              <Pencil size={14} />
            </Button>
          )}
          {onDelete && (
            <Button
              aria-label={`Delete ${template.name}`}
              size="icon-sm"
              variant="ghost"
              onClick={() => onDelete(template)}
            >
              <Trash2 size={14} />
            </Button>
          )}
          <Button
            aria-label={`Use ${template.name}`}
            size="sm"
            variant="outline"
            onClick={() => onUse(template)}
          >
            Use
            <ArrowUpRight size={14} />
          </Button>
        </div>
      </div>
    </article>
  );
}
export function Templates({
  templates,
  onUse,
  onChanged,
}: {
  templates: SliderTemplate[];
  onUse: (t: SliderTemplate) => void;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState("All templates");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<SliderTemplate>();
  const [renaming, setRenaming] = useState<SliderTemplate>();
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<SliderTemplate>();
  const [busy, setBusy] = useState(false);
  const hasSaved = templates.some(isSaved);
  // Deleting the last saved template removes its tab; don't stay on it.
  const active = filter === SAVED && !hasSaved ? "All templates" : filter;
  const categories = [
    "All templates",
    ...(hasSaved ? [SAVED] : []),
    "Hero",
    "Products",
    "Promotions",
    "Galleries",
    "Video",
    "Content",
  ];
  const visible = templates.filter(
    (t) =>
      (active === "All templates" ||
        (active === SAVED ? isSaved(t) : active === t.category)) &&
      t.name.toLowerCase().includes(search.toLowerCase()),
  );
  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    try {
      await action();
      toast.success(done);
      onChanged();
      setRenaming(undefined);
      setDeleting(undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="A head start for every idea"
        description="Professionally designed. Fully customizable. Uniquely yours."
      >
        <Badge variant="secondary">{templates.length} templates</Badge>
      </PageHeading>
      <div className="flex flex-wrap gap-2 items-center mb-6">
        {categories.map((c) => (
          <Button
            key={c}
            variant={active === c ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(c)}
            aria-pressed={active === c}
          >
            {c}
          </Button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
          <Input
            aria-label="Search templates"
            className="pl-9 bg-white"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {visible.map((t) => (
          <TemplateCard
            key={t._id}
            template={t}
            onUse={onUse}
            onPreview={setPreview}
            {...(isSaved(t)
              ? {
                  onRename: (v: SliderTemplate) => {
                    setName(v.name);
                    setRenaming(v);
                  },
                  onDelete: setDeleting,
                }
              : {})}
          />
        ))}
      </div>
      {!visible.length && (
        <div className="surface text-center py-12 px-6">
          <h2 className="text-base font-semibold mb-2">No templates match</h2>
          <p className="muted mb-5">
            Try another name or browse every category.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setFilter("All templates");
            }}
          >
            Show all templates
          </Button>
        </div>
      )}
      <TemplatePreview
        template={preview}
        onClose={() => setPreview(undefined)}
        onUse={onUse}
      />
      <Dialog
        open={!!renaming}
        onOpenChange={(v) => !v && setRenaming(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename template</DialogTitle>
            <DialogDescription>
              Sliders already made from it keep their names.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!renaming || !name.trim()) return;
              void run(
                () =>
                  api(`templates/${renaming._id}`, "PATCH", {
                    name: name.trim(),
                  }),
                "Template renamed",
              );
            }}
          >
            <Input
              aria-label="Template name"
              value={name}
              maxLength={100}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex justify-end">
              <Button disabled={busy || !name.trim()}>
                {busy ? "Saving…" : "Save name"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Sliders already made from this template aren’t affected. This
              can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              className="bg-red-600"
              disabled={busy}
              onClick={() =>
                deleting &&
                void run(
                  () => api(`templates/${deleting._id}`, "DELETE"),
                  "Template deleted",
                )
              }
            >
              {busy ? "Deleting…" : "Delete template"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function TemplatePreview({
  template,
  onClose,
  onUse,
}: {
  template: SliderTemplate | undefined;
  onClose: () => void;
  onUse: (t: SliderTemplate) => void;
}) {
  return (
    <Dialog open={!!template} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{template?.name}</DialogTitle>
          <DialogDescription>
            Customize every detail in the slider editor.
          </DialogDescription>
        </DialogHeader>
        {template && <Slider slider={templateToSlider(template)} preview />}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (template) onUse(template);
              onClose();
            }}
          >
            Use this template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
