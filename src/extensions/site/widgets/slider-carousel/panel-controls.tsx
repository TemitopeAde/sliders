import type { ReactNode } from "react";
import { inputs } from "@wix/editor";
import {
  SidePanel,
  FormField,
  FieldSet,
  Dropdown,
  ToggleSwitch,
  FillPreview,
  Slider,
  NumberInput,
  Input,
  SegmentedToggle,
  Button,
} from "@wix/design-system";

type Option<T extends string> = { id: T; label: string };

export function ToggleField({
  label,
  info,
  checked,
  onChange,
}: {
  label: string;
  info?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <SidePanel.Field>
      <FormField label={label} infoContent={info} labelPlacement="left">
        <ToggleSwitch
          size="small"
          checked={checked}
          onChange={() => onChange(!checked)}
        />
      </FormField>
    </SidePanel.Field>
  );
}

export function RangeField({
  label,
  info,
  value,
  min,
  max,
  step = 1,
  unit,
  scale = 1,
  onChange,
}: {
  label: string;
  info?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Displayed value = stored value / scale (e.g. ms shown as seconds). */
  scale?: number;
  onChange: (v: number) => void;
}) {
  const shown = +(value / scale).toFixed(2);
  const commit = (v: number | null) => {
    if (v === null || !Number.isFinite(v)) return;
    const next = Math.min(
      max,
      Math.max(min, Math.round(v * scale * 100) / 100),
    );
    if (next !== value) onChange(next);
  };
  return (
    <SidePanel.Field>
      <FieldSet
        legend={label}
        infoContent={info}
        legendSize="small"
        gap="small"
        columns="auto 76px"
        alignment="center"
      >
        <Slider
          min={min / scale}
          max={max / scale}
          step={step}
          value={shown}
          displayMarks={false}
          displayTooltip={false}
          ariaLabelForHandle={label}
          onChange={(v) => commit(Array.isArray(v) ? (v[0] ?? null) : v)}
        />
        <NumberInput
          size="small"
          hideStepper
          min={min / scale}
          max={max / scale}
          step={step}
          value={shown}
          onChange={commit}
          suffix={unit ? <Input.Affix>{unit}</Input.Affix> : undefined}
        />
      </FieldSet>
    </SidePanel.Field>
  );
}

export function SelectField<T extends string>({
  label,
  info,
  value,
  options,
  onChange,
}: {
  label: string;
  info?: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <SidePanel.Field>
      <FormField label={label} infoContent={info}>
        <Dropdown
          size="small"
          selectedId={value}
          options={options.map((o) => ({ id: o.id, value: o.label }))}
          onSelect={(o) => onChange(o.id as T)}
          popoverProps={{ appendTo: "window" }}
        />
      </FormField>
    </SidePanel.Field>
  );
}

export function ChoiceField<T extends string>({
  label,
  info,
  value,
  options,
  onChange,
}: {
  label: string;
  info?: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <SidePanel.Field>
      <FormField label={label} infoContent={info}>
        <SegmentedToggle
          size="small"
          selected={value}
          ariaLabel={label}
          onClick={(_, v) => onChange(v as T)}
        >
          {options.map((o) => (
            <SegmentedToggle.Button key={o.id} value={o.id}>
              {o.label}
            </SegmentedToggle.Button>
          ))}
        </SegmentedToggle>
      </FormField>
    </SidePanel.Field>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <SidePanel.Field>
      <FieldSet
        legend={label}
        legendSize="small"
        legendPlacement="left"
        columns="30px"
        alignment="center"
      >
        <FillPreview
          fill={value}
          aspectRatio={1}
          onClick={() =>
            inputs.selectColor(value, {
              onChange: (next) => {
                if (next && /^#[\da-f]{3,8}$/i.test(next)) onChange(next);
              },
            })
          }
        />
      </FieldSet>
    </SidePanel.Field>
  );
}

export function FontField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const name =
    value === "inherit" ? "Site default" : (value.split(",")[0] ?? value);
  return (
    <SidePanel.Field>
      <FormField label={label}>
        <Button
          size="small"
          priority="secondary"
          fullWidth
          onClick={() =>
            inputs.selectFont(
              { font: `16px ${value}`, textDecoration: "" },
              { onChange: (v) => onChange(v.font.replace(/^.*?\d+px\s*/, "")) },
            )
          }
        >
          {name.replace(/['"]/g, "")}
        </Button>
      </FormField>
    </SidePanel.Field>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return <SidePanel.Section title={title}>{children}</SidePanel.Section>;
}
