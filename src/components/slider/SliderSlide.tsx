import {
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent,
} from "react";
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
import type { StoreProduct } from "../../lib/wix/products";
export type LayerPreset = "heading" | "paragraph" | "badge" | "button";
/** Drag payload type for new layers dragged from the editor's "Add to slide" list. */
export const LAYER_DRAG_TYPE = "application/x-slider-layer";
export interface LayerEditing {
  selected?: string;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Layer>) => void;
  onAdd?: (preset: LayerPreset, zone: LayerZone) => void;
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
  load = true,
  preview,
  reduced,
  editing,
  product,
}: {
  slide: Slide;
  device: Device;
  settings: SliderSettings;
  responsive: ResponsiveSettings;
  active: boolean;
  onEvent: (event: AnalyticsEvent["event"]) => void;
  /** False until the slide is near view; its media isn't requested before then. */
  load?: boolean;
  preview: boolean;
  reduced: boolean;
  editing?: LayerEditing;
  /** Already-loaded product data, so the slide doesn't fetch it again. */
  product?: StoreProduct;
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
  const [dropZone, setDropZone] = useState<LayerZone>();
  if (slide.type === "product")
    return (
      <ProductSlide
        slide={slide}
        onEvent={onEvent}
        load={load}
        preview={preview}
        product={product}
      />
    );
  const s = slide.style;
  const heading = s.inheritTypography ? settings.typography.heading : s.heading;
  const description = s.inheritTypography
    ? settings.typography.description
    : s.description;
  const pad = device === "mobile" ? Math.min(s.padding, 24) : s.padding;
  const filters = [
    s.mediaBlur && `blur(${s.mediaBlur}px)`,
    s.mediaBrightness !== 100 && `brightness(${s.mediaBrightness}%)`,
    s.mediaContrast !== 100 && `contrast(${s.mediaContrast}%)`,
    s.mediaSaturation !== 100 && `saturate(${s.mediaSaturation}%)`,
    s.mediaGrayscale && `grayscale(${s.mediaGrayscale}%)`,
  ].filter(Boolean);
  // Blur fades the image edges to transparent; scale up slightly to hide them.
  const zoom = slide.media.zoom * (s.mediaBlur ? 1 + s.mediaBlur / 100 : 1);
  const mediaStyle: CSSProperties = {
    objectFit: slide.media.fit,
    objectPosition: `${slide.media.focalX}% ${slide.media.focalY}%`,
    transform: `scale(${zoom})`,
    borderRadius: slide.media.radius,
    filter: filters.length ? filters.join(" ") : undefined,
    opacity: s.mediaOpacity,
  };
  const panelStyle: CSSProperties = s.panel.enabled
    ? {
        background: `color-mix(in srgb, ${s.panel.color} ${Math.round(s.panel.opacity * 100)}%, transparent)`,
        backdropFilter: `blur(${s.panel.blur}px)`,
        WebkitBackdropFilter: `blur(${s.panel.blur}px)`,
        borderRadius: s.panel.radius,
        padding: s.panel.padding,
      }
    : {};
  const textShadow =
    s.textShadow === "soft"
      ? "0 1px 3px rgba(0,0,0,.35)"
      : s.textShadow === "strong"
        ? "0 2px 12px rgba(0,0,0,.6)"
        : undefined;
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
  const accepts = (e: DragEvent) =>
    !!editing?.onAdd && e.dataTransfer.types.includes(LAYER_DRAG_TYPE);
  const dropProps = editing?.onAdd
    ? {
        onDragOver: (e: DragEvent<HTMLElement>) => {
          if (!accepts(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          const zone = zoneAt(e.clientX, e.clientY);
          if (zone !== dropZone) setDropZone(zone);
        },
        onDragLeave: (e: DragEvent<HTMLElement>) => {
          if (!card.current?.contains(e.relatedTarget as Node | null))
            setDropZone(undefined);
        },
        onDrop: (e: DragEvent<HTMLElement>) => {
          if (!accepts(e)) return;
          e.preventDefault();
          const preset = e.dataTransfer.getData(LAYER_DRAG_TYPE) as LayerPreset;
          const zone = zoneAt(e.clientX, e.clientY);
          setDropZone(undefined);
          if (preset && zone) editing.onAdd?.(preset, zone);
        },
      }
    : {};
  const highlight = drag?.target ?? dropZone;
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
          textShadow,
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
      {...dropProps}
      className="sl-card"
      style={{
        background: s.useGradient
          ? `linear-gradient(${s.gradientAngle}deg,${s.background},${s.gradient})`
          : s.background,
      }}
    >
      {slide.media.url &&
        (slide.type === "video" ? (
          <VideoMedia
            slide={slide}
            active={active}
            load={load}
            style={mediaStyle}
            onEvent={onEvent}
            reduced={reduced}
          />
        ) : (
          <img
            className="sl-media"
            src={load ? slide.media.url : undefined}
            alt={slide.media.alt}
            fetchPriority={active ? "high" : "low"}
            decoding="async"
            style={mediaStyle}
          />
        ))}
      <div
        className="sl-overlay"
        style={{
          background:
            s.overlayType === "gradient"
              ? `linear-gradient(${s.overlayAngle}deg,${s.overlayColor},${s.overlayColor2})`
              : s.overlayColor,
          opacity: s.overlay,
        }}
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
            } ${s.panel.enabled ? "sl-panel" : ""}`}
            style={{
              ...motionStyle,
              ...panelStyle,
              alignItems: horizontal(zone),
            }}
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
      {highlight && editing && (
        <div className="sl-drop-grid" aria-hidden="true">
          {positionSchema.options.map((z) => (
            <span key={z} data-target={highlight === z} />
          ))}
        </div>
      )}
    </article>
  );
}
