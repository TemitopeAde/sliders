import { useEffect, useRef, type CSSProperties } from "react";
import type { Slide } from "../../schemas/slider";
export function VideoMedia({
  slide,
  active,
  style,
  onEvent,
  reduced,
}: {
  slide: Slide;
  active: boolean;
  style: CSSProperties;
  onEvent: (event: "video_play" | "video_pause" | "video_completion") => void;
  reduced: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const loaded = useRef(false);
  if (active) loaded.current = true;
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!active && slide.media.pauseInactive) video.pause();
    else if (
      active &&
      !reduced &&
      (slide.media.autoplay || slide.media.resumeActive)
    )
      void video.play().catch(() => {});
  }, [active, slide.media, reduced]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) ref.current?.pause();
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  return (
    <video
      ref={ref}
      className="sl-media"
      style={style}
      src={loaded.current ? slide.media.url : undefined}
      poster={slide.media.poster || undefined}
      muted={slide.media.muted}
      loop={slide.media.loop}
      controls={slide.media.controls}
      playsInline={slide.media.playsInline}
      preload="none"
      aria-label={slide.media.alt || slide.title}
      onPlay={() => onEvent("video_play")}
      onPause={() => onEvent("video_pause")}
      onEnded={() => onEvent("video_completion")}
    />
  );
}
