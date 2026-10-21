import { useEffect, useRef, useState } from "react";
import { widget } from "@wix/editor";
import { items } from "@wix/data";
import {
  SidePanel,
  WixDesignSystemProvider,
  FormField,
  Dropdown,
  SectionHelper,
  Tabs,
  Box,
  Text,
  TextButton,
  IconButton,
  Tooltip,
  Loader,
  SegmentedToggle,
} from "@wix/design-system";
import {
  Refresh,
  RevertReset,
  Desktop,
  Tablet,
  Mobile,
} from "@wix/wix-ui-icons-common";
import "@wix/design-system/styles.global.css";
import {
  settingsSchema,
  responsiveSchema,
  sliderSchema,
  type Slider as SliderModel,
  type SliderSettings,
  type ResponsiveSettings,
  type Device,
} from "../../../../schemas/slider";
import { COLLECTIONS } from "../../../../lib/wix/collections";
import {
  ToggleField,
  RangeField,
  SelectField,
  ChoiceField,
  ColorField,
  FontField,
  Section,
} from "./panel-controls";
import {
  responsiveHelp,
  settingsHelp,
} from "../../../../lib/slider/settings-help";

type Tab = "behavior" | "design" | "layout" | "text";
type TextStyle = keyof SliderSettings["typography"];
type SaveState = "idle" | "saving" | "saved" | "error";

const TABS: { id: Tab; title: string }[] = [
  { id: "behavior", title: "Behavior" },
  { id: "design", title: "Design" },
  { id: "layout", title: "Layout" },
  { id: "text", title: "Text" },
];
const EFFECTS = [
  { id: "slide", label: "Slide" },
  { id: "fade", label: "Fade" },
  { id: "crossfade", label: "Crossfade" },
  { id: "centered", label: "Centered" },
  { id: "multi-item", label: "Multiple items" },
  { id: "free-scroll", label: "Free scroll" },
] as const;
const PAGINATION = [
  { id: "bullets", label: "Dots" },
  { id: "fraction", label: "Numbers (1 / 5)" },
  { id: "progressbar", label: "Progress bar" },
] as const;
const ALIGNMENTS = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
].map((id) => ({
  id,
  label: id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" "),
})) as { id: ResponsiveSettings["desktop"]["alignment"]; label: string }[];
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => ({
  id: String(w),
  label: `${w}${w === 400 ? " · Regular" : w === 700 ? " · Bold" : ""}`,
}));
const TEXT_STYLES: { id: TextStyle; label: string }[] = [
  { id: "heading", label: "Heading" },
  { id: "description", label: "Description" },
  { id: "badge", label: "Badge" },
  { id: "price", label: "Price" },
];
const DEVICES: { id: Device; label: string; icon: JSX.Element }[] = [
  { id: "desktop", label: "Desktop", icon: <Desktop /> },
  { id: "tablet", label: "Tablet", icon: <Tablet /> },
  { id: "mobile", label: "Mobile", icon: <Mobile /> },
];

const parseJson = (v: string | undefined) => (v ? JSON.parse(v) : undefined);
async function publishedSliders() {
  let result = await items
    .query(COLLECTIONS.published)
    .ascending("name")
    .limit(100)
    .find();
  const all = [...result.items];
  while (result.hasNext()) {
    result = await result.next();
    all.push(...result.items);
  }
  return all.map((v) => ({ id: String(v._id), value: String(v.name) }));
}

export default function Panel() {
  const [loading, setLoading] = useState(true);
  const [sliderId, setSliderId] = useState("");
  const [sliders, setSliders] = useState<{ id: string; value: string }[]>([]);
  const [snapshot, setSnapshot] = useState<SliderModel>();
  const [settings, setSettings] = useState<SliderSettings>();
  const [responsive, setResponsive] = useState<ResponsiveSettings>();
  const [tab, setTab] = useState<Tab>("behavior");
  const [device, setDevice] = useState<Device>("desktop");
  const [textStyle, setTextStyle] = useState<TextStyle>("heading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [edits, setEdits] = useState(0);
  const queue = useRef(Promise.resolve());
  const pending = useRef<ReturnType<typeof setTimeout>>();
  /** Runs widget prop writes one at a time, in the order they were made. */
  const enqueue = (write: () => Promise<void>) => {
    const next = queue.current.then(write);
    queue.current = next.catch(() => undefined);
    return next;
  };

  useEffect(() => {
    let alive = true;
    Promise.all([
      widget.getProp("slider-id"),
      widget.getProp("settings"),
      widget.getProp("responsive"),
      widget.getProp("preview-snapshot"),
      publishedSliders(),
    ])
      .then(([id, s, r, snap, list]) => {
        if (!alive) return;
        const base = snap ? sliderSchema.parse(JSON.parse(snap)) : undefined;
        setSliderId(id ?? "");
        setSnapshot(base);
        setSettings(s ? settingsSchema.parse(parseJson(s)) : base?.settings);
        setResponsive(
          r ? responsiveSchema.parse(parseJson(r)) : base?.responsiveSettings,
        );
        setSliders(list);
      })
      .catch(() =>
        setError("We couldn't load your sliders. Reopen settings to retry."),
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Apply edits to the widget automatically, debounced so dragging a slider
  // doesn't flood the editor with prop updates.
  useEffect(() => {
    if (!edits || !settings || !responsive) return;
    setSaveState("saving");
    pending.current = setTimeout(() => {
      pending.current = undefined;
      const s = JSON.stringify(settingsSchema.parse(settings));
      const r = JSON.stringify(responsiveSchema.parse(responsive));
      enqueue(async () => {
        await widget.setProp("settings", s);
        await widget.setProp("responsive", r);
        setSaveState("saved");
      }).catch(() => setSaveState("error"));
    }, 300);
    return () => clearTimeout(pending.current);
  }, [edits]);

  const set = <K extends keyof SliderSettings>(
    key: K,
    value: SliderSettings[K],
  ) => {
    setSettings((s) => s && { ...s, [key]: value });
    setEdits((n) => n + 1);
  };
  const setBreakpoint = <K extends keyof ResponsiveSettings[Device]>(
    key: K,
    value: ResponsiveSettings[Device][K],
  ) => {
    setResponsive(
      (r) => r && { ...r, [device]: { ...r[device], [key]: value } },
    );
    setEdits((n) => n + 1);
  };
  const setType = <K extends keyof SliderSettings["typography"]["heading"]>(
    key: K,
    value: SliderSettings["typography"]["heading"][K],
  ) => {
    setSettings(
      (s) =>
        s && {
          ...s,
          typography: {
            ...s.typography,
            [textStyle]: { ...s.typography[textStyle], [key]: value },
          },
        },
    );
    setEdits((n) => n + 1);
  };

  async function loadPublished(id: string) {
    const slider = sliderSchema.parse(
      await items.get(COLLECTIONS.published, id),
    );
    await widget.setProp("preview-snapshot", JSON.stringify(slider));
    setSnapshot(slider);
    return slider;
  }
  async function run(action: () => Promise<void>, failure: string) {
    // Drop an unsent edit so it can't overwrite the slider chosen here.
    clearTimeout(pending.current);
    pending.current = undefined;
    setBusy(true);
    setError("");
    try {
      await enqueue(action);
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  const select = (id: string) =>
    run(async () => {
      const slider = await loadPublished(id);
      await widget.setProp("slider-id", id);
      await widget.setProp("settings", "");
      await widget.setProp("responsive", "");
      setSliderId(id);
      setSettings(slider.settings);
      setResponsive(slider.responsiveSettings);
      setSaveState("idle");
    }, "Could not select this slider. Please try again.");
  const sync = () =>
    run(async () => {
      await loadPublished(sliderId);
    }, "Could not load the latest version. Please try again.");
  const reset = () =>
    run(async () => {
      const slider = snapshot ?? (await loadPublished(sliderId));
      await widget.setProp("settings", "");
      await widget.setProp("responsive", "");
      setSettings(slider.settings);
      setResponsive(slider.responsiveSettings);
      setSaveState("idle");
    }, "Could not reset settings. Please try again.");

  const missing =
    !loading && sliderId && !sliders.some((s) => s.id === sliderId);
  const dotsShown =
    !!settings?.showPagination && settings.pagination !== "none";
  const ready = !!(sliderId && settings && responsive && !missing);

  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <Box direction="vertical" padding="SP3 SP4 SP2" gap="SP1">
          <FormField label="Slider" id="published-slider">
            <Box gap="SP1" verticalAlign="middle">
              <Box flex={1} minWidth={0}>
                <Dropdown
                  id="published-slider"
                  size="small"
                  placeholder={
                    loading
                      ? "Loading sliders…"
                      : sliders.length
                        ? "Choose a slider"
                        : "No published sliders yet"
                  }
                  options={sliders}
                  selectedId={missing ? undefined : sliderId}
                  disabled={busy || loading || !sliders.length}
                  onSelect={(v) => void select(String(v.id))}
                  popoverProps={{ appendTo: "window" }}
                />
              </Box>
              {ready && (
                <Tooltip content="Load latest published version">
                  <IconButton
                    size="small"
                    priority="secondary"
                    disabled={busy}
                    ariaLabel="Load latest published version"
                    onClick={() => void sync()}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </FormField>
        </Box>
        {error && (
          <Box padding="0 SP4 SP2">
            <SectionHelper skin="danger">{error}</SectionHelper>
          </Box>
        )}
        {ready && (
          <Tabs
            items={TABS}
            activeId={tab}
            type="uniformFull"
            size="small"
            showDivider
            onClick={(item) => setTab(item.id as Tab)}
          />
        )}
        <SidePanel.Content noPadding>
          {loading ? (
            <Box align="center" padding="SP6">
              <Loader size="small" />
            </Box>
          ) : !ready ? (
            <Box padding="SP4">
              <SectionHelper skin={missing ? "warning" : "standard"}>
                {missing
                  ? "The slider on this widget was unpublished or deleted. Choose another slider."
                  : sliders.length
                    ? "Choose a slider to display. You can then customize how it looks and behaves here."
                    : "Create and publish a slider in the Slideshow Studio dashboard, then reopen these settings."}
              </SectionHelper>
            </Box>
          ) : (
            settings &&
            responsive && (
              <>
                {tab === "behavior" && (
                  <>
                    <Section title="Transition">
                      <SelectField
                        label="Effect"
                        info={settingsHelp.effect}
                        value={settings.effect}
                        options={[...EFFECTS]}
                        onChange={(v) => set("effect", v)}
                      />
                      <RangeField
                        label="Transition speed"
                        info={settingsHelp.speed}
                        value={settings.speed}
                        min={0}
                        max={5000}
                        step={50}
                        unit="ms"
                        onChange={(v) => set("speed", v)}
                      />
                      <ChoiceField
                        label="Direction"
                        info={settingsHelp.direction}
                        value={settings.direction}
                        options={[
                          { id: "horizontal", label: "Horizontal" },
                          { id: "vertical", label: "Vertical" },
                        ]}
                        onChange={(v) => set("direction", v)}
                      />
                      <ToggleField
                        label="Loop slides"
                        info={settingsHelp.loop}
                        checked={settings.loop}
                        onChange={(v) => set("loop", v)}
                      />
                      <ToggleField
                        label="Center active slide"
                        info={settingsHelp.centered}
                        checked={settings.centered}
                        onChange={(v) => set("centered", v)}
                      />
                      <ToggleField
                        label="Auto height"
                        info={settingsHelp.autoHeight}
                        checked={settings.autoHeight}
                        onChange={(v) => set("autoHeight", v)}
                      />
                    </Section>
                    <Section title="Autoplay">
                      <ToggleField
                        label="Play automatically"
                        info={settingsHelp.autoplay}
                        checked={settings.autoplay}
                        onChange={(v) => set("autoplay", v)}
                      />
                      {settings.autoplay && (
                        <>
                          <RangeField
                            label="Time per slide"
                            info={settingsHelp.delay}
                            value={settings.delay}
                            min={1000}
                            max={60000}
                            step={0.5}
                            scale={1000}
                            unit="s"
                            onChange={(v) => set("delay", v)}
                          />
                          <ToggleField
                            label="Pause on hover"
                            info={settingsHelp.pauseOnHover}
                            checked={settings.pauseOnHover}
                            onChange={(v) => set("pauseOnHover", v)}
                          />
                          <ToggleField
                            label="Stop after interaction"
                            info={settingsHelp.pauseOnInteraction}
                            checked={settings.pauseOnInteraction}
                            onChange={(v) => set("pauseOnInteraction", v)}
                          />
                        </>
                      )}
                    </Section>
                    <Section title="Navigation">
                      <ToggleField
                        label="Swipe on touch devices"
                        info={settingsHelp.swipe}
                        checked={settings.swipe}
                        onChange={(v) => set("swipe", v)}
                      />
                      <ToggleField
                        label="Drag with mouse"
                        info={settingsHelp.mouseDrag}
                        checked={settings.mouseDrag}
                        onChange={(v) => set("mouseDrag", v)}
                      />
                      <ToggleField
                        label="Keyboard arrows"
                        info={settingsHelp.keyboard}
                        checked={settings.keyboard}
                        onChange={(v) => set("keyboard", v)}
                      />
                      <RangeField
                        label="Start at slide"
                        info={settingsHelp.initialSlide}
                        value={settings.initialSlide + 1}
                        min={1}
                        max={Math.max(1, snapshot?.slides.length ?? 1)}
                        onChange={(v) => set("initialSlide", v - 1)}
                      />
                    </Section>
                  </>
                )}

                {tab === "design" && (
                  <>
                    <Section title="Container">
                      <ColorField
                        label="Background"
                        info={settingsHelp.background}
                        value={settings.background}
                        onChange={(v) => set("background", v)}
                      />
                      <RangeField
                        label="Corner radius"
                        info={settingsHelp.radius}
                        value={settings.radius}
                        min={0}
                        max={100}
                        unit="px"
                        onChange={(v) => set("radius", v)}
                      />
                      <ChoiceField
                        label="Shadow"
                        info={settingsHelp.shadow}
                        value={settings.shadow}
                        options={[
                          { id: "none", label: "None" },
                          { id: "soft", label: "Soft" },
                          { id: "strong", label: "Strong" },
                        ]}
                        onChange={(v) => set("shadow", v)}
                      />
                      <RangeField
                        label="Border width"
                        info={settingsHelp.borderWidth}
                        value={settings.borderWidth}
                        min={0}
                        max={20}
                        unit="px"
                        onChange={(v) => set("borderWidth", v)}
                      />
                      {settings.borderWidth > 0 && (
                        <>
                          <ColorField
                            label="Border color"
                            info={settingsHelp.borderColor}
                            value={settings.borderColor}
                            onChange={(v) => set("borderColor", v)}
                          />
                          <ChoiceField
                            label="Border style"
                            info={settingsHelp.borderStyle}
                            value={settings.borderStyle}
                            options={[
                              { id: "solid", label: "Solid" },
                              { id: "dashed", label: "Dashed" },
                              { id: "dotted", label: "Dotted" },
                            ]}
                            onChange={(v) => set("borderStyle", v)}
                          />
                        </>
                      )}
                    </Section>
                    <Section title="Arrows">
                      <ToggleField
                        label="Show arrows"
                        info={settingsHelp.showArrows}
                        checked={settings.showArrows}
                        onChange={(v) => set("showArrows", v)}
                      />
                      {settings.showArrows && (
                        <>
                          <ColorField
                            label="Arrow icon color"
                            info={settingsHelp.arrowColor}
                            value={settings.arrowColor}
                            onChange={(v) => set("arrowColor", v)}
                          />
                          <ColorField
                            label="Background"
                            info={settingsHelp.arrowBackground}
                            value={settings.arrowBackground}
                            onChange={(v) => set("arrowBackground", v)}
                          />
                          <ColorField
                            label="Border"
                            info={settingsHelp.arrowBorder}
                            value={settings.arrowBorder}
                            onChange={(v) => set("arrowBorder", v)}
                          />
                          <ChoiceField
                            label="Icon"
                            info={settingsHelp.arrowIcon}
                            value={settings.arrowIcon}
                            options={[
                              { id: "chevron", label: "Chevron ›" },
                              { id: "arrow", label: "Arrow →" },
                            ]}
                            onChange={(v) => set("arrowIcon", v)}
                          />
                          <ChoiceField
                            label="Position"
                            info={settingsHelp.arrowPosition}
                            value={settings.arrowPosition}
                            options={[
                              { id: "inside", label: "Inside" },
                              { id: "outside", label: "Outside" },
                            ]}
                            onChange={(v) => set("arrowPosition", v)}
                          />
                          <RangeField
                            label="Size"
                            info={settingsHelp.arrowSize}
                            value={settings.arrowSize}
                            min={16}
                            max={80}
                            unit="px"
                            onChange={(v) => set("arrowSize", v)}
                          />
                          <RangeField
                            label="Roundness"
                            info={settingsHelp.arrowRadius}
                            value={settings.arrowRadius}
                            min={0}
                            max={100}
                            unit="%"
                            onChange={(v) => set("arrowRadius", v)}
                          />
                          <RangeField
                            label="Opacity"
                            info={settingsHelp.arrowOpacity}
                            value={settings.arrowOpacity}
                            min={0}
                            max={1}
                            scale={0.01}
                            unit="%"
                            onChange={(v) => set("arrowOpacity", v)}
                          />
                        </>
                      )}
                    </Section>
                    <Section title="Dots">
                      <ToggleField
                        label="Show dots"
                        info={settingsHelp.showPagination}
                        checked={dotsShown}
                        onChange={(v) => {
                          set("showPagination", v);
                          // "Hidden" is no longer a style option; switching dots
                          // back on for such a slider starts from plain dots.
                          if (v && settings.pagination === "none")
                            set("pagination", "bullets");
                        }}
                      />
                      {dotsShown && (
                        <>
                          <SelectField
                            label="Style"
                            info={settingsHelp.pagination}
                            value={settings.pagination}
                            options={[...PAGINATION]}
                            onChange={(v) => set("pagination", v)}
                          />
                          {settings.pagination !== "none" && (
                            <>
                              <ChoiceField
                                label="Position"
                                info={settingsHelp.paginationPosition}
                                value={settings.paginationPosition}
                                options={[
                                  { id: "top", label: "Top" },
                                  { id: "bottom", label: "Bottom" },
                                ]}
                                onChange={(v) => set("paginationPosition", v)}
                              />
                              <ColorField
                                label="Dot color"
                                info={settingsHelp.paginationColor}
                                value={settings.paginationColor}
                                onChange={(v) => set("paginationColor", v)}
                              />
                              <ColorField
                                label="Active dot color"
                                info={settingsHelp.paginationActiveColor}
                                value={settings.paginationActiveColor}
                                onChange={(v) =>
                                  set("paginationActiveColor", v)
                                }
                              />
                              {settings.pagination === "bullets" && (
                                <>
                                  <RangeField
                                    label="Dot size"
                                    info={settingsHelp.paginationSize}
                                    value={settings.paginationSize}
                                    min={3}
                                    max={30}
                                    unit="px"
                                    onChange={(v) => set("paginationSize", v)}
                                  />
                                  <RangeField
                                    label="Dot spacing"
                                    info={settingsHelp.paginationSpacing}
                                    value={settings.paginationSpacing}
                                    min={0}
                                    max={30}
                                    unit="px"
                                    onChange={(v) =>
                                      set("paginationSpacing", v)
                                    }
                                  />
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </Section>
                  </>
                )}

                {tab === "layout" && (
                  <>
                    <Section title="Size & spacing">
                      <RangeField
                        label="Width"
                        info={settingsHelp.width}
                        value={settings.width}
                        min={10}
                        max={100}
                        unit="%"
                        onChange={(v) => set("width", v)}
                      />
                      <RangeField
                        label="Max width"
                        info={settingsHelp.maxWidth}
                        value={settings.maxWidth}
                        min={200}
                        max={3840}
                        step={10}
                        unit="px"
                        onChange={(v) => set("maxWidth", v)}
                      />
                      <RangeField
                        label="Min height"
                        info={settingsHelp.minHeight}
                        value={settings.minHeight}
                        min={0}
                        max={1500}
                        step={10}
                        unit="px"
                        onChange={(v) => set("minHeight", v)}
                      />
                      <RangeField
                        label="Inner padding"
                        info={settingsHelp.padding}
                        value={settings.padding}
                        min={0}
                        max={100}
                        unit="px"
                        onChange={(v) => set("padding", v)}
                      />
                      <RangeField
                        label="Outer margin"
                        info={settingsHelp.margin}
                        value={settings.margin}
                        min={0}
                        max={100}
                        unit="px"
                        onChange={(v) => set("margin", v)}
                      />
                    </Section>
                    <Section title="Per device">
                      <SidePanel.Field>
                        <SegmentedToggle
                          size="small"
                          selected={device}
                          ariaLabel="Device"
                          onClick={(_, v) => setDevice(v as Device)}
                        >
                          {DEVICES.map((d) => (
                            <SegmentedToggle.Button
                              key={d.id}
                              value={d.id}
                              prefixIcon={d.icon}
                            >
                              {d.label}
                            </SegmentedToggle.Button>
                          ))}
                        </SegmentedToggle>
                      </SidePanel.Field>
                      <RangeField
                        label="Height"
                        info={settingsHelp.height}
                        value={responsive[device].height}
                        min={100}
                        max={1500}
                        step={10}
                        unit="px"
                        onChange={(v) => setBreakpoint("height", v)}
                      />
                      <RangeField
                        label="Slides per view"
                        info={settingsHelp.slidesPerView}
                        value={responsive[device].slidesPerView}
                        min={1}
                        max={12}
                        onChange={(v) => setBreakpoint("slidesPerView", v)}
                      />
                      <RangeField
                        label="Slides per step"
                        info={settingsHelp.slidesPerGroup}
                        value={responsive[device].slidesPerGroup}
                        min={1}
                        max={12}
                        onChange={(v) => setBreakpoint("slidesPerGroup", v)}
                      />
                      <RangeField
                        label="Gap between slides"
                        info={settingsHelp.gap}
                        value={responsive[device].gap}
                        min={0}
                        max={100}
                        unit="px"
                        onChange={(v) => setBreakpoint("gap", v)}
                      />
                      <SelectField
                        label="Content alignment"
                        info={settingsHelp.alignment}
                        value={responsive[device].alignment}
                        options={ALIGNMENTS}
                        onChange={(v) => setBreakpoint("alignment", v)}
                      />
                      <ChoiceField
                        label="Media fit"
                        info={settingsHelp.mediaFit}
                        value={responsive[device].mediaFit}
                        options={[
                          { id: "cover", label: "Fill" },
                          { id: "contain", label: "Fit" },
                          { id: "fill", label: "Stretch" },
                        ]}
                        onChange={(v) => setBreakpoint("mediaFit", v)}
                      />
                      <RangeField
                        label="Heading size"
                        info={settingsHelp.textSize}
                        value={responsive[device].textSize}
                        min={10}
                        max={120}
                        unit="px"
                        onChange={(v) => setBreakpoint("textSize", v)}
                      />
                      <RangeField
                        label="Button text size"
                        info={settingsHelp.buttonSize}
                        value={responsive[device].buttonSize}
                        min={8}
                        max={40}
                        unit="px"
                        onChange={(v) => setBreakpoint("buttonSize", v)}
                      />
                      <ToggleField
                        label="Show arrows"
                        info={settingsHelp.navigation}
                        checked={responsive[device].navigation}
                        onChange={(v) => setBreakpoint("navigation", v)}
                      />
                      <ToggleField
                        label="Show pagination"
                        info={responsiveHelp.pagination}
                        checked={responsive[device].pagination}
                        onChange={(v) => setBreakpoint("pagination", v)}
                      />
                    </Section>
                  </>
                )}

                {tab === "text" && (
                  <>
                    <SelectField
                      label="Text style"
                      info="Choose which text element to style."
                      value={textStyle}
                      options={TEXT_STYLES}
                      onChange={setTextStyle}
                    />
                    <Section
                      title={TEXT_STYLES.find((t) => t.id === textStyle)!.label}
                    >
                      <FontField
                        label="Font"
                        info={settingsHelp.fontFamily}
                        value={settings.typography[textStyle].fontFamily}
                        onChange={(v) => setType("fontFamily", v)}
                      />
                      <ColorField
                        label="Color"
                        info={settingsHelp.color}
                        value={settings.typography[textStyle].color}
                        onChange={(v) => setType("color", v)}
                      />
                      <RangeField
                        label="Font size"
                        info={settingsHelp.fontSize}
                        value={settings.typography[textStyle].fontSize}
                        min={8}
                        max={160}
                        unit="px"
                        onChange={(v) => setType("fontSize", v)}
                      />
                      <SelectField
                        label="Weight"
                        info={settingsHelp.fontWeight}
                        value={String(
                          settings.typography[textStyle].fontWeight,
                        )}
                        options={WEIGHTS}
                        onChange={(v) => setType("fontWeight", Number(v))}
                      />
                      <RangeField
                        label="Line height"
                        info={settingsHelp.lineHeight}
                        value={settings.typography[textStyle].lineHeight}
                        min={0.8}
                        max={3}
                        step={0.1}
                        onChange={(v) => setType("lineHeight", v)}
                      />
                      <RangeField
                        label="Letter spacing"
                        info={settingsHelp.letterSpacing}
                        value={settings.typography[textStyle].letterSpacing}
                        min={-5}
                        max={20}
                        step={0.5}
                        unit="px"
                        onChange={(v) => setType("letterSpacing", v)}
                      />
                    </Section>
                  </>
                )}
              </>
            )
          )}
        </SidePanel.Content>
        {ready && (
          <SidePanel.Footer>
            <Box align="space-between" verticalAlign="middle">
              <Text
                size="tiny"
                secondary={saveState !== "error"}
                skin={saveState === "error" ? "error" : "standard"}
                role="status"
              >
                {
                  {
                    idle: "Changes apply automatically",
                    saving: "Applying…",
                    saved: "All changes applied",
                    error: "Couldn't apply changes",
                  }[saveState]
                }
              </Text>
              <Tooltip content="Restore the settings saved with this slider in the dashboard">
                <TextButton
                  size="tiny"
                  prefixIcon={<RevertReset />}
                  disabled={busy}
                  onClick={() => void reset()}
                >
                  Reset
                </TextButton>
              </Tooltip>
            </Box>
          </SidePanel.Footer>
        )}
      </SidePanel>
    </WixDesignSystemProvider>
  );
}
