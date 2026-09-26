import { useState } from "react";
import { dashboard } from "@wix/dashboard";
import { ImagePlus, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Slider } from "../schemas/slider";
import { Button } from "../components/ui/button";
import { PageHeading, Empty } from "./Shared";
export function Media({ sliders }: { sliders: Slider[] }) {
  const [selected, setSelected] = useState<
    { url: string; name: string; type: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
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
        description="Images and videos used in your sliders. Upload and manage files with Wix Media Manager."
      >
        <Button disabled={busy} onClick={() => void open()}>
          <ImagePlus size={16} />
          {busy ? "Opening…" : "Open Media Manager"}
        </Button>
      </PageHeading>
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
