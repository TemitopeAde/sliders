import type { CSSProperties } from "react";
import type {
  Slide,
  Device,
  SliderSettings,
  ResponsiveSettings,
} from "../../schemas/slider";
import type { AnalyticsEvent } from "../../schemas/analytics";
import { VideoMedia } from "./VideoMedia";
import { ProductSlide } from "./ProductSlide";
export function SliderSlideContent({
  slide,
  device,
  settings,
  responsive,
  active,
  onEvent,
  preview,
  reduced,
}: {
  slide: Slide;
  device: Device;
  settings: SliderSettings;
  responsive: ResponsiveSettings;
  active: boolean;
  onEvent: (event: AnalyticsEvent["event"]) => void;
  preview: boolean;
  reduced: boolean;
}) {
  if (slide.type === "product")
    return <ProductSlide slide={slide} onEvent={onEvent} preview={preview} />;
  const s = slide.style;
  const position = s.position;
  const align = position.endsWith("right")
    ? "right"
    : position.endsWith("left")
      ? "left"
      : "center";
  const heading = s.inheritTypography ? settings.typography.heading : s.heading;
  const description = s.inheritTypography
    ? settings.typography.description
    : s.description;
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
  const buttons = [slide.primaryButton, slide.secondaryButton];
  return (
    <article
      className="sl-card"
      style={{
        background: s.useGradient
          ? `linear-gradient(135deg,${s.background},${s.gradient})`
          : s.background,
        alignItems: position.startsWith("top")
          ? "flex-start"
          : position.startsWith("bottom")
            ? "flex-end"
            : "center",
        justifyContent:
          align === "left"
            ? "flex-start"
            : align === "right"
              ? "flex-end"
              : "center",
        padding: device === "mobile" ? Math.min(s.padding, 24) : s.padding,
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
      <div
        className="sl-content"
        style={{
          width: `${s.contentWidth}%`,
          maxWidth: s.maxContentWidth,
          textAlign: align,
          transform: `translate(${s.offsetX}px,${s.offsetY}px)`,
        }}
      >
        <div
          key={active ? "active" : "inactive"}
          className={
            active && slide.animation.type !== "none" ? "sl-motion" : ""
          }
          style={motionStyle}
        >
          {slide.badge && (
            <span className="sl-badge" style={settings.typography.badge}>
              {slide.badge}
            </span>
          )}
          {slide.subtitle && <p style={description}>{slide.subtitle}</p>}
          <h2
            style={{
              ...heading,
              fontSize:
                device === "desktop"
                  ? heading.fontSize
                  : s.inheritTypography
                    ? responsive[device].textSize
                    : device === "mobile"
                      ? slide.responsive.mobileHeadingSize
                      : slide.responsive.tabletHeadingSize,
            }}
          >
            {slide.title}
          </h2>
          {slide.description && <p style={description}>{slide.description}</p>}
          {slide.discount && (
            <p style={settings.typography.price}>{slide.discount}</p>
          )}
          <div
            className="sl-buttons"
            style={{
              justifyContent:
                align === "left"
                  ? "flex-start"
                  : align === "right"
                    ? "flex-end"
                    : "center",
            }}
          >
            {buttons.map(
              (b, i) =>
                b.label && (
                  <a
                    key={i}
                    className="sl-button"
                    href={b.url || undefined}
                    role={b.url ? undefined : "button"}
                    aria-disabled={!b.url}
                    target={b.newTab ? "_blank" : undefined}
                    rel={b.newTab ? "noopener noreferrer" : undefined}
                    style={
                      {
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
                    {b.label}
                  </a>
                ),
            )}
          </div>
          {slide.link && (
            <a
              href={slide.link}
              style={{
                display: "inline-block",
                marginTop: 12,
                color: heading.color,
              }}
              onClick={(e) => {
                if (preview) e.preventDefault();
                else onEvent("cta_click");
              }}
            >
              Learn more →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
