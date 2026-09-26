import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  PanelsTopLeft,
  LayoutTemplate,
  Image,
  BarChart3,
  Settings as SettingsIcon,
  ChevronRight,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { TooltipProvider } from "../components/ui/tooltip";
import { Button } from "../components/ui/button";
import { CreateSliderDialog } from "../components/forms/CreateSliderDialog";
import { SliderEditor } from "../components/editor/SliderEditor";
import {
  useSliders,
  useTemplates,
  useAnalytics,
  useRefresh,
} from "../hooks/useSliders";
import { starterTemplates } from "../lib/slider/templates";
import type { Slider, SliderTemplate } from "../schemas/slider";
import { Overview } from "./Overview";
import { Sliders } from "./Sliders";
import { Templates } from "./Templates";
import { Analytics } from "./Analytics";
import { Media } from "./Media";
import { Settings } from "./Settings";
import { ErrorNotice, LoadingCards } from "./Shared";
import "../styles/global.css";
const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Sliders", icon: PanelsTopLeft },
  { name: "Templates", icon: LayoutTemplate },
  { name: "Media", icon: Image },
  { name: "Analytics", icon: BarChart3 },
  { name: "Settings", icon: SettingsIcon },
] as const;
type Page = (typeof nav)[number]["name"];
function Dashboard() {
  const [page, setPage] = useState<Page>("Overview");
  const [editing, setEditing] = useState<Slider>();
  const [creating, setCreating] = useState(false);
  const [templateId, setTemplateId] = useState<string>();
  const [analyticsId, setAnalyticsId] = useState<string>();
  const sliders = useSliders();
  const templates = useTemplates();
  const analytics = useAnalytics();
  const refresh = useRefresh();
  const data = sliders.data ?? [];
  const templateData = templates.data ?? starterTemplates;
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (nav.some((n) => n.name.toLowerCase() === hash))
      setPage(
        nav.find((n) => n.name.toLowerCase() === hash)?.name ?? "Overview",
      );
  }, []);
  const navigate = (next: Page) => {
    setPage(next);
    setAnalyticsId(undefined);
    history.replaceState(null, "", `#${next.toLowerCase()}`);
  };
  const create = (template?: SliderTemplate) => {
    setTemplateId(template?._id);
    setCreating(true);
  };
  return (
    <>
      <div className={editing ? "min-h-screen" : "app-shell"}>
        {!editing && (
          <aside className="sidebar">
            <div className="brand flex items-center gap-2.5 mb-10 px-2">
              <div className="w-9 h-9 rounded-xl bg-[#4263eb] text-white flex items-center justify-center shadow-sm">
                <Layers size={22} />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">
                  sliders<span className="text-blue-500">.</span>
                </span>
                <p className="brand-caption text-[9px] text-gray-400 tracking-widest mb-0">
                  MAKE EVERY SLIDE COUNT
                </p>
              </div>
            </div>
            <p className="eyebrow px-3 mb-3">Workspace</p>
            <nav aria-label="Main navigation" className="space-y-1">
              {nav.map((n) => (
                <button
                  key={n.name}
                  className={`nav-item ${page === n.name ? "active" : ""}`}
                  onClick={() => navigate(n.name)}
                  aria-current={page === n.name ? "page" : undefined}
                >
                  <n.icon size={18} />
                  {n.name}
                  {n.name === "Sliders" && data.length > 0 && (
                    <span className="ml-auto text-[10px] rounded bg-gray-100 px-1.5 py-.5">
                      {data.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom mt-auto">
              <div className="bg-[#f7f9fe] border border-[#e8edf9] rounded-xl p-4 mb-5">
                <span className="text-lg">✦</span>
                <p className="font-semibold text-xs mt-3 mb-2">
                  A little inspiration?
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  Find a fresh starting point for your next great slider.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] w-full bg-white"
                  onClick={() => navigate("Templates")}
                >
                  Explore templates
                  <ArrowUpRight size={12} />
                </Button>
              </div>
              <div className="border-t pt-4 px-2 flex gap-2 items-center text-xs text-gray-500">
                <span className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center font-semibold">
                  W
                </span>
                Wix workspace
                <span className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
            </div>
          </aside>
        )}
        <main className="workspace">
          {editing ? (
            <SliderEditor
              key={editing._id}
              initial={editing}
              onBack={() => {
                setEditing(undefined);
                navigate("Sliders");
                refresh();
              }}
              onSaved={() => refresh()}
            />
          ) : (
            <>
              <header className="topbar">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Workspace</span>
                  <ChevronRight size={12} />
                  <span className="text-gray-700">{page}</span>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="hidden sm:inline text-[11px] text-gray-400">
                    Product, Image & Video Slider
                  </span>
                  <div
                    className="w-8 h-8 rounded-full bg-[#e8edf8] text-[#627391] grid place-items-center text-xs font-semibold"
                    aria-label="Wix workspace"
                  >
                    W
                  </div>
                </div>
              </header>
              <div className="page-content">
                {sliders.isError && page !== "Settings" && (
                  <ErrorNotice
                    message={`${sliders.error.message} Your sliders are loaded securely through your Wix dashboard.`}
                    retry={() => void sliders.refetch()}
                  />
                )}
                {sliders.isPending &&
                page !== "Templates" &&
                page !== "Settings" ? (
                  <LoadingCards />
                ) : page === "Overview" ? (
                  <Overview
                    sliders={data}
                    templates={templateData}
                    analytics={analytics.data}
                    onCreate={create}
                    onEdit={setEditing}
                    onTemplates={() => navigate("Templates")}
                    onSliders={() => navigate("Sliders")}
                  />
                ) : page === "Sliders" ? (
                  <Sliders
                    sliders={data}
                    analytics={analytics.data}
                    onCreate={() => create()}
                    onEdit={setEditing}
                    onRefresh={refresh}
                    onAnalytics={(s) => {
                      navigate("Analytics");
                      setAnalyticsId(s._id);
                    }}
                  />
                ) : page === "Templates" ? (
                  <Templates templates={templateData} onUse={create} />
                ) : page === "Media" ? (
                  <Media sliders={data} />
                ) : page === "Analytics" ? (
                  <Analytics sliders={data} sliderId={analyticsId} />
                ) : (
                  <Settings />
                )}
              </div>
            </>
          )}
        </main>
      </div>
      <CreateSliderDialog
        open={creating}
        onOpenChange={setCreating}
        templates={templateData}
        templateId={templateId}
        onCreated={(slider) => {
          refresh();
          setEditing(slider);
        }}
      />
    </>
  );
}
export default function App() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <Dashboard />
        <Toaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
