import { z } from "zod";
import { inputs } from "@wix/editor";
import {
  SidePanel,
  FormField,
  Input,
  Dropdown,
  ToggleSwitch,
  FillPreview,
  Button,
} from "@wix/design-system";
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodDefault) return unwrap(schema.removeDefault());
  if (schema instanceof z.ZodEffects) return unwrap(schema.innerType());
  return schema;
}
export function WixSettingsFields({
  schema,
  value,
  onChange,
  path = "widget",
}: {
  schema: z.ZodTypeAny;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  path?: string;
}) {
  const obj = unwrap(schema);
  if (!(obj instanceof z.ZodObject)) return null;
  return (
    <>
      {Object.entries(obj.shape as Record<string, z.ZodTypeAny>)
        .filter(
          ([key]) =>
            ![
              "collectionId",
              "syncProducts",
              "productSort",
              "analytics",
            ].includes(key),
        )
        .map(([key, wrapped]) => {
          const field = unwrap(wrapped);
          const current = value[key];
          const id = `${path}-${key}`;
          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (c) => c.toUpperCase());
          const update = (next: unknown) => onChange({ ...value, [key]: next });
          if (field instanceof z.ZodObject)
            return (
              <details
                style={{ padding: 16, borderTop: "1px solid #eee" }}
                key={key}
              >
                <summary style={{ fontSize: 13, cursor: "pointer" }}>
                  {label}
                </summary>
                <WixSettingsFields
                  schema={field}
                  value={current as Record<string, unknown>}
                  onChange={update}
                  path={id}
                />
              </details>
            );
          return (
            <SidePanel.Field key={key}>
              <FormField label={label} id={id}>
                {field instanceof z.ZodBoolean ? (
                  <ToggleSwitch
                    id={id}
                    checked={!!current}
                    onChange={() => update(!current)}
                  />
                ) : field instanceof z.ZodEnum ? (
                  <Dropdown
                    id={id}
                    selectedId={String(current)}
                    options={field.options.map((v: string) => ({
                      id: v,
                      value: v,
                    }))}
                    onSelect={(option) => update(option.id)}
                  />
                ) : field instanceof z.ZodNumber ? (
                  <Input
                    id={id}
                    type="number"
                    value={Number(current)}
                    min={field.minValue ?? 0}
                    max={field.maxValue ?? 10000}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (field.safeParse(next).success) update(next);
                    }}
                  />
                ) : key === "fontFamily" ? (
                  <Button
                    size="small"
                    onClick={() =>
                      inputs.selectFont(
                        { font: `16px ${String(current)}`, textDecoration: "" },
                        {
                          onChange: (v) =>
                            update(v.font.replace(/^.*?\d+px\s*/, "")),
                        },
                      )
                    }
                  >
                    Choose font
                  </Button>
                ) : typeof current === "string" &&
                  /^#[\da-f]{6}$/i.test(current) ? (
                  <FillPreview
                    fill={current}
                    onClick={() =>
                      inputs.selectColor(current, {
                        onChange: (next) => {
                          if (next) update(next);
                        },
                      })
                    }
                  />
                ) : (
                  <Input
                    id={id}
                    value={String(current ?? "")}
                    onChange={(e) => update(e.target.value)}
                  />
                )}
              </FormField>
            </SidePanel.Field>
          );
        })}
    </>
  );
}
