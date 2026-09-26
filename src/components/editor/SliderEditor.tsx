import { useState } from "react";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Eye,
  Save,
  Upload,
  LayoutPanelLeft,
  SlidersHorizontal,
  BookmarkPlus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Slider as SliderModel,
  Device,
  Slide,
} from "../../schemas/slider";
import { useEditor } from "../../hooks/useEditor";
import { api } from "../../lib/api/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { Slider } from "../slider/Slider";
import { SlidesSidebar } from "./SlidesSidebar";
import { SlideSettings } from "./SlideSettings";
import { SettingsPanel } from "./SettingsPanel";
import { AddSlideDialog } from "../forms/AddSlideDialog";
import { Status } from "../../dashboard/Shared";
export function SliderEditor({
  initial,
  onBack,
  onSaved,
}: {
  initial: SliderModel;
  onBack: () => void;
  onSaved: (s: SliderModel) => void;
}) {
  const editor = useEditor(initial, onSaved);
  const { draft, change } = editor;
  const [device, setDevice] = useState<Device>("desktop");
  const [selected, setSelected] = useState(initial.slides[0]?._id ?? "");
  const [panel, setPanel] = useState<"slide" | "slider">("slide");
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState<Slide>();
  const [templateBusy, setTemplateBusy] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string>();
  const slide = draft.slides.find((s) => s._id === selected);
  const updateSlides = (slides: Slide[]) => change({ ...draft, slides });
  const updateSlide = (next: Slide) =>
    updateSlides(draft.slides.map((s) => (s._id === next._id ? next : s)));
  return (
    <div>
      <div className="bg-white border-b px-5 py-4 flex items-center gap-3 flex-wrap">
        <Button
          aria-label="Back to sliders"
          size="icon"
          variant="ghost"
          onClick={() => (editor.dirty ? setLeaving(true) : onBack())}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="min-w-36 flex-1">
          <Input
            aria-label="Slider name"
            className="border-0 shadow-none px-0 font-semibold text-base max-w-72"
            value={draft.name}
            disabled={editor.busy}
            onChange={(e) => change({ ...draft, name: e.target.value })}
          />
          <span
            className={`text-[10px] ${editor.error ? "text-red-600" : "text-gray-400"}`}
          >
            {editor.busy
              ? "Saving…"
              : editor.error
                ? "Save failed"
                : editor.dirty
                  ? "Unsaved changes"
                  : "All changes saved"}
          </span>
        </div>
        <Status value={draft.status} />
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(
            [
              { value: "desktop", icon: Monitor },
              { value: "tablet", icon: Tablet },
              { value: "mobile", icon: Smartphone },
            ] as const
          ).map((d) => (
            <Button
              size="icon"
              key={d.value}
              variant={device === d.value ? "outline" : "ghost"}
              className="h-8 w-9"
              aria-label={`${d.value} preview`}
              aria-pressed={device === d.value}
              onClick={() => setDevice(d.value)}
            >
              <d.icon size={16} />
            </Button>
          ))}
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Undo"
          disabled={!editor.canUndo || editor.busy}
          onClick={editor.undo}
        >
          <Undo2 size={16} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Redo"
          disabled={!editor.canRedo || editor.busy}
          onClick={editor.redo}
        >
          <Redo2 size={16} />
        </Button>
        <Button variant="outline" onClick={() => setPreview(true)}>
          <Eye size={15} />
          Preview
        </Button>
        <Button
          variant="outline"
          disabled={editor.busy || !editor.dirty}
          onClick={() => void editor.save()}
        >
          <Save size={15} />
          Save
        </Button>
        <Button disabled={editor.busy} onClick={() => void editor.publish()}>
          <Upload size={15} />
          Publish
        </Button>
      </div>
      {editor.error && (
        <div role="alert" className="px-6 py-3 bg-red-50 text-red-700 text-xs">
          {editor.error}
        </div>
      )}
      <fieldset
        disabled={editor.busy}
        className="editor-grid border-0 p-0 m-0 min-w-0"
      >
        <aside className="editor-panel border-r">
          <SlidesSidebar
            slides={draft.slides}
            selected={selected}
            onSelect={(id) => {
              setSelected(id);
              setSelectedLayer(undefined);
              setPanel("slide");
            }}
            onChange={updateSlides}
            onAdd={() => setAdding(true)}
            onDelete={setDeleting}
          />
        </aside>
        <section className="editor-preview">
          <div className="flex items-center justify-between mb-5 text-[11px] text-gray-500">
            <span className="uppercase tracking-widest">Live preview</span>
            <span className="capitalize">
              {device} · {draft.responsiveSettings[device].height}px
            </span>
          </div>
          <div
            className="mx-auto transition-all"
            style={{
              maxWidth:
                device === "mobile" ? 375 : device === "tablet" ? 768 : "100%",
            }}
          >
            <Slider
              slider={draft}
              device={device}
              preview
              selectedSlide={selected}
              layerEditing={
                slide && slide.type !== "product"
                  ? {
                      selected: selectedLayer,
                      onSelect: (id) => {
                        setSelectedLayer(id);
                        setPanel("slide");
                      },
                      onChange: (id, patch) =>
                        updateSlide({
                          ...slide,
                          layers: slide.layers.map((l) =>
                            l._id === id ? { ...l, ...patch } : l,
                          ),
                        }),
                    }
                  : undefined
              }
            />
          </div>
          {!draft.slides.length && (
            <div className="flex justify-center mt-5">
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add your first slide
              </Button>
            </div>
          )}
          <p className="text-center text-[11px] text-gray-400 mt-5">
            Click text or a button to edit it, drag to move it. Changes appear
            instantly — publish when you’re ready.
          </p>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-gray-500"
              disabled={templateBusy || !draft.slides.length}
              onClick={async () => {
                setTemplateBusy(true);
                try {
                  await api("templates", "POST", {
                    name: draft.name,
                    category: "Content",
                    thumbnail:
                      draft.slides[0]?.media.poster ||
                      draft.slides[0]?.media.url ||
                      "",
                    settings: draft.settings,
                    responsiveSettings: draft.responsiveSettings,
                    slides: draft.slides,
                  });
                  toast.success("Design saved as a template");
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Could not save template",
                  );
                } finally {
                  setTemplateBusy(false);
                }
              }}
            >
              <BookmarkPlus size={14} />
              Save as template
            </Button>
          </div>
        </section>
        <aside className="editor-panel border-l">
          <div className="flex border-b mb-5 gap-1 pb-3">
            <Button
              size="sm"
              variant={panel === "slide" ? "secondary" : "ghost"}
              className="text-xs flex-1"
              onClick={() => setPanel("slide")}
            >
              <LayoutPanelLeft size={14} />
              This slide
            </Button>
            <Button
              size="sm"
              variant={panel === "slider" ? "secondary" : "ghost"}
              className="text-xs flex-1"
              onClick={() => setPanel("slider")}
            >
              <SlidersHorizontal size={14} />
              Slider settings
            </Button>
          </div>
          {panel === "slider" ? (
            <SettingsPanel slider={draft} device={device} onChange={change} />
          ) : slide ? (
            <SlideSettings
              key={slide._id}
              slide={slide}
              onChange={updateSlide}
              selectedLayer={selectedLayer}
              onSelectLayer={setSelectedLayer}
            />
          ) : (
            <p className="muted">
              Select a slide to customize its content and style.
            </p>
          )}
        </aside>
      </fieldset>
      <AddSlideDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={(s) => {
          updateSlides([...draft.slides, s]);
          setSelected(s._id);
          setPanel("slide");
          toast.success("Slide added — save to keep your changes");
        }}
      />
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{draft.name}</DialogTitle>
            <DialogDescription>Preview · {device}</DialogDescription>
          </DialogHeader>
          <Slider slider={draft} device={device} preview />
        </DialogContent>
      </Dialog>
      <AlertDialog open={leaving} onOpenChange={setLeaving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits to this slider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={onBack}>
              Discard
            </Button>
            <Button
              disabled={editor.busy}
              onClick={async () => {
                if (await editor.save()) onBack();
              }}
            >
              Save and leave
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this slide?</AlertDialogTitle>
            <AlertDialogDescription>
              You can undo this change until you save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600"
              onClick={() => {
                updateSlides(
                  draft.slides.filter((s) => s._id !== deleting?._id),
                );
                setDeleting(undefined);
                toast.success("Slide deleted");
              }}
            >
              Delete slide
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
