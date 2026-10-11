import { Plus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Choice, TextField, FieldLabel } from "../forms/Fields";
import { visibilityValueHelp } from "../../lib/slider/editor-help";
import { conditionSchema, type Slide } from "../../schemas/slider";
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
            tip="Choose what to check before showing this slide. Member matches signed-in visitors; Guest matches visitors who are signed out."
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
              tip={visibilityValueHelp[c.kind]}
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
            <FieldLabel
              htmlFor={`schedule-${key}`}
              className="field-label capitalize"
              label={`${key} date & time`}
              tip={
                key === "start"
                  ? "Show this slide starting at this date and time in your local timezone. Leave blank for no start limit."
                  : "Hide this slide at this date and time in your local timezone. Leave blank for no end limit."
              }
            />
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
