import { useEffect, useId, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
/** A small "i" button that explains a setting on hover or keyboard focus. */
export function InfoTip({ label, text }: { label: string; text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={`About ${label}`}
        className="inline-flex text-gray-400 hover:text-gray-600 focus-visible:text-gray-600"
      >
        <Info size={13} aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
export function FieldLabel({
  htmlFor,
  label,
  tip,
  className = "field-label",
}: {
  htmlFor: string;
  label: string;
  tip?: string;
  className?: string;
}) {
  if (!tip)
    return (
      <label htmlFor={htmlFor} className={className}>
        {label}
      </label>
    );
  return (
    <div className="flex items-center gap-1 mb-[7px]">
      <label htmlFor={htmlFor} className={`${className} mb-0!`}>
        {label}
      </label>
      <InfoTip label={label} text={tip} />
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {children}
      {hint && <p className="muted mt-1">{hint}</p>}
    </div>
  );
}
export function TextField({
  label,
  value,
  onChange,
  type = "text",
  ...props
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  onBlur?: () => void;
  tip?: string;
}) {
  const id = useId();
  const { tip, ...inputProps } = props;
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} tip={tip} />
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
    </div>
  );
}
/** Keeps what the user is typing locally, so intermediate text like "", "-"
 * or "6" (on the way to "600") is neither rejected nor saved. Only finite,
 * in-range numbers are committed; blur clamps or reverts the rest. */
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  tip,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  tip?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((current) =>
      current.trim() !== "" && Number(current) === value
        ? current
        : String(value),
    );
  }, [value]);
  const parse = (raw: string) => (raw.trim() === "" ? NaN : Number(raw));
  return (
    <TextField
      label={label}
      tip={tip}
      value={text}
      type="number"
      min={min}
      max={max}
      step={step}
      onChange={(raw) => {
        setText(raw);
        const v = parse(raw);
        if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
      }}
      onBlur={() => {
        const v = parse(text);
        if (!Number.isFinite(v)) {
          setText(String(value));
          return;
        }
        const clamped = Math.min(max, Math.max(min, v));
        setText(String(clamped));
        if (clamped !== value) onChange(clamped);
      }}
    />
  );
}
export function Toggle({
  label,
  value,
  onChange,
  tip,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  tip?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1">
        <label htmlFor={id} className="text-xs font-medium">
          {label}
        </label>
        {tip && <InfoTip label={label} text={tip} />}
      </span>
      <Switch id={id} checked={value} onCheckedChange={onChange} />
    </div>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
  tip,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  tip?: string;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} tip={tip} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option
                .replaceAll("-", " ")
                .replace(/^./, (c) => c.toUpperCase())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function ColorField({
  label,
  value,
  onChange,
  tip,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tip?: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} tip={tip} />
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          className="h-9 w-10 rounded border p-1 bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          aria-label={`${label} hex`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#[\da-f]{6}$/i.test(e.target.value)) onChange(e.target.value);
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </div>
  );
}
