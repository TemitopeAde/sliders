import { z } from "zod";
import {
  Choice,
  ColorField,
  NumberField,
  TextField,
  Toggle,
} from "../forms/Fields";
import { Textarea } from "../ui/textarea";
const humanize = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace("Url", "URL");
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodDefault) return unwrap(schema.removeDefault());
  if (schema instanceof z.ZodOptional) return unwrap(schema.unwrap());
  if (schema instanceof z.ZodEffects) return unwrap(schema.innerType());
  return schema;
}
export function SchemaFields({
  schema,
  value,
  onChange,
  only,
  exclude = [],
  labels = {},
}: {
  schema: z.ZodTypeAny;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  only?: string[];
  exclude?: string[];
  labels?: Record<string, string>;
}) {
  const object = unwrap(schema);
  if (!(object instanceof z.ZodObject)) return null;
  const shape = object.shape as Record<string, z.ZodTypeAny>;
  return (
    <div className="settings-grid">
      {Object.entries(shape)
        .filter(
          ([key]) => (!only || only.includes(key)) && !exclude.includes(key),
        )
        .map(([key, wrapped]) => {
          const field = unwrap(wrapped);
          const current = value[key];
          const label = labels[key] ?? humanize(key);
          const change = (next: unknown) => onChange({ ...value, [key]: next });
          if (field instanceof z.ZodBoolean)
            return (
              <Toggle
                key={key}
                label={label}
                value={Boolean(current)}
                onChange={change}
              />
            );
          if (field instanceof z.ZodEnum)
            return (
              <Choice
                key={key}
                label={label}
                value={String(current)}
                options={field.options}
                onChange={change}
              />
            );
          if (field instanceof z.ZodNumber)
            return (
              <NumberField
                key={key}
                label={label}
                value={Number(current ?? 0)}
                onChange={change}
                min={field.minValue ?? 0}
                max={field.maxValue ?? 10000}
                step={field.maxValue !== null && field.maxValue <= 3 ? 0.05 : 1}
              />
            );
          if (field instanceof z.ZodString) {
            if (typeof current === "string" && /^#[\da-f]{6}$/i.test(current))
              return (
                <ColorField
                  key={key}
                  label={label}
                  value={current}
                  onChange={change}
                />
              );
            if (key === "description")
              return (
                <div key={key}>
                  <label htmlFor={`field-${key}`} className="field-label">
                    {label}
                  </label>
                  <Textarea
                    id={`field-${key}`}
                    value={String(current ?? "")}
                    onChange={(e) => change(e.target.value)}
                  />
                </div>
              );
            return (
              <TextField
                key={key}
                label={label}
                value={String(current ?? "")}
                onChange={change}
              />
            );
          }
          if (field instanceof z.ZodObject)
            return (
              <details key={key} className="border rounded-lg p-3">
                <summary className="text-xs font-semibold cursor-pointer">
                  {label}
                </summary>
                <div className="mt-4">
                  <SchemaFields
                    schema={field}
                    value={
                      typeof current === "object" && current !== null
                        ? (current as Record<string, unknown>)
                        : {}
                    }
                    onChange={change}
                  />
                </div>
              </details>
            );
          return null;
        })}
    </div>
  );
}
