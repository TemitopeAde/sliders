import { hero } from "./catalog";

// Widget props live in memory; the studio's site preview listens for changes
// so edits in the real settings panel show up on the canvas immediately.
const props = new Map<string, string>([
  ["slider-id", hero._id],
  ["preview-snapshot", JSON.stringify(hero)],
]);
export const propsChanged = "studio-widget-props";
export const readProp = (name: string) => props.get(name) ?? "";

export const widget = {
  async getProp(name: string) {
    return props.get(name);
  },
  async setProp(name: string, value: string) {
    props.set(name, value);
    window.dispatchEvent(new CustomEvent(propsChanged));
  },
};

export const inputs = {
  async selectColor() {},
  async selectFont() {},
};
