import {
  ArrowDown,
  ArrowUp,
  Copy,
  Heading,
  MousePointerClick,
  RotateCcw,
  Tag,
  Trash2,
  Type,
  EyeOff,
} from "lucide-react";
import {
  buttonSchema,
  layerSchema,
  positionSchema,
  typographySchema,
  type Layer,
} from "../../schemas/slider";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Choice, NumberField, TextField, Toggle } from "../forms/Fields";
import { SchemaFields } from "./SchemaFields";

const presets = {
  heading: { kind: "text", variant: "heading", text: "Your headline" },
  paragraph: {
    kind: "text",
    variant: "paragraph",
    text: "Tell visitors a little more.",
  },
  badge: { kind: "text", variant: "badge", text: "NEW" },
  button: { kind: "button", text: "Shop now" },
} as const;
const typographyStart = {
  heading: {},
  paragraph: { fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
  badge: { fontSize: 12, letterSpacing: 2 },
  price: { fontSize: 24 },
} satisfies Record<Layer["variant"], Partial<Layer["typography"]>>;
const addOptions = [
  { key: "heading", label: "Heading", icon: Heading },
  { key: "paragraph", label: "Text", icon: Type },
  { key: "badge", label: "Badge", icon: Tag },
  { key: "button", label: "Button", icon: MousePointerClick },
] as const;
const layerIcon = (l: Layer) =>
  l.kind === "button"
    ? MousePointerClick
    : l.variant === "heading"
      ? Heading
      : l.variant === "badge"
        ? Tag
        : Type;
const layerName = (l: Layer) =>
  l.kind === "button"
    ? "Button"
    : l.variant.charAt(0).toUpperCase() + l.variant.slice(1);

export function LayersPanel({
  layers,
  selected,
  onSelect,
  onChange,
}: {
  layers: Layer[];
  selected?: string;
  onSelect: (id?: string) => void;
  onChange: (layers: Layer[]) => void;
}) {
  const layer = layers.find((l) => l._id === selected);
  const update = (id: string, patch: Partial<Layer>) =>
    onChange(layers.map((l) => (l._id === id ? { ...l, ...patch } : l)));
  const add = (key: keyof typeof presets) => {
    // New layers join the zone of the selected (or last) layer so they
    // appear next to existing content instead of in an arbitrary corner.
    const near = layer ?? layers.at(-1);
    const next = layerSchema.parse({
      ...presets[key],
      _id: crypto.randomUUID(),
      zone: near?.zone ?? "center-left",
    });
    onChange([...layers, next]);
    onSelect(next._id);
  };
  const move = (index: number, by: number) => {
    const next = [...layers];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(index + by, 0, item);
    onChange(next);
  };
  return (
    <div className="space-y-4">
      <div>
        <span className="field-label">Add to slide</span>
        <div className="grid grid-cols-4 gap-1.5">
          {addOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => add(o.key)}
              className="border rounded-lg py-2 flex flex-col items-center gap-1 text-[11px] text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
            >
              <o.icon size={15} />
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="field-label">Layers</span>
        {!layers.length ? (
          <p className="muted text-center border border-dashed rounded-lg py-5 px-3 mb-0">
            This slide has no text or buttons yet. Add one above.
          </p>
        ) : (
          <ul className="border rounded-lg divide-y" aria-label="Slide layers">
            {layers.map((l, i) => {
              const Icon = layerIcon(l);
              const active = l._id === selected;
              const hidden =
                !l.devices.desktop || !l.devices.tablet || !l.devices.mobile;
              return (
                <li
                  key={l._id}
                  className={`flex items-center gap-1 pl-2 pr-1 py-1 ${active ? "bg-blue-50" : ""}`}
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 flex items-center gap-2 py-1 text-left text-xs"
                    aria-pressed={active}
                    onClick={() => onSelect(active ? undefined : l._id)}
                  >
                    <Icon
                      size={14}
                      className={active ? "text-blue-600" : "text-gray-400"}
                    />
                    <span className="truncate">
                      {l.text || (
                        <span className="text-gray-400">
                          Empty {layerName(l).toLowerCase()}
                        </span>
                      )}
                    </span>
                    {hidden && (
                      <EyeOff
                        size={12}
                        className="text-gray-400 shrink-0"
                        aria-label="Hidden on some devices"
                      />
                    )}
                  </button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Move down"
                    disabled={i === layers.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Duplicate ${layerName(l)}`}
                    onClick={() => {
                      const copy = { ...l, _id: crypto.randomUUID() };
                      const next = [...layers];
                      next.splice(i + 1, 0, copy);
                      onChange(next);
                      onSelect(copy._id);
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="hover:text-red-600"
                    aria-label={`Delete ${layerName(l)}`}
                    onClick={() => {
                      onChange(layers.filter((v) => v._id !== l._id));
                      if (active) onSelect(undefined);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {layers.length > 0 && !layer && (
          <p className="muted mt-2 mb-0">
            Select a layer here or click it in the preview. Drag it in the
            preview to move it.
          </p>
        )}
      </div>
      {layer && (
        <LayerSettings
          key={layer._id}
          layer={layer}
          onChange={(patch) => update(layer._id, patch)}
        />
      )}
    </div>
  );
}

function LayerSettings({
  layer,
  onChange,
}: {
  layer: Layer;
  onChange: (patch: Partial<Layer>) => void;
}) {
  const isButton = layer.kind === "button";
  return (
    <div className="border rounded-lg p-3 space-y-4 bg-gray-50/60">
      <p className="text-xs font-semibold m-0">{layerName(layer)} settings</p>
      {isButton ? (
        <TextField
          label="Label"
          value={layer.text}
          onChange={(text) => onChange({ text })}
        />
      ) : (
        <div>
          <label htmlFor={`layer-${layer._id}`} className="field-label">
            Text
          </label>
          <Textarea
            id={`layer-${layer._id}`}
            className="bg-white"
            value={layer.text}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      )}
      {!isButton && (
        <Choice
          label="Style"
          value={layer.variant}
          options={layerSchema.shape.variant.removeDefault().options}
          onChange={(v) => onChange({ variant: v as Layer["variant"] })}
        />
      )}
      <div>
        <span className="field-label">Position on slide</span>
        <div className="flex items-start gap-4">
          <div className="position-grid">
            {positionSchema.options.map((p) => (
              <button
                key={p}
                type="button"
                data-selected={layer.zone === p}
                aria-label={p.replaceAll("-", " ")}
                aria-pressed={layer.zone === p}
                onClick={() => onChange({ zone: p, offsetX: 0, offsetY: 0 })}
              >
                ·
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed m-0">
            Layers in the same area stack in list order. Drag in the preview to
            fine-tune.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Nudge X (px)"
          value={layer.offsetX}
          min={-2000}
          max={2000}
          onChange={(offsetX) => onChange({ offsetX })}
        />
        <NumberField
          label="Nudge Y (px)"
          value={layer.offsetY}
          min={-2000}
          max={2000}
          onChange={(offsetY) => onChange({ offsetY })}
        />
      </div>
      {(layer.offsetX !== 0 || layer.offsetY !== 0) && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-xs -mt-2"
          onClick={() => onChange({ offsetX: 0, offsetY: 0 })}
        >
          <RotateCcw size={13} />
          Reset nudge
        </Button>
      )}
      {!isButton && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Width (%)"
            value={layer.width}
            min={5}
            max={100}
            onChange={(width) => onChange({ width })}
          />
          <NumberField
            label="Max width (px)"
            value={layer.maxWidth}
            min={40}
            max={2000}
            onChange={(maxWidth) => onChange({ maxWidth })}
          />
        </div>
      )}
      {isButton ? (
        <>
          <TextField
            label="Link URL"
            placeholder="https://… or /page"
            value={layer.button.url}
            onChange={(url) => onChange({ button: { ...layer.button, url } })}
          />
          <Toggle
            label="Open in new tab"
            value={layer.button.newTab}
            onChange={(newTab) =>
              onChange({ button: { ...layer.button, newTab } })
            }
          />
          <details className="border rounded-lg p-3 bg-white">
            <summary className="text-xs font-semibold cursor-pointer">
              Button style
            </summary>
            <div className="mt-4">
              <SchemaFields
                schema={buttonSchema}
                value={layer.button}
                exclude={["label", "url", "newTab"]}
                onChange={(v) => onChange({ button: v as Layer["button"] })}
              />
            </div>
          </details>
        </>
      ) : (
        <>
          <Toggle
            label="Use slide typography"
            value={layer.inheritTypography}
            onChange={(inheritTypography) =>
              onChange(
                inheritTypography
                  ? { inheritTypography }
                  : {
                      inheritTypography,
                      typography: typographySchema.parse(
                        typographyStart[layer.variant],
                      ),
                    },
              )
            }
          />
          {!layer.inheritTypography && (
            <SchemaFields
              schema={typographySchema}
              value={layer.typography}
              onChange={(v) =>
                onChange({ typography: v as Layer["typography"] })
              }
            />
          )}
        </>
      )}
      <div>
        <span className="field-label">Show on</span>
        <div className="space-y-2">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <Toggle
              key={d}
              label={d.charAt(0).toUpperCase() + d.slice(1)}
              value={layer.devices[d]}
              onChange={(v) =>
                onChange({ devices: { ...layer.devices, [d]: v } })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
