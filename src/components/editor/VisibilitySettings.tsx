import { Plus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Choice, TextField } from "../forms/Fields";
import {
  conditionSchema,
  type Slide,
  visibilitySchema,
} from "../../schemas/slider";
export function VisibilitySettings({
  slide,
  onChange,
}: {
  slide: Slide;
  onChange: (s: Slide) => void;
}) {
  const v = slide.visibility;
  return (
    <div className="space-y-5">
      <Choice
        label="Match conditions"
        value={v.operator}
        options={["AND", "OR"]}
        onChange={(operator) =>
          onChange({
            ...slide,
            visibility: visibilitySchema.parse({ ...v, operator }),
          })
        }
      />
      <p className="muted">
        No conditions means visible to everyone. Page paths must match exactly.
        Days use 0–6 (Sunday–Saturday); times use HH:mm-HH:mm in the visitor’s
        timezone.
      </p>
      {v.conditions.map((c, i) => (
        <div className="border rounded-lg p-3 space-y-3" key={i}>
          <div className="flex justify-between">
            <span className="text-xs font-medium">Condition {i + 1}</span>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Remove condition ${i + 1}`}
              onClick={() =>
                onChange({
                  ...slide,
                  visibility: {
                    ...v,
                    conditions: v.conditions.filter((_, index) => index !== i),
                  },
                })
              }
            >
              <X size={14} />
            </Button>
          </div>
          <Choice
            label="Rule"
            value={c.kind}
            options={conditionSchema.shape.kind.options}
            onChange={(kind) =>
              onChange({
                ...slide,
                visibility: {
                  ...v,
                  conditions: v.conditions.map((item, index) =>
                    index === i
                      ? conditionSchema.parse({ ...item, kind })
                      : item,
                  ),
                },
              })
            }
          />
          {!["member", "guest"].includes(c.kind) && (
            <TextField
              label="Value"
              value={c.value}
              onChange={(value) =>
                onChange({
                  ...slide,
                  visibility: {
                    ...v,
                    conditions: v.conditions.map((item, index) =>
                      index === i ? { ...item, value } : item,
                    ),
                  },
                })
              }
            />
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            ...slide,
            visibility: {
              ...v,
              conditions: [
                ...v.conditions,
                { kind: "device", value: "mobile" },
              ],
            },
          })
        }
      >
        <Plus size={14} />
        Add condition
      </Button>
      <p className="text-xs text-gray-500">
        Country and role conditions hide the slide when that visitor context is
        unavailable.
      </p>
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-semibold">Schedule</h3>
        {(["start", "end"] as const).map((key) => (
          <div key={key}>
            <label
              htmlFor={`schedule-${key}`}
              className="field-label capitalize"
            >
              {key} date & time
            </label>
            <input
              id={`schedule-${key}`}
              type="datetime-local"
              className="w-full border rounded p-2 text-xs"
              value={slide.schedule[key] ? localTime(slide.schedule[key]) : ""}
              onChange={(e) =>
                onChange({
                  ...slide,
                  schedule: {
                    ...slide.schedule,
                    [key]: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  },
                })
              }
            />
          </div>
        ))}
        <p className="muted">
          Leave blank for always active. Dates are stored in UTC.
        </p>
      </div>
    </div>
  );
}
function localTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
