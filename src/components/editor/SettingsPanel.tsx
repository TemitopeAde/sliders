import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  settingsSchema,
  responsiveSchema,
  type Slider,
  type Device,
} from "../../schemas/slider";
import { SchemaFields } from "./SchemaFields";
import { Choice, InfoTip } from "../forms/Fields";
import { settingsHelp, responsiveHelp } from "../../lib/slider/settings-help";
import { api } from "../../lib/api/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
const groups = {
  Behavior: [
    "effect",
    "autoplay",
    "delay",
    "speed",
    "pauseOnHover",
    "pauseOnInteraction",
    "loop",
    "swipe",
    "mouseDrag",
    "keyboard",
    "centered",
    "autoHeight",
    "direction",
    "initialSlide",
    "loopAdditionalSlides",
  ],
  Container: [
    "width",
    "maxWidth",
    "minHeight",
    "background",
    "borderWidth",
    "borderColor",
    "borderStyle",
    "radius",
    "padding",
    "margin",
    "shadow",
  ],
  Arrows: [
    "showArrows",
    "arrowColor",
    "arrowBackground",
    "arrowBorder",
    "arrowSize",
    "arrowIcon",
    "arrowRadius",
    "arrowOpacity",
    "arrowPosition",
  ],
  Dots: [
    "showPagination",
    "paginationColor",
    "paginationActiveColor",
    "pagination",
    "paginationSize",
    "paginationSpacing",
    "paginationPosition",
  ],
  Typography: ["typography"],
  Products: ["collectionId", "productSort", "syncProducts"],
  Analytics: ["analytics"],
} as const;
const labels = {
  showArrows: "Show arrows",
  arrowColor: "Arrow icon color",
  arrowBackground: "Arrow background color",
  arrowBorder: "Arrow border color",
  arrowSize: "Arrow size",
  arrowIcon: "Arrow icon",
  arrowRadius: "Arrow roundness",
  arrowOpacity: "Arrow opacity",
  arrowPosition: "Arrow position",
  showPagination: "Show dots",
  paginationColor: "Dot color",
  paginationActiveColor: "Active dot color",
  pagination: "Indicator style",
  paginationSize: "Dot size",
  paginationSpacing: "Dot spacing",
  paginationPosition: "Dots position",
};
/** When arrows or dots are switched off, only their on/off switch is shown. */
function visibleFields(
  group: keyof typeof groups,
  s: Slider["settings"],
): string[] {
  if (group === "Arrows" && !s.showArrows) return ["showArrows"];
  if (group === "Dots" && !s.showPagination) return ["showPagination"];
  return [...groups[group]];
}
type Responsive = Slider["responsiveSettings"];
/** Keeps "slides per view" in step with the chosen effect, so picking Slide
 * after Multi-item shows one slide instead of silently keeping three. */
function perViewFor(
  effect: Slider["settings"]["effect"],
  r: Responsive,
): Responsive {
  const set = (desktop: number, tablet: number, mobile: number) => ({
    desktop: { ...r.desktop, slidesPerView: desktop, slidesPerGroup: 1 },
    tablet: { ...r.tablet, slidesPerView: tablet, slidesPerGroup: 1 },
    mobile: { ...r.mobile, slidesPerView: mobile, slidesPerGroup: 1 },
  });
  if (effect === "slide") return set(1, 1, 1);
  if (effect === "multi-item" && r.desktop.slidesPerView === 1)
    return set(3, 2, 1);
  return r;
}
export function SettingsPanel({
  slider,
  onChange,
  device,
}: {
  slider: Slider;
  onChange: (s: Slider) => void;
  device: Device;
}) {
  const [group, setGroup] = useState<keyof typeof groups>("Behavior");
  const collections = useQuery({
    queryKey: ["collections"],
    queryFn: () => api<{ id: string; name: string }[]>("collections"),
    enabled: group === "Products",
  });
  return (
    <div className="space-y-5">
      <Tabs defaultValue="slider">
        <TabsList className="w-full">
          <TabsTrigger value="slider" className="flex-1">
            Slider
          </TabsTrigger>
          <TabsTrigger value="responsive" className="flex-1">
            Responsive
          </TabsTrigger>
        </TabsList>
        <TabsContent value="slider" className="pt-4">
          <Choice
            label="Settings section"
            tip="Choose a group of settings that applies to the whole slider. Responsive settings can be customized for each device."
            value={group}
            options={Object.keys(groups)}
            onChange={(v) => setGroup(v as keyof typeof groups)}
          />
          <div className="mt-5">
            {group === "Products" && (
              <div className="mb-5">
                <div className="flex items-center gap-1 mb-[7px]">
                  <label
                    htmlFor="collection-select"
                    className="field-label mb-0!"
                  >
                    Populate from collection
                  </label>
                  <InfoTip
                    label="Populate from collection"
                    text={settingsHelp.collectionId ?? ""}
                  />
                </div>
                <select
                  id="collection-select"
                  className="w-full border rounded p-2 text-xs"
                  value={slider.settings.collectionId}
                  onChange={(e) =>
                    onChange({
                      ...slider,
                      settings: {
                        ...slider.settings,
                        collectionId: e.target.value,
                      },
                    })
                  }
                >
                  <option value="">Use individual slides</option>
                  {collections.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {collections.isError && (
                  <p className="text-red-600 text-xs">
                    {collections.error.message}
                  </p>
                )}
                <p className="muted mt-2">
                  Collection products load from Wix Stores on the live site.
                  Manual ordering follows the saved slide order.
                </p>
              </div>
            )}
            <SchemaFields
              schema={settingsSchema}
              value={slider.settings}
              only={visibleFields(group, slider.settings)}
              exclude={["collectionId"]}
              labels={labels}
              hints={settingsHelp}
              onChange={(value) => {
                const result = settingsSchema.safeParse(value);
                if (!result.success) return;
                const effect = result.data.effect;
                onChange({
                  ...slider,
                  settings: result.data,
                  responsiveSettings:
                    effect === slider.settings.effect
                      ? slider.responsiveSettings
                      : perViewFor(effect, slider.responsiveSettings),
                });
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="responsive" className="pt-4">
          <p className="text-xs font-semibold capitalize">
            {device} configuration
          </p>
          <p className="muted">
            Use the device switcher to edit each breakpoint.
          </p>
          <SchemaFields
            schema={responsiveSchema.shape[device]}
            value={slider.responsiveSettings[device]}
            hints={responsiveHelp}
            onChange={(v) => {
              const result = responsiveSchema.safeParse({
                ...slider.responsiveSettings,
                [device]: v,
              });
              if (result.success)
                onChange({ ...slider, responsiveSettings: result.data });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
