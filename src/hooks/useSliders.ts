import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/api/client";
import type { Slider, SliderTemplate } from "../schemas/slider";
import type { AnalyticsSummary } from "../lib/analytics/aggregate";
export const useSliders = () =>
  useQuery({ queryKey: ["sliders"], queryFn: () => api<Slider[]>("sliders") });
export const useSliderSearch = (search: string, status?: string) =>
  useQuery({
    queryKey: ["sliders", "search", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const qs = params.toString();
      return api<Slider[]>(qs ? `sliders?${qs}` : "sliders");
    },
    placeholderData: keepPreviousData,
  });
export const useTemplates = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: () => api<SliderTemplate[]>("templates"),
  });
export const useAnalytics = (
  days = 30,
  from?: string,
  to?: string,
  sliderId?: string,
) =>
  useQuery({
    queryKey: ["analytics", days, from, to, sliderId],
    queryFn: () =>
      api<AnalyticsSummary>(
        `analytics?from=${encodeURIComponent(from ?? new Date(Date.now() - days * 86400000).toISOString())}&to=${encodeURIComponent(to ?? new Date().toISOString())}${sliderId ? `&sliderId=${encodeURIComponent(sliderId)}` : ""}`,
      ),
  });
export function useRefresh() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ["sliders"] });
    void client.invalidateQueries({ queryKey: ["templates"] });
    void client.invalidateQueries({ queryKey: ["analytics"] });
  };
}
