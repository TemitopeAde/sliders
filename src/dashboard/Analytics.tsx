import { useState } from "react";
import { Eye, MousePointer2, TrendingUp, Play, Users } from "lucide-react";
import { useAnalytics } from "../hooks/useSliders";
import type { Slider } from "../schemas/slider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import {
  PageHeading,
  ErrorNotice,
  LoadingCards,
  Empty,
  SectionTitle,
} from "./Shared";
export function Analytics({
  sliders,
  sliderId,
  onSliderChange,
}: {
  sliders: Slider[];
  sliderId?: string;
  onSliderChange: (id?: string) => void;
}) {
  const [days, setDays] = useState(30);
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const valid = !!from && !!to && from <= to;
  const query = useAnalytics(
    days,
    custom && valid ? new Date(from).toISOString() : undefined,
    custom && valid ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined,
    sliderId,
  );
  const data = query.data;
  const top = data?.sliders ?? [];
  const max = Math.max(1, ...(data?.daily.map((d) => d.views) ?? []));
  return (
    <>
      <PageHeading
        title="A closer look at your impact"
        description={
          sliderId
            ? `Analytics for ${sliders.find((s) => s._id === sliderId)?.name ?? "your slider"}`
            : "See what draws attention, sparks a click, and keeps visitors watching."
        }
      >
        <Select
          value={sliderId ?? "all"}
          onValueChange={(v) => onSliderChange(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="bg-white h-10 min-w-48" aria-label="Slider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sliders</SelectItem>
            {sliders.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-white rounded-lg border p-1">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={!custom && days === d ? "secondary" : "ghost"}
              onClick={() => {
                setDays(d);
                setCustom(false);
              }}
            >
              {d} days
            </Button>
          ))}
          <Button
            size="sm"
            variant={custom ? "secondary" : "ghost"}
            onClick={() => setCustom(true)}
          >
            Custom
          </Button>
        </div>
      </PageHeading>
      {custom && (
        <div className="flex gap-3 items-end mb-5">
          <div>
            <label className="field-label" htmlFor="range-from">
              From
            </label>
            <Input
              id="range-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="range-to">
              To
            </label>
            <Input
              id="range-to"
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {!valid && <span className="muted">Choose a valid date range.</span>}
        </div>
      )}
      {query.isError ? (
        <ErrorNotice
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingCards />
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Impressions", value: data.views, icon: Eye },
                {
                  label: "Unique sessions",
                  value: data.uniqueViews,
                  icon: Users,
                },
                { label: "Clicks", value: data.clicks, icon: MousePointer2 },
                {
                  label: "Click-through rate",
                  value: `${data.ctr.toFixed(1)}%`,
                  icon: TrendingUp,
                },
                { label: "Video plays", value: data.videoPlays, icon: Play },
              ].map((s) => (
                <div className="surface p-5" key={s.label}>
                  <div className="flex justify-between items-center text-gray-400 mb-4">
                    <span className="text-xs">{s.label}</span>
                    <s.icon size={17} />
                  </div>
                  <div className="stat-value tabular-nums">
                    {typeof s.value === "number"
                      ? s.value.toLocaleString()
                      : s.value}
                  </div>
                </div>
              ))}
            </div>
            <section className="surface p-6 mb-6">
              <SectionTitle title="Impressions over time" />
              {!data.daily.length ? (
                <Empty
                  title="Your story is just getting started"
                  description="Publish a slider and add it to your Wix site. Visitor activity will appear here."
                />
              ) : (
                <div>
                  <div
                    className="chart-grid flex items-end gap-1 h-52 border-b pt-4"
                    role="img"
                    aria-label={`Daily impressions. ${data.views} total in selected range.`}
                  >
                    {data.daily.map((d) => (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.views} views, ${d.clicks} clicks`}
                        className="flex-1 bg-blue-400 hover:bg-blue-600 rounded-t-sm min-w-1"
                        style={{ height: `${(d.views / max) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-3">
                    <span>{data.daily[0]?.date}</span>
                    <span>{data.daily.at(-1)?.date}</span>
                  </div>
                  <details className="mt-4">
                    <summary className="text-xs cursor-pointer text-gray-500">
                      View chart data
                    </summary>
                    <table className="text-xs w-full mt-3">
                      <thead>
                        <tr>
                          <th className="text-left">Date</th>
                          <th>Views</th>
                          <th>Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.daily.map((d) => (
                          <tr key={d.date}>
                            <td>{d.date}</td>
                            <td className="text-center">{d.views}</td>
                            <td className="text-center">{d.clicks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </div>
              )}
            </section>
            <div className="grid lg:grid-cols-2 gap-6">
              {[
                {
                  title: "Top sliders",
                  rows: top.map((t) => ({
                    ...t,
                    name: sliders.find((s) => s._id === t.name)?.name ?? t.name,
                  })),
                },
                {
                  title: "Device breakdown",
                  rows: data.devices,
                  capitalize: true,
                },
                {
                  title: "Top slides",
                  rows: data.slides.map((t) => ({
                    ...t,
                    name:
                      sliders
                        .flatMap((s) => s.slides)
                        .find((s) => s._id === t.name)?.title ?? t.name,
                  })),
                },
                { title: "Page breakdown", rows: data.pages },
              ].map((section) => (
                <section key={section.title} className="surface p-6">
                  <SectionTitle title={section.title} />
                  {section.rows.length ? (
                    <div>
                      {section.rows.slice(0, 10).map((row, i) => (
                        <div
                          className="py-3 border-b last:border-0 text-sm"
                          key={`${row.name}-${i}`}
                        >
                          <div className="flex justify-between items-center gap-4 mb-2">
                            <span
                              className={`truncate ${"capitalize" in section ? "capitalize" : ""}`}
                              title={row.name}
                            >
                              {row.name}
                            </span>
                            <span className="text-xs text-gray-500 whitespace-nowrap tabular-nums">
                              {row.views.toLocaleString()} views ·{" "}
                              {row.clicks.toLocaleString()} clicks
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-400"
                              style={{
                                width: `${(row.views / Math.max(1, data.views)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted py-8 text-center">
                      No activity in this period.
                    </p>
                  )}
                </section>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-5">
              Unique views count browser sessions, not identified people.
              Visitor privacy preferences can reduce reported totals.
            </p>
          </>
        )
      )}
    </>
  );
}
