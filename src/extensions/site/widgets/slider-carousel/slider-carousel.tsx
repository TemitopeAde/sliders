import { createRoot, type Root } from "react-dom/client";
import { Widget } from "./Widget";
export default class SliderCarousel extends HTMLElement {
  private root: Root | undefined;
  static get observedAttributes() {
    return ["slider-id", "settings", "responsive", "preview-snapshot"];
  }
  connectedCallback() {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    if (!this.root) {
      const mount = document.createElement("div");
      mount.style.width = "100%";
      shadow.append(mount);
      this.root = createRoot(mount);
    }
    this.render();
  }
  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
    this.shadowRoot?.replaceChildren();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }
  private render() {
    this.root?.render(
      <Widget
        sliderId={this.getAttribute("slider-id") ?? ""}
        settings={this.getAttribute("settings") ?? ""}
        responsive={this.getAttribute("responsive") ?? ""}
        previewSnapshot={this.getAttribute("preview-snapshot") ?? ""}
      />,
    );
  }
}
