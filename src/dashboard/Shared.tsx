import type { ReactNode } from "react";
import { AlertCircle, Plus, Layers, ArrowUpRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import type { Slider } from "../schemas/slider";
export function SliderThumb({
  slider,
  className = "w-14 h-10",
}: {
  slider: Slider;
  className?: string;
}) {
  const media = slider.slides[0]?.media;
  const src = slider.slides[0]?.type === "video" ? media?.poster : media?.url;
  return (
    <div
      className={`${className} rounded-md bg-gray-100 overflow-hidden flex items-center justify-center shrink-0`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <Layers size={18} className="text-gray-400" />
      )}
    </div>
  );
}
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
      <div>
        <h1 className="heading mb-2">{title}</h1>
        <p className="muted mb-0">{description}</p>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-5 flex items-center gap-3"
    >
      <AlertCircle size={18} className="text-amber-700 shrink-0" />
      <div className="flex-1 text-sm text-amber-900">{message}</div>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}
export function LoadingCards() {
  return (
    <div
      className="grid sm:grid-cols-3 gap-5"
      aria-label="Loading content"
      aria-busy="true"
    >
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 bg-gray-200/50 rounded-xl" />
      ))}
    </div>
  );
}
export function Empty({
  title = "Create your first slider",
  description = "Turn your products, images, and stories into something worth exploring.",
  onCreate,
}: {
  title?: string;
  description?: string;
  onCreate?: () => void;
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="bg-blue-50 rounded-2xl w-14 h-14 flex items-center justify-center text-blue-500 mx-auto mb-4">
        <Layers size={26} />
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="muted mb-5 max-w-sm mx-auto">{description}</p>
      {onCreate && (
        <Button onClick={onCreate}>
          <Plus size={16} />
          Create slider
        </Button>
      )}
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize font-medium border-0 ${value === "published" ? "bg-emerald-50 text-emerald-700" : value === "disabled" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${value === "published" ? "bg-emerald-500" : value === "disabled" ? "bg-gray-400" : "bg-amber-400"}`}
      />
      {value}
    </Badge>
  );
}
export function SectionTitle({
  title,
  action,
  onClick,
}: {
  title: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold m-0">{title}</h2>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500"
          onClick={onClick}
        >
          {action}
          <ArrowUpRight size={14} />
        </Button>
      )}
    </div>
  );
}
