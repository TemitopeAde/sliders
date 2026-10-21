import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { FC, KeyboardEvent } from "react";
import classNames from "classnames";
import {
  useLanguageDirection,
  useReducedMotion,
} from "@wix/react-component-utils";
import styles from "./slideshow.module.css";
import type { SlideshowProps } from "./slideshow.props";
import { ARIA_LABELS, slideLabel } from "./constants";
import {
  nearbySlides,
  useLoadedSlides,
  useNearViewport,
} from "../../../../lib/slider/lazy-load";

// Loaded only when a dashboard slider is chosen, so authored slideshows don't
// download the dashboard renderer.
const DashboardSlider = lazy(() =>
  import("./components/dashboard-slider/dashboard-slider").then((m) => ({
    default: m.DashboardSlider,
  })),
);

const clamp = (index: number, count: number) =>
  Math.min(Math.max(index, 0), Math.max(count - 1, 0));

// React 18 doesn't type `inert`; an empty string renders the boolean attribute.
const inert = (hidden: boolean) =>
  hidden ? ({ inert: "" } as Record<string, string>) : {};

const ChevronIcon: FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M9 5l7 7-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlayIcon: FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </svg>
);

const PauseIcon: FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
    <rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
  </svg>
);

const Slideshow: FC<SlideshowProps> = ({
  id,
  className,
  direction,
  a11y,
  slides,
  activeItem,
  autoPlay,
  intervalSeconds,
  loop,
  pauseButtonVisibility,
  dashboardSliderId,
  elementProps,
}) => {
  const count = slides.length;
  const reducedMotion = useReducedMotion();
  const siteDirection = useLanguageDirection();
  const isRtl = (direction ?? siteDirection) === "rtl";

  const [current, setCurrent] = useState(() => clamp(activeItem, count));
  const [isPlaying, setIsPlaying] = useState(
    (autoPlay ?? true) && !reducedMotion,
  );
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // Pausing on hover, and on focus inside a slide, isn't an interaction of its
  // own, so it is wired as listeners rather than element handlers.
  useEffect(() => {
    const rootEl = root.current;
    const trackEl = track.current;
    if (!rootEl || !trackEl) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    const focusIn = () => setFocused(true);
    const focusOut = (event: FocusEvent) => {
      if (!trackEl.contains(event.relatedTarget as Node | null))
        setFocused(false);
    };
    rootEl.addEventListener("pointerenter", enter);
    rootEl.addEventListener("pointerleave", leave);
    trackEl.addEventListener("focusin", focusIn);
    trackEl.addEventListener("focusout", focusOut);
    return () => {
      rootEl.removeEventListener("pointerenter", enter);
      rootEl.removeEventListener("pointerleave", leave);
      trackEl.removeEventListener("focusin", focusIn);
      trackEl.removeEventListener("focusout", focusOut);
    };
  }, []);

  // The editor's slide selector and Aria change activeItem to jump to a slide.
  useEffect(() => {
    setCurrent(clamp(activeItem, count));
  }, [activeItem, count]);

  useEffect(() => {
    setIsPlaying((autoPlay ?? true) && !reducedMotion);
  }, [autoPlay]);

  // Never restart on its own: the visitor may have paused on purpose.
  useEffect(() => {
    if (reducedMotion) setIsPlaying(false);
  }, [reducedMotion]);

  // The first slide's image is always in the page; the others load once the
  // slideshow nears the viewport, and only the current slide and its neighbours.
  const initial = useRef(clamp(activeItem, count)).current;
  const inView = useNearViewport(root);
  const loaded = useLoadedSlides(
    slides.map((_, index) => String(index)),
    nearbySlides(current, count, 1, !!loop),
    inView,
  );

  const atEnd = current >= count - 1;
  const canGoNext = loop || !atEnd;
  const canGoPrevious = loop || current > 0;

  useEffect(() => {
    if (!isPlaying || hovered || focused || count < 2 || dashboardSliderId)
      return;
    if (!loop && atEnd) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(
      () => setCurrent((index) => (index + 1) % count),
      (intervalSeconds ?? 5) * 1000,
    );
    return () => clearTimeout(timer);
  }, [
    isPlaying,
    hovered,
    focused,
    current,
    count,
    loop,
    atEnd,
    intervalSeconds,
    dashboardSliderId,
  ]);

  const goTo = (index: number) => setCurrent((index + count) % count);
  const goNext = () => canGoNext && goTo(current + 1);
  const goPrevious = () => canGoPrevious && goTo(current - 1);

  const onDotKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const forward = isRtl ? "ArrowLeft" : "ArrowRight";
    const back = isRtl ? "ArrowRight" : "ArrowLeft";
    const target =
      event.key === forward
        ? current + 1
        : event.key === back
          ? current - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : undefined;
    if (target === undefined) return;
    event.preventDefault();
    const next = (target + count) % count;
    goTo(next);
    const dots = event.currentTarget.parentElement?.querySelectorAll("button");
    dots?.[next]?.focus();
  };

  return (
    <section
      id={id}
      dir={direction}
      className={classNames(
        "slideshow",
        styles.root,
        styles.fallbackDirection,
        className,
      )}
      aria-roledescription="carousel"
      aria-label={a11y?.ariaLabel ?? ARIA_LABELS.carousel}
      data-pause-button-visibility={pauseButtonVisibility ?? "showOnHover"}
      ref={root}
    >
      {/* The authored slides always render so the editor can find every part;
          a dashboard slider covers them when one is chosen. */}
      <div
        className={styles.native}
        aria-hidden={dashboardSliderId ? true : undefined}
        {...inert(!!dashboardSliderId)}
      >
        <div
          className={styles.track}
          aria-live={isPlaying ? "off" : "polite"}
          ref={track}
        >
          {slides.map((slide, index) => {
            const active = index === current;
            const href = slide.link?.href;
            const buttonClass = classNames(
              "slideshow-button",
              styles.button,
              elementProps?.button?.className,
            );
            return (
              <div
                key={`${slide.name}-${index}`}
                role="group"
                aria-roledescription={ARIA_LABELS.slide}
                aria-label={slideLabel(index, count)}
                aria-hidden={!active}
                {...inert(!active)}
                className={classNames(
                  styles.slide,
                  active && styles.slideActive,
                )}
              >
                {slide.image?.url ? (
                  <img
                    className={styles.image}
                    src={
                      index === initial || loaded.has(String(index))
                        ? slide.image.url
                        : undefined
                    }
                    alt={slide.image.alt ?? ""}
                    loading={index === initial ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : null}
                <div className={styles.content}>
                  {slide.title ? (
                    <h2
                      {...elementProps?.title}
                      className={classNames(
                        "slideshow-title",
                        styles.title,
                        elementProps?.title?.className,
                      )}
                    >
                      {slide.title}
                    </h2>
                  ) : null}
                  {slide.description ? (
                    <p
                      {...elementProps?.description}
                      className={classNames(
                        "slideshow-description",
                        styles.description,
                        elementProps?.description?.className,
                      )}
                    >
                      {slide.description}
                    </p>
                  ) : null}
                  {slide.buttonLabel && href ? (
                    <a
                      {...elementProps?.button}
                      className={buttonClass}
                      href={href}
                      target={slide.link?.target}
                      rel={
                        slide.link?.rel ??
                        (slide.link?.target === "_blank"
                          ? "noopener noreferrer"
                          : undefined)
                      }
                    >
                      {slide.buttonLabel}
                    </a>
                  ) : slide.buttonLabel ? (
                    <span {...elementProps?.button} className={buttonClass}>
                      {slide.buttonLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              {...elementProps?.navButton}
              className={classNames(
                "slideshow-nav-button",
                styles.navButton,
                styles.previous,
                elementProps?.navButton?.className,
              )}
              aria-label={ARIA_LABELS.previous}
              disabled={!canGoPrevious}
              onClick={goPrevious}
            >
              <ChevronIcon />
            </button>
            <button
              type="button"
              {...elementProps?.navButton}
              className={classNames(
                "slideshow-nav-button",
                styles.navButton,
                styles.next,
                elementProps?.navButton?.className,
              )}
              aria-label={ARIA_LABELS.next}
              disabled={!canGoNext}
              onClick={goNext}
            >
              <ChevronIcon />
            </button>

            <div className={styles.controls}>
              <button
                type="button"
                {...elementProps?.playButton}
                className={classNames(
                  "slideshow-play-button",
                  styles.playButton,
                  elementProps?.playButton?.className,
                )}
                aria-label={
                  isPlaying ? ARIA_LABELS.pauseButton : ARIA_LABELS.playButton
                }
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <div
                className={styles.dots}
                role="group"
                aria-label={ARIA_LABELS.pagination}
              >
                {slides.map((slide, index) => (
                  <button
                    key={`${slide.name}-${index}`}
                    type="button"
                    {...elementProps?.dot}
                    className={classNames(
                      "slideshow-dot",
                      styles.dot,
                      index === current && "slideshow-dot--active",
                      elementProps?.dot?.className,
                    )}
                    aria-label={`${ARIA_LABELS.goTo} ${index + 1}`}
                    aria-current={index === current ? "true" : undefined}
                    tabIndex={index === current ? 0 : -1}
                    onClick={() => goTo(index)}
                    onKeyDown={onDotKeyDown}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
      {dashboardSliderId ? (
        <Suspense fallback={<div className={styles.dashboardFallback} />}>
          <DashboardSlider sliderId={dashboardSliderId} />
        </Suspense>
      ) : null}
    </section>
  );
};

export default Slideshow;
