import { useState } from "react";
import {
  Plus,
  Layers,
  Radio,
  Eye,
  MousePointer2,
  Play,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { Slider, SliderTemplate } from "../schemas/slider";
import type { AnalyticsSummary } from "../lib/analytics/aggregate";
import { Button } from "../components/ui/button";
import {
  PageHeading,
  SectionTitle,
  Empty,
  Status,
  SliderThumb,
} from "./Shared";
import { TemplateCard, TemplatePreview } from "./Templates";
export function Overview({
  sliders,
  templates,
  analytics,
  onCreate,
  onEdit,
  onTemplates,
  onSliders,
  onAnalytics,
}: {
  sliders: Slider[];
  templates: SliderTemplate[];
  analytics?: AnalyticsSummary;
  onCreate: (t?: SliderTemplate) => void;
  onEdit: (s: Slider) => void;
  onTemplates: () => void;
  onSliders: () => void;
  onAnalytics: (s: Slider) => void;
}) {
  const [preview, setPreview] = useState<SliderTemplate>();
  const stats = [
    {
      name: "Total sliders",
      value: sliders.length,
      icon: Layers,
      color: "text-blue-500 bg-blue-50",
      detail: "Your creative collection",
    },
    {
      name: "Active sliders",
      value: sliders.filter((s) => s.status === "published").length,
      icon: Radio,
      color: "text-emerald-500 bg-emerald-50",
      detail: "Published on your site",
    },
    {
      name: "Impressions",
      value: analytics?.views,
      icon: Eye,
      color: "text-violet-500 bg-violet-50",
      detail: "Last 30 days",
    },
    {
      name: "Total clicks",
      value: analytics?.clicks,
      icon: MousePointer2,
      color: "text-orange-500 bg-orange-50",
      detail: "Last 30 days",
    },
    {
      name: "Video plays",
      value: analytics?.videoPlays,
      icon: Play,
      color: "text-rose-500 bg-rose-50",
      detail: "Last 30 days",
    },
    {
      name: "Click-through rate",
      value: analytics ? `${analytics.ctr.toFixed(1)}%` : undefined,
      icon: TrendingUp,
      color: "text-cyan-600 bg-cyan-50",
      detail: "Clicks / impressions",
    },
  ];
  const topStats = analytics?.sliders.find((a) => a.views > 0);
  const topSlider = sliders.find((s) => s._id === topStats?.name);
  const top =
    topStats && topSlider ? { ...topStats, slider: topSlider } : undefined;
  const recentSliders = [...sliders]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 4);
  return (
    <>
      <PageHeading
        title="Let your content take center stage."
        description="Create, manage, and fine-tune the sliders that bring your site to life."
      >
        <Button onClick={() => onCreate()}>
          <Plus size={17} />
          Create slider
        </Button>
      </PageHeading>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
        {stats.map((s) => (
          <div key={s.name} className="surface p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">{s.name}</span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}
              >
                <s.icon size={16} />
              </div>
            </div>
            <div className="stat-value mb-1">
              {s.value === undefined
                ? "—"
                : typeof s.value === "number"
                  ? s.value.toLocaleString()
                  : s.value}
            </div>
            <span className="text-[11px] text-gray-400">{s.detail}</span>
          </div>
        ))}
      </div>
      <section className="relative rounded-xl overflow-hidden bg-[#e9efe9] mb-8 grid md:grid-cols-[1.1fr_1fr] min-h-60">
        <div className="p-8 lg:p-9 z-10">
          <span className="inline-flex gap-1.5 items-center text-[10px] font-semibold tracking-widest uppercase text-[#567361] mb-4">
            <Sparkles size={13} />
            Less effort. More impact.
          </span>
          <h2 className="text-[28px] leading-tight font-medium tracking-tight text-[#243f33] mb-3 max-w-sm">
            A beautiful slider is
            <br />
            just a few clicks away.
          </h2>
          <p className="text-xs leading-relaxed text-[#678071] max-w-xs mb-5">
            Start with a thoughtfully crafted template and make it yours. No
            code. No limits to your creativity.
          </p>
          <Button
            variant="outline"
            className="bg-white border-white text-[#345340] text-xs"
            onClick={onTemplates}
          >
            Explore templates
            <ArrowRight size={14} />
          </Button>
        </div>
        <div className="relative min-h-48">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85"
            className="absolute inset-0 w-full h-full object-cover"
            alt="A calm living room with natural materials"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#e9efe9] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-12 right-8 rounded-lg bg-white/90 backdrop-blur-sm p-3 flex justify-between text-[10px] text-[#395143]">
            <span>Made for your next big idea.</span>
            <span>01 — 03</span>
          </div>
        </div>
      </section>
      <div className="grid xl:grid-cols-[1.8fr_1fr] gap-6 mb-8">
        <section className="surface p-5">
          <SectionTitle
            title="Recently updated"
            action="View all sliders"
            onClick={onSliders}
          />
          {!sliders.length ? (
            <Empty onCreate={() => onCreate()} />
          ) : (
            <div className="divide-y">
              {recentSliders.map((s) => (
                <button
                  className="w-full py-3 px-2 -mx-2 rounded-lg flex items-center gap-3 text-left hover:bg-gray-50 group"
                  key={s._id}
                  onClick={() => onEdit(s)}
                >
                  <SliderThumb slider={s} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1 truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-400 mb-0 capitalize">
                      {s.slides.length} slides · {s.type}
                    </p>
                  </div>
                  <Status value={s.status} />
                  <ArrowRight
                    size={15}
                    className="text-gray-400 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="surface p-5">
          <SectionTitle title="Performance spotlight" />
          {top ? (
            <div className="bg-[#f6f8fe] rounded-lg p-5">
              <span className="text-xs text-gray-500">
                Top-performing slider · last 30 days
              </span>
              <div className="flex items-center gap-3 mt-3 mb-5">
                <SliderThumb slider={top.slider} />
                <h3 className="text-lg font-semibold m-0 truncate">
                  {top.slider.name}
                </h3>
              </div>
              <dl className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ["Impressions", top.views.toLocaleString()],
                  ["Clicks", top.clicks.toLocaleString()],
                  [
                    "CTR",
                    `${((top.clicks / Math.max(1, top.views)) * 100).toFixed(1)}%`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white rounded-md p-3">
                    <dt className="text-[11px] text-gray-500 mb-1">{label}</dt>
                    <dd className="text-base font-semibold m-0 tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => onAnalytics(top.slider)}
              >
                View analytics
                <ArrowRight size={14} />
              </Button>
            </div>
          ) : (
            <div className="bg-[#f6f8fe] rounded-lg p-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-white text-blue-500 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-base font-semibold mb-2">
                Your next success story
              </h3>
              <p className="muted leading-relaxed mb-0">
                Once a published slider gets visitors, its impressions and
                clicks show up here.
              </p>
            </div>
          )}
        </section>
      </div>
      <SectionTitle
        title="Find your starting point"
        action="Browse all templates"
        onClick={onTemplates}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.slice(0, 3).map((t) => (
          <TemplateCard
            template={t}
            key={t._id}
            onUse={onCreate}
            onPreview={setPreview}
          />
        ))}
      </div>
      <TemplatePreview
        template={preview}
        onClose={() => setPreview(undefined)}
        onUse={onCreate}
      />
    </>
  );
}
