import {
  useEffect,
  useRef,
  useState,
  useMemo,
  type CSSProperties,
} from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectFade, FreeMode, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import swiperCss from "swiper/css?inline";
import fadeCss from "swiper/css/effect-fade?inline";
import css from "./slider.css?inline";
import type { Slider as SliderModel, Device } from "../../schemas/slider";
import type { AnalyticsEvent } from "../../schemas/analytics";
import {
  isSlideVisible,
  type VisibilityContext,
} from "../../lib/slider/visibility";
import { SliderSlideContent } from "./SliderSlide";
export interface SliderProps {
  slider: SliderModel;
  device?: Device;
  preview?: boolean;
  selectedSlide?: string;
  context?: Partial<VisibilityContext>;
  onEvent?: (event: AnalyticsEvent["event"], slideId?: string) => void;
}
export function Slider({
  slider,
  device: forcedDevice,
  preview = false,
  selectedSlide,
  context,
  onEvent,
}: SliderProps) {
  const root = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<Device>(forcedDevice ?? "desktop");
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [swiper, setSwiper] = useState<SwiperInstance>();
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (forcedDevice) {
      setDevice(forcedDevice);
      return;
    }
    const el = root.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 1024;
      setDevice(width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop");
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [forcedDevice]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  const slides = useMemo(
    () =>
      slider.slides.filter((s) =>
        preview
          ? s.enabled && s.responsive[device]
          : isSlideVisible(s, {
              device,
              page: typeof location === "undefined" ? "/" : location.pathname,
              now,
              ...context,
            }),
      ),
    [slider.slides, device, preview, context, now],
  );
  const s = slider.settings;
  const bp = slider.responsiveSettings[device];
  const isFade = s.effect === "fade" || s.effect === "crossfade";
  const perView = isFade
    ? 1
    : Math.min(bp.slidesPerView, Math.max(1, slides.length));
  const loop =
    s.loop && slides.length >= Math.ceil(perView) + bp.slidesPerGroup;
  useEffect(() => {
    if (!swiper || swiper.destroyed || !selectedSlide) return;
    const index = slides.findIndex((v) => v._id === selectedSlide);
    if (index >= 0) {
      if (loop) swiper.slideToLoop(index);
      else swiper.slideTo(index);
    }
  }, [selectedSlide, swiper, slides, loop]);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (preview || !root.current || !onEvent) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          if (!seen.current.has("slider")) {
            onEvent("slider_impression");
            seen.current.add("slider");
          }
          const slide = slides[active];
          if (slide && !seen.current.has(slide._id)) {
            onEvent("slide_impression", slide._id);
            seen.current.add(slide._id);
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [active, onEvent, preview, slides]);
  const emit = (event: AnalyticsEvent["event"], id?: string) => {
    if (!preview) onEvent?.(event, id);
  };
  const navStyle: CSSProperties = {
    width: s.arrowSize,
    height: s.arrowSize,
    fontSize: s.arrowSize * 0.6,
    color: s.arrowColor,
    background: s.arrowBackground,
    borderColor: s.arrowBorder,
    borderRadius: s.arrowRadius,
    opacity: s.arrowOpacity,
  };
  return (
    <div
      ref={root}
      className="sl-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label={slider.name}
      onFocusCapture={() => swiper?.autoplay?.pause()}
      style={{
        width: `${s.width}%`,
        maxWidth: s.maxWidth,
        minHeight: s.minHeight,
        background: s.background,
        border: `${s.borderWidth}px ${s.borderStyle} ${s.borderColor}`,
        borderRadius: s.radius,
        padding: s.padding,
        margin: s.margin,
        boxShadow:
          s.shadow === "none"
            ? "none"
            : s.shadow === "soft"
              ? "0 8px 25px #0001"
              : "0 15px 45px #0003",
      }}
    >
      <style>{swiperCss + fadeCss + css}</style>
      {!slides.length ? (
        <div className="sl-empty">
          {preview
            ? "Your slider is empty. Add a slide to get started."
            : "No active slides."}
        </div>
      ) : (
        <>
          <Swiper
            key={`${device}-${s.effect}-${s.direction}-${loop}-${perView}`}
            modules={[A11y, Autoplay, EffectFade, FreeMode, Keyboard]}
            onSwiper={setSwiper}
            onSlideChange={(v) => setActive(v.realIndex)}
            effect={isFade ? "fade" : "slide"}
            fadeEffect={{ crossFade: s.effect === "crossfade" }}
            freeMode={s.effect === "free-scroll"}
            centeredSlides={s.centered || s.effect === "centered"}
            loop={loop}
            loopAdditionalSlides={s.loopAdditionalSlides}
            slidesPerView={perView}
            slidesPerGroup={Math.min(bp.slidesPerGroup, slides.length)}
            spaceBetween={bp.gap}
            speed={reduced ? 0 : s.speed}
            initialSlide={Math.min(s.initialSlide, slides.length - 1)}
            autoHeight={s.autoHeight}
            direction={s.direction}
            allowTouchMove={s.swipe}
            simulateTouch={s.mouseDrag}
            grabCursor={s.mouseDrag}
            keyboard={{ enabled: s.keyboard, onlyInViewport: true }}
            autoplay={
              s.autoplay && !reduced && !paused
                ? {
                    delay: s.delay,
                    pauseOnMouseEnter: s.pauseOnHover,
                    disableOnInteraction: s.pauseOnInteraction,
                  }
                : false
            }
            style={{ height: bp.height }}
            a11y={{ enabled: true }}
          >
            {slides.map((slide, index) => (
              <SwiperSlide
                key={slide._id}
                aria-label={`${index + 1} of ${slides.length}`}
              >
                <SliderSlideContent
                  slide={slide}
                  device={device}
                  settings={s}
                  responsive={slider.responsiveSettings}
                  active={
                    active === index ||
                    (perView > 1 && index >= active && index < active + perView)
                  }
                  onEvent={(event) => emit(event, slide._id)}
                  preview={preview}
                  reduced={reduced}
                />
              </SwiperSlide>
            ))}
          </Swiper>
          {bp.navigation && slides.length > perView && (
            <>
              <button
                className="sl-nav sl-prev"
                style={navStyle}
                aria-label="Previous slide"
                disabled={!loop && active === 0}
                onClick={() => {
                  swiper?.slidePrev();
                  emit("navigation_click", slides[active]?._id);
                }}
              >
                {s.arrowIcon === "chevron" ? "‹" : "←"}
              </button>
              <button
                className="sl-nav sl-next"
                style={navStyle}
                aria-label="Next slide"
                disabled={!loop && active >= slides.length - Math.ceil(perView)}
                onClick={() => {
                  swiper?.slideNext();
                  emit("navigation_click", slides[active]?._id);
                }}
              >
                {s.arrowIcon === "chevron" ? "›" : "→"}
              </button>
            </>
          )}
          {bp.pagination && s.pagination !== "none" && (
            <div
              className="sl-pagination"
              style={{
                [s.paginationPosition === "top" ? "top" : "bottom"]: 14,
                gap: s.paginationSpacing,
              }}
            >
              {s.pagination === "fraction" ? (
                `${active + 1} / ${slides.length}`
              ) : s.pagination === "progressbar" ? (
                <div className="sl-progress">
                  <span
                    style={{
                      width: `${((active + 1) / slides.length) * 100}%`,
                      background: s.paginationActiveColor,
                    }}
                  />
                </div>
              ) : (
                slides.map((slide, i) => (
                  <button
                    key={slide._id}
                    className="sl-dot"
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === active ? "true" : undefined}
                    style={{
                      width: s.paginationSize,
                      height: s.paginationSize,
                      background:
                        i === active
                          ? s.paginationActiveColor
                          : s.paginationColor,
                    }}
                    onClick={() => {
                      if (loop) swiper?.slideToLoop(i);
                      else swiper?.slideTo(i);
                      emit("pagination_click", slide._id);
                    }}
                  />
                ))
              )}
            </div>
          )}
          {s.autoplay && !reduced && (
            <button
              className="sl-pause"
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              onClick={() => {
                setPaused(!paused);
                if (paused) swiper?.autoplay.start();
                else swiper?.autoplay.stop();
              }}
            >
              {paused ? "▶ Play" : "Ⅱ Pause"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
