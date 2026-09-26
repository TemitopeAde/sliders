import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  settingsSchema,
  responsiveSchema,
  type Slider,
  type Device,
} from "../../schemas/slider";
import { SchemaFields } from "./SchemaFields";
import { Choice } from "../forms/Fields";
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
  Navigation: [
    "arrowSize",
    "arrowIcon",
    "arrowColor",
    "arrowBackground",
    "arrowBorder",
    "arrowRadius",
    "arrowOpacity",
    "arrowPosition",
  ],
  Pagination: [
    "pagination",
    "paginationColor",
    "paginationActiveColor",
    "paginationSize",
    "paginationSpacing",
    "paginationPosition",
  ],
  Typography: ["typography"],
  Products: ["collectionId", "productSort", "syncProducts"],
  Analytics: ["analytics"],
} as const;
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
            value={group}
            options={Object.keys(groups)}
            onChange={(v) => setGroup(v as keyof typeof groups)}
          />
          <div className="mt-5">
            {group === "Products" && (
              <div className="mb-5">
                <label htmlFor="collection-select" className="field-label">
                  Populate from collection
                </label>
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
              only={[...groups[group]]}
              exclude={["collectionId"]}
              onChange={(value) => {
                const result = settingsSchema.safeParse(value);
                if (result.success)
                  onChange({ ...slider, settings: result.data });
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
