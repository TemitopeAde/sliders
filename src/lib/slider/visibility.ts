import type { Device, Slide, VisibilityCondition } from "../../schemas/slider";
export interface VisibilityContext {
  device: Device;
  page: string;
  member?: boolean;
  country?: string;
  roles?: string[];
  inStock?: boolean;
  now: Date;
}
export function matchesCondition(
  condition: VisibilityCondition,
  context: VisibilityContext,
): boolean {
  const { value, kind } = condition;
  switch (kind) {
    case "page":
      return context.page === value;
    case "not-page":
      return context.page !== value;
    case "member":
      return context.member === true;
    case "guest":
      return context.member === false;
    case "device":
      return context.device === value;
    case "country":
      return context.country?.toUpperCase() === value.toUpperCase();
    case "role":
      return context.roles?.includes(value) ?? false;
    case "inventory":
      return (
        context.inStock !== undefined &&
        context.inStock === (value === "in-stock")
      );
    case "day":
      return value.split(",").includes(String(context.now.getDay()));
    case "time": {
      const [start, end] = value.split("-");
      const time = context.now.toTimeString().slice(0, 5);
      return (
        !!start &&
        !!end &&
        (start <= end
          ? time >= start && time <= end
          : time >= start || time <= end)
      );
    }
  }
}
export function isSlideVisible(
  slide: Slide,
  context: VisibilityContext,
): boolean {
  if (!slide.enabled || !slide.responsive[context.device]) return false;
  const now = context.now.getTime();
  if (slide.schedule.start && now < Date.parse(slide.schedule.start))
    return false;
  if (slide.schedule.end && now >= Date.parse(slide.schedule.end)) return false;
  const conditions = slide.visibility.conditions;
  if (!conditions.length) return true;
  return slide.visibility.operator === "AND"
    ? conditions.every((c) => matchesCondition(c, context))
    : conditions.some((c) => matchesCondition(c, context));
}
