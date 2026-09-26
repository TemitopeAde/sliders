import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Copy,
  Pencil,
  Eye,
  Trash2,
  BarChart3,
  Rocket,
  PowerOff,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Slider as SliderModel } from "../schemas/slider";
import type { AnalyticsSummary } from "../lib/analytics/aggregate";
import { api } from "../lib/api/client";
import { useSliderSearch } from "../hooks/useSliders";
import { Slider } from "../components/slider/Slider";
import { Button, buttonVariants } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { PageHeading, Empty, Status, SliderThumb, formatDate } from "./Shared";
export function Sliders({
  sliders,
  analytics,
  onCreate,
  onEdit,
  onRefresh,
  onAnalytics,
}: {
  sliders: SliderModel[];
  analytics?: AnalyticsSummary;
  onCreate: () => void;
  onEdit: (s: SliderModel) => void;
  onRefresh: () => void;
  onAnalytics: (s: SliderModel) => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [grid, setGrid] = useState(false);
  const [deleting, setDeleting] = useState<SliderModel>();
  const [preview, setPreview] = useState<SliderModel>();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string>();
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const results = useSliderSearch(query, filter === "all" ? undefined : filter);
  const filtered = results.data ?? [];
  const searching = results.isFetching && (!!query || filter !== "all");
  async function action(slider: SliderModel, command: string) {
    try {
      setPending(slider._id);
      const result = await api<SliderModel>(
        `sliders/${slider._id}/${command}`,
        "POST",
      );
      toast.success(
        command === "duplicate"
          ? "Slider duplicated"
          : command === "disable"
            ? "Slider disabled"
            : "Slider published",
      );
      onRefresh();
      if (command === "duplicate") onEdit(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setPending(undefined);
    }
  }
  const actions = (s: SliderModel) => {
    const working = pending === s._id;
    const published = s.status === "published";
    return (
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label={`Actions for ${s.name}`}
            disabled={working}
          >
            {working ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MoreVertical size={16} />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(s)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPreview(s)}>
              <Eye />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void action(s, published ? "disable" : "publish")}
            >
              {published ? <PowerOff /> : <Rocket />}
              {published ? "Disable" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAnalytics(s)}>
              <BarChart3 />
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void action(s, "duplicate")}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleting(s)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };
  return (
    <>
      <PageHeading
        title="Your sliders"
        description="Every story, promotion, and collection. All in one place."
      >
        <Button onClick={onCreate}>
          <Plus />
          Create slider
        </Button>
      </PageHeading>
      <div className="surface">
        <div className="p-4 flex flex-wrap gap-3 items-center border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={15} />
            <Input
              aria-label="Search sliders"
              placeholder="Search sliders…"
              className="pl-9 pr-9 w-60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {searching ? (
              <Loader2
                className="absolute right-3 top-3 text-gray-400 animate-spin"
                size={15}
                aria-label="Searching"
              />
            ) : (
              search && (
                <button
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )
            )}
          </div>
          <div className="flex gap-1">
            {["all", "published", "draft", "disabled"].map((s) => (
              <Button
                variant={filter === s ? "secondary" : "ghost"}
                size="sm"
                key={s}
                className="capitalize"
                onClick={() => setFilter(s)}
                aria-pressed={filter === s}
              >
                {s}
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {s === "all"
                    ? sliders.length
                    : sliders.filter((v) => v.status === s).length}
                </span>
              </Button>
            ))}
          </div>
          <div className="ml-auto flex gap-1">
            <Button
              aria-label="Table view"
              variant={grid ? "ghost" : "secondary"}
              size="icon"
              onClick={() => setGrid(false)}
              aria-pressed={!grid}
            >
              <List size={17} />
            </Button>
            <Button
              aria-label="Grid view"
              variant={grid ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setGrid(true)}
              aria-pressed={grid}
            >
              <LayoutGrid size={17} />
            </Button>
          </div>
        </div>
        {results.isError ? (
          <div className="text-center py-12 px-6">
            <p className="muted mb-5">{results.error.message}</p>
            <Button variant="outline" onClick={() => void results.refetch()}>
              Try again
            </Button>
          </div>
        ) : results.isPending ? (
          <div className="py-12 flex justify-center text-gray-400">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : !filtered.length ? (
          sliders.length ? (
            <div className="text-center py-12 px-6">
              <h2 className="text-base font-semibold mb-2">
                No matching sliders
              </h2>
              <p className="muted mb-5">
                Try a different name or status filter.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <Empty onCreate={onCreate} />
          )
        ) : grid ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {filtered.map((s) => (
              <div
                className="border rounded-lg p-3 transition-shadow hover:shadow-md"
                key={s._id}
              >
                <button className="w-full text-left" onClick={() => onEdit(s)}>
                  <SliderThumb slider={s} className="w-full h-36 mb-3" />
                  <h3 className="text-sm font-semibold truncate mb-0.5">
                    {s.name}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize mb-0">
                    {s.slides.length}{" "}
                    {s.slides.length === 1 ? "slide" : "slides"} · {s.type} ·{" "}
                    {formatDate(s.updatedAt)}
                  </p>
                </button>
                <div className="flex justify-between items-center mt-2">
                  <Status value={s.status} />
                  {actions(s)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table className={results.isFetching ? "opacity-60" : undefined}>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Slider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Views (30d)</TableHead>
                <TableHead className="text-right">Clicks (30d)</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="sticky right-0 z-10 bg-white w-14">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const stats = analytics?.sliders.find((a) => a.name === s._id);
                return (
                  <TableRow
                    key={s._id}
                    className="group cursor-pointer"
                    onClick={() => onEdit(s)}
                  >
                    <TableCell className="pl-5 py-3">
                      <button
                        className="flex items-center gap-3 text-left group/name"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(s);
                        }}
                      >
                        <SliderThumb slider={s} />
                        <span>
                          <span className="block font-medium group-hover/name:text-blue-600">
                            {s.name}
                          </span>
                          <span className="block text-xs text-gray-500 capitalize">
                            {s.slides.length}{" "}
                            {s.slides.length === 1 ? "slide" : "slides"} ·{" "}
                            {s.type}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Status value={s.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(stats?.views ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(stats?.clicks ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatDate(s.updatedAt)}
                    </TableCell>
                    <TableCell
                      className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 pr-3 cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(s)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !busy && !v && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the slider and its published version. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-red-600"
              onClick={async (e) => {
                e.preventDefault();
                if (!deleting) return;
                setBusy(true);
                try {
                  await api(`sliders/${deleting._id}`, "DELETE");
                  toast.success("Slider deleted");
                  setDeleting(undefined);
                  onRefresh();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Delete failed",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete slider"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!preview}
        onOpenChange={(v) => !v && setPreview(undefined)}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>Preview of your saved slider.</DialogDescription>
          </DialogHeader>
          {preview && <Slider slider={preview} preview />}
        </DialogContent>
      </Dialog>
    </>
  );
}
