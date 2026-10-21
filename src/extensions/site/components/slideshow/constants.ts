export const ARIA_LABELS = {
  carousel: "Slideshow",
  slide: "slide",
  previous: "Previous slide",
  next: "Next slide",
  pagination: "Choose a slide",
  goTo: "Go to slide",
  playButton: "Play slideshow",
  pauseButton: "Pause slideshow",
} as const;

export const slideLabel = (index: number, total: number) =>
  `${index + 1} of ${total}`;
