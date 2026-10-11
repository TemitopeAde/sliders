import { useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { ImagePlus, Copy, ExternalLink, Layers, X } from "lucide-react";
import { toast } from "sonner";
import { createSlide, type Slider } from "../schemas/slider";
import { api } from "../lib/api/client";
import { Button } from "../components/ui/button";
import { PageHeading, Empty } from "./Shared";
type Pick = { url: string; name: string; type: string };
const STORE = "sliders-media-picks";
// Picks are a per-tab convenience; the files themselves live in Wix Media.
function loadPicks(): Pick[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORE) ?? "[]");
    return Array.isArray(value) ? (value as Pick[]) : [];
  } catch {
    return [];
  }
}
export function Media({
  sliders,
  onCreated,
}: {
  sliders: Slider[];
  onCreated: (slider: Slider) => void;
}) {
  const [selected, setSelected] = useState<Pick[]>(loadPicks);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(selected));
    } catch {
      /* Storage can be unavailable; picks then last until reload. */
    }
  }, [selected]);
  const createFromPicks = async () => {
    setCreating(true);
    try {
      const picks = selected.slice(0, 200);
      const types = new Set(picks.map((p) => p.type));
      const slider = await api<Slider>("sliders", "POST", {
        name: `Media slider ${new Date().toLocaleDateString()}`,
        type:
          types.size > 1
            ? "mixed"
            : picks[0]?.type === "video"
              ? "video"
              : "image",
      });
      const { _id, createdAt, updatedAt, ...rest } = slider;
      const saved = await api<Slider>(`sliders/${_id}`, "PATCH", {
        ...rest,
        slides: picks.map((p) =>
          createSlide(p.type === "video" ? "video" : "image", {
            title: p.name.slice(0, 160) || "Untitled",
            media: { url: p.url, alt: p.name.slice(0, 300) },
          }),
        ),
      });
      setSelected([]);
      toast.success("Slider created from your media");
      onCreated(saved);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create slider");
    } finally {
      setCreating(false);
    }
  };
  const used = sliders.flatMap((s) =>
    s.slides
      .filter((v) => v.media.url)
      .map((v) => ({
        url: v.media.url,
        name: v.media.alt || v.title,
        type: v.type,
      })),
  );
  const media = [
    ...new Map([...selected, ...used].map((m) => [m.url, m])).values(),
  ];
  const open = async () => {
    setBusy(true);
    try {
      const result = await dashboard.openMediaManager({ multiSelect: true });
      setSelected((v) => [
        ...(result?.items ?? [])
          .filter((i) => i.url)
          .map((i) => ({
            url: i.url ?? "",
            name: i.displayName ?? "Media",
            type: i.mediaType === "VIDEO" ? "video" : "image",
          })),
        ...v,
      ]);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Open this page in your Wix dashboard to access Media Manager.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeading
        title="Your media, ready to shine"
        description="Images and videos used in your sliders. Choose files in Wix Media Manager to start a new slider from them."
      >
        <Button disabled={busy} onClick={() => void open()}>
          <ImagePlus size={16} />
          {busy ? "Opening…" : "Open Media Manager"}
        </Button>
      </PageHeading>
      {!!selected.length && (
        <div className="surface p-4 mb-5 flex flex-wrap items-center gap-3">
          <span className="text-sm flex-1">
            {selected.length} {selected.length === 1 ? "file" : "files"} chosen
            from Media Manager
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={creating}
            onClick={() => setSelected([])}
          >
            <X size={14} />
            Clear
          </Button>
          <Button
            size="sm"
            disabled={creating}
            onClick={() => void createFromPicks()}
          >
            <Layers size={14} />
            {creating ? "Creating…" : "Create slider from these"}
          </Button>
        </div>
      )}
      {!media.length ? (
        <div className="surface">
          <Empty
            title="Bring your vision to life"
            description="Open Media Manager to upload or choose images and videos. Files stay in your Wix media library."
          />
          <div className="text-center pb-8">
            <Button variant="outline" onClick={() => void open()}>
              Browse Wix media
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {media.map((m) => (
            <article key={m.url} className="surface overflow-hidden">
              {m.type === "video" ? (
                <video
                  src={m.url}
                  preload="none"
                  controls
                  className="h-44 w-full object-cover bg-gray-900"
                />
              ) : (
                <img
                  src={m.url}
                  alt={m.name}
                  loading="lazy"
                  className="h-44 w-full object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="truncate text-sm font-medium mb-2">{m.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="muted capitalize">{m.type}</span>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Copy URL for ${m.name}`}
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(m.url)
                          .then(() => toast.success("Media URL copied"))
                          .catch(() => toast.error("Could not copy URL"))
                      }
                    >
                      <Copy size={14} />
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${m.name}`}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
