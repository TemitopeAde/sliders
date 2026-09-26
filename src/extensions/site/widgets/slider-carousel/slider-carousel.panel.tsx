import { useEffect, useState } from "react";
import { widget } from "@wix/editor";
import { items } from "@wix/data";
import {
  SidePanel,
  WixDesignSystemProvider,
  FormField,
  Dropdown,
  SectionHelper,
  Button,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import {
  settingsSchema,
  responsiveSchema,
  sliderSchema,
  type SliderSettings,
  type ResponsiveSettings,
} from "../../../../schemas/slider";
import { COLLECTIONS } from "../../../../lib/wix/collections";
import { WixSettingsFields } from "../../../../components/editor/WixSettingsFields";
export default function Panel() {
  const [sliderId, setSliderId] = useState("");
  const [sliders, setSliders] = useState<{ id: string; value: string }[]>([]);
  const [settings, setSettings] = useState<SliderSettings>();
  const [responsive, setResponsive] = useState<ResponsiveSettings>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([
      widget.getProp("slider-id"),
      widget.getProp("settings"),
      widget.getProp("responsive"),
      items.query(COLLECTIONS.published).limit(100).find(),
    ])
      .then(([id, s, r, list]) => {
        if (!alive) return;
        setSliderId(id ?? "");
        if (s) setSettings(settingsSchema.parse(JSON.parse(s)));
        if (r) setResponsive(responsiveSchema.parse(JSON.parse(r)));
        setSliders(
          list.items.map((v) => ({ id: v._id, value: String(v.name) })),
        );
      })
      .catch(() =>
        setError(
          "Publish a slider in the dashboard first, then reopen these settings.",
        ),
      );
    return () => {
      alive = false;
    };
  }, []);
  async function select(id: string) {
    setBusy(true);
    setError("");
    try {
      const row = await items.get(COLLECTIONS.published, id);
      const slider = sliderSchema.parse(row);
      await widget.setProp("slider-id", id);
      await widget.setProp("preview-snapshot", JSON.stringify(slider));
      await widget.setProp("settings", "");
      await widget.setProp("responsive", "");
      setSliderId(id);
      setSettings(slider.settings);
      setResponsive(slider.responsiveSettings);
    } catch {
      setError("Could not select this slider. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if (!settings || !responsive) return;
    setBusy(true);
    try {
      await widget.setProp(
        "settings",
        JSON.stringify(settingsSchema.parse(settings)),
      );
      await widget.setProp(
        "responsive",
        JSON.stringify(responsiveSchema.parse(responsive)),
      );
      setError("");
    } catch {
      setError(
        "Could not apply settings. Please check your values and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content noPadding>
          <SidePanel.Field>
            <FormField label="Published slider" id="published-slider">
              <Dropdown
                id="published-slider"
                placeholder="Select a slider"
                options={sliders}
                selectedId={sliderId}
                disabled={busy}
                onSelect={(v) => void select(String(v.id))}
              />
            </FormField>
          </SidePanel.Field>
          {error && <SectionHelper skin="warning">{error}</SectionHelper>}
          <SectionHelper>
            Manage slides and publish changes in the Sliders dashboard. These
            settings customize only this widget.
          </SectionHelper>
          {settings && (
            <details open>
              <summary style={{ padding: 16, cursor: "pointer" }}>
                Appearance & behavior
              </summary>
              <WixSettingsFields
                schema={settingsSchema}
                value={settings}
                onChange={(v) => {
                  const parsed = settingsSchema.safeParse(v);
                  if (parsed.success) setSettings(parsed.data);
                }}
              />
            </details>
          )}
          {responsive && (
            <details>
              <summary style={{ padding: 16, cursor: "pointer" }}>
                Responsive configuration
              </summary>
              <WixSettingsFields
                schema={responsiveSchema}
                value={responsive}
                onChange={(v) => {
                  const parsed = responsiveSchema.safeParse(v);
                  if (parsed.success) setResponsive(parsed.data);
                }}
              />
            </details>
          )}
        </SidePanel.Content>
        <SidePanel.Footer>
          <Button
            fullWidth
            disabled={busy || !settings}
            onClick={() => void apply()}
          >
            {busy ? "Applying…" : "Apply widget settings"}
          </Button>
        </SidePanel.Footer>
      </SidePanel>
      <style>
        {
          "input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}"
        }
      </style>
    </WixDesignSystemProvider>
  );
}
