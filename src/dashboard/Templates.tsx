import { useState } from "react";
import { ArrowUpRight, Search, Eye } from "lucide-react";
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
import { templateToSlider } from "../lib/slider/templates";
import type { SliderTemplate } from "../schemas/slider";
import { PageHeading } from "./Shared";
export function TemplateCard({
  template,
  onUse,
  onPreview,
}: {
  template: SliderTemplate;
  onUse: (t: SliderTemplate) => void;
  onPreview?: (t: SliderTemplate) => void;
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
            {template.slides[0]?.badge || "MAKE IT YOUR OWN"}
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
        <Button
          aria-label={`Use ${template.name}`}
          size="icon"
          variant="ghost"
          onClick={() => onUse(template)}
        >
          <ArrowUpRight size={17} />
        </Button>
      </div>
    </article>
  );
}
export function Templates({
  templates,
  onUse,
}: {
  templates: SliderTemplate[];
  onUse: (t: SliderTemplate) => void;
}) {
  const [filter, setFilter] = useState("All templates");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<SliderTemplate>();
  const categories = [
    "All templates",
    "Hero",
    "Products",
    "Promotions",
    "Galleries",
    "Video",
    "Content",
  ];
  const visible = templates.filter(
    (t) =>
      (filter === "All templates" || filter === t.category) &&
      t.name.toLowerCase().includes(search.toLowerCase()),
  );
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
            variant={filter === c ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(c)}
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
          />
        ))}
      </div>
      {!visible.length && (
        <p className="muted text-center py-10">
          No templates match your search.
        </p>
      )}
      <TemplatePreview
        template={preview}
        onClose={() => setPreview(undefined)}
        onUse={onUse}
      />
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
