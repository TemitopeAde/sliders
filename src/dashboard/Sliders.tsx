import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  LayoutGrid,
  List,
  Copy,
  Pencil,
  Eye,
  Trash2,
  BarChart3,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import type { Slider as SliderModel } from "../schemas/slider";
import type { AnalyticsSummary } from "../lib/analytics/aggregate";
import { api } from "../lib/api/client";
import { Slider } from "../components/slider/Slider";
import { Button } from "../components/ui/button";
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
import { PageHeading, Empty, Status } from "./Shared";
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
  const [filter, setFilter] = useState("all");
  const [grid, setGrid] = useState(false);
  const [deleting, setDeleting] = useState<SliderModel>();
  const [preview, setPreview] = useState<SliderModel>();
  const [busy, setBusy] = useState(false);
  const filtered = sliders.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || s.status === filter),
  );
  async function action(slider: SliderModel, command: string) {
    try {
      setBusy(true);
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
      setBusy(false);
    }
  }
  const menu = (s: SliderModel) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${s.name}`}
        >
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(s)}>
          <Pencil />
          Edit / rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPreview(s)}>
          <Eye />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy}
          onClick={() => void action(s, "duplicate")}
        >
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAnalytics(s)}>
          <BarChart3 />
          Analytics
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy}
          onClick={() =>
            void action(s, s.status === "published" ? "disable" : "publish")
          }
        >
          <Power />
          {s.status === "published" ? "Disable" : "Publish"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(s)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
              className="pl-9 w-60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {["all", "published", "draft", "disabled"].map((s) => (
              <Button
                variant={filter === s ? "secondary" : "ghost"}
                size="sm"
                key={s}
                className="capitalize"
                onClick={() => setFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex gap-1">
            <Button
              aria-label="Table view"
              variant={grid ? "ghost" : "secondary"}
              size="icon"
              onClick={() => setGrid(false)}
            >
              <List size={17} />
            </Button>
            <Button
              aria-label="Grid view"
              variant={grid ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setGrid(true)}
            >
              <LayoutGrid size={17} />
            </Button>
          </div>
        </div>
        {!filtered.length ? (
          <Empty
            title={
              sliders.length
                ? "No matching sliders"
                : "Create your first slider"
            }
            description={
              sliders.length
                ? "Try a different name or status filter."
                : undefined
            }
            onCreate={onCreate}
          />
        ) : grid ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {filtered.map((s) => (
              <div className="border rounded-lg p-4" key={s._id}>
                <button className="w-full text-left" onClick={() => onEdit(s)}>
                  <div className="bg-gray-100 h-32 rounded-md mb-3 overflow-hidden">
                    {s.slides[0]?.media.url &&
                      s.slides[0]?.type !== "video" && (
                        <img
                          src={s.slides[0].media.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                  </div>
                  <h3 className="text-sm font-semibold">{s.name}</h3>
                </button>
                <div className="flex justify-between items-center">
                  <Status value={s.status} />
                  {menu(s)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Slider name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Slides</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const stats = analytics?.sliders.find((a) => a.name === s._id);
                return (
                  <TableRow key={s._id}>
                    <TableCell className="pl-5">
                      <button
                        className="font-medium text-left hover:text-blue-600"
                        onClick={() => onEdit(s)}
                      >
                        {s.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Status value={s.status} />
                    </TableCell>
                    <TableCell className="capitalize text-gray-500">
                      {s.type}
                    </TableCell>
                    <TableCell>{s.slides.length}</TableCell>
                    <TableCell>{stats?.views ?? 0}</TableCell>
                    <TableCell>{stats?.clicks ?? 0}</TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{menu(s)}</TableCell>
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
