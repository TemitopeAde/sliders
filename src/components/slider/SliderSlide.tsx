import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  positionSchema,
  type Slide,
  type Device,
  type SliderSettings,
  type ResponsiveSettings,
  type Layer,
  type LayerZone,
} from "../../schemas/slider";
import type { AnalyticsEvent } from "../../schemas/analytics";
import { VideoMedia } from "./VideoMedia";
import { ProductSlide } from "./ProductSlide";
export interface LayerEditing {
  selected?: string;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Layer>) => void;
}
const horizontal = (z: LayerZone) =>
  z.endsWith("left")
    ? "flex-start"
    : z.endsWith("right")
      ? "flex-end"
      : "center";
const vertical = (z: LayerZone) =>
  z.startsWith("top")
    ? "flex-start"
    : z.startsWith("bottom")
      ? "flex-end"
      : "center";
const textAlign = (z: LayerZone) =>
  z.endsWith("left") ? "left" : z.endsWith("right") ? "right" : "center";
/** Consecutive buttons in a zone sit side by side, like a button row. */
function groupButtons(layers: Layer[]) {
  const groups: Layer[][] = [];
  for (const l of layers) {
    const last = groups.at(-1);
    if (l.kind === "button" && last?.[0]?.kind === "button") last.push(l);
    else groups.push([l]);
  }
  return groups;
}
export function SliderSlideContent({
  slide,
  device,
  settings,
  responsive,
  active,
  onEvent,
  preview,
  reduced,
  editing,
}: {
  slide: Slide;
  device: Device;
  settings: SliderSettings;
  responsive: ResponsiveSettings;
  active: boolean;
  onEvent: (event: AnalyticsEvent["event"]) => void;
  preview: boolean;
  reduced: boolean;
  editing?: LayerEditing;
}) {
  const card = useRef<HTMLElement>(null);
  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
    target: LayerZone;
  }>();
  if (slide.type === "product")
    return <ProductSlide slide={slide} onEvent={onEvent} preview={preview} />;
  const s = slide.style;
  const heading = s.inheritTypography ? settings.typography.heading : s.heading;
  const description = s.inheritTypography
    ? settings.typography.description
    : s.description;
  const pad = device === "mobile" ? Math.min(s.padding, 24) : s.padding;
  const mediaStyle: CSSProperties = {
    objectFit: slide.media.fit,
    objectPosition: `${slide.media.focalX}% ${slide.media.focalY}%`,
    transform: `scale(${slide.media.zoom})`,
    borderRadius: slide.media.radius,
  };
  const motionStyle = {
    "--sl-animation": `sl-${slide.animation.type}`,
    "--sl-duration": `${slide.animation.duration}ms`,
    "--sl-delay": `${slide.animation.delay}ms`,
    "--sl-easing": slide.animation.easing,
  } as CSSProperties;
  const visible = slide.layers.filter((l) => l.devices[device]);
  const zones = positionSchema.options
    .map((z) => [z, visible.filter((l) => l.zone === z)] as const)
    .filter(([, items]) => items.length);
  const scale = device === "mobile" ? 0.65 : device === "tablet" ? 0.8 : 1;
  const typography = (l: Layer): CSSProperties => {
    if (!l.inheritTypography)
      return { ...l.typography, fontSize: l.typography.fontSize * scale };
    if (l.variant === "badge") return settings.typography.badge;
    if (l.variant === "price") return settings.typography.price;
    if (l.variant === "paragraph") return description;
    return {
      ...heading,
      fontSize:
        device === "desktop"
          ? heading.fontSize
          : s.inheritTypography
            ? responsive[device].textSize
            : device === "mobile"
              ? slide.responsive.mobileHeadingSize
              : slide.responsive.tabletHeadingSize,
    };
  };
  const startDrag = (e: PointerEvent<HTMLElement>, layer: Layer) => {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    editing.onSelect(layer._id);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      id: layer._id,
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      dy: 0,
      target: layer.zone,
    });
  };
  const zoneAt = (clientX: number, clientY: number): LayerZone | undefined => {
    const rect = card.current?.getBoundingClientRect();
    if (!rect) return;
    const col = Math.min(
      2,
      Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * 3)),
    );
    const row = Math.min(
      2,
      Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * 3)),
    );
    return positionSchema.options[row * 3 + col];
  };
  const moveDrag = (e: PointerEvent<HTMLElement>) => {
    if (!drag) return;
    setDrag({
      ...drag,
      dx: e.clientX - drag.x,
      dy: e.clientY - drag.y,
      target: zoneAt(e.clientX, e.clientY) ?? drag.target,
    });
  };
  const endDrag = (layer: Layer) => {
    if (!drag || !editing) return;
    setDrag(undefined);
    if (Math.abs(drag.dx) < 3 && Math.abs(drag.dy) < 3) return;
    if (drag.target !== layer.zone)
      editing.onChange(layer._id, {
        zone: drag.target,
        offsetX: 0,
        offsetY: 0,
      });
    else
      editing.onChange(layer._id, {
        offsetX: Math.round(layer.offsetX + drag.dx),
        offsetY: Math.round(layer.offsetY + drag.dy),
      });
  };
  const renderLayer = (l: Layer) => {
    const dragging = drag?.id === l._id;
    const editProps = editing
      ? {
          "data-layer-selected": editing.selected === l._id,
          className: "swiper-no-swiping",
          onPointerDown: (e: PointerEvent<HTMLElement>) => startDrag(e, l),
          onPointerMove: moveDrag,
          onPointerUp: () => endDrag(l),
          onPointerCancel: () => setDrag(undefined),
        }
      : {};
    const position: CSSProperties = {
      transform: `translate(${l.offsetX + (dragging ? drag.dx : 0)}px,${l.offsetY + (dragging ? drag.dy : 0)}px)`,
    };
    if (l.kind === "button") {
      const b = l.button;
      return (
        <a
          key={l._id}
          {...editProps}
          className={`sl-button sl-layer ${editProps.className ?? ""}`}
          href={b.url || undefined}
          role={b.url ? undefined : "button"}
          aria-disabled={!b.url}
          target={b.newTab ? "_blank" : undefined}
          rel={b.newTab ? "noopener noreferrer" : undefined}
          style={
            {
              ...position,
              "--btn-bg": b.background,
              "--btn-color": b.color,
              "--btn-hover-bg": b.hoverBackground,
              "--btn-hover-color": b.hoverColor,
              borderRadius: b.radius,
              padding: `${b.padding}px ${b.padding * 1.5}px`,
              fontSize:
                device === "desktop"
                  ? b.fontSize
                  : responsive[device].buttonSize,
              fontWeight: b.fontWeight,
              border: `${b.borderWidth}px solid ${b.borderColor}`,
            } as CSSProperties
          }
          onClick={(e) => {
            if (preview || !b.url) e.preventDefault();
            else onEvent("cta_click");
          }}
        >
          {l.text}
        </a>
      );
    }
    const Tag =
      l.variant === "heading" ? "h2" : l.variant === "badge" ? "span" : "p";
    return (
      <Tag
        key={l._id}
        {...editProps}
        className={`sl-layer sl-${l.variant} ${editProps.className ?? ""}`}
        style={{
          ...typography(l),
          ...position,
          width: l.variant === "badge" ? undefined : `${l.width}%`,
          maxWidth: l.maxWidth,
        }}
      >
        {l.text}
      </Tag>
    );
  };
  return (
    <article
      ref={card}
      className="sl-card"
      style={{
        background: s.useGradient
          ? `linear-gradient(135deg,${s.background},${s.gradient})`
          : s.background,
      }}
    >
      {slide.media.url &&
        (slide.type === "video" ? (
          <VideoMedia
            slide={slide}
            active={active}
            style={mediaStyle}
            onEvent={onEvent}
            reduced={reduced}
          />
        ) : (
          <img
            className="sl-media"
            src={slide.media.url}
            alt={slide.media.alt}
            loading={active ? "eager" : "lazy"}
            decoding="async"
            style={mediaStyle}
          />
        ))}
      <div
        className="sl-overlay"
        style={{ background: s.overlayColor, opacity: s.overlay }}
      />
      {zones.map(([zone, items]) => (
        <div
          key={zone}
          className="sl-zone"
          style={{
            inset: pad,
            justifyContent: vertical(zone),
            alignItems: horizontal(zone),
            textAlign: textAlign(zone),
          }}
        >
          <div
            key={active ? "active" : "inactive"}
            className={`sl-zone-inner ${
              active && slide.animation.type !== "none" && !editing
                ? "sl-motion"
                : ""
            }`}
            style={{ ...motionStyle, alignItems: horizontal(zone) }}
          >
            {groupButtons(items).map((group) =>
              group.length > 1 || group[0]?.kind === "button" ? (
                <div
                  key={group[0]?._id}
                  className="sl-buttons"
                  style={{ justifyContent: horizontal(zone) }}
                >
                  {group.map(renderLayer)}
                </div>
              ) : (
                group[0] && renderLayer(group[0])
              ),
            )}
          </div>
        </div>
      ))}
      {drag && editing && (
        <div className="sl-drop-grid" aria-hidden="true">
          {positionSchema.options.map((z) => (
            <span key={z} data-target={drag.target === z} />
          ))}
        </div>
      )}
    </article>
  );
}
