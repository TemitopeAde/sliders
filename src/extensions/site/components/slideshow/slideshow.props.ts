import type { A11y, Direction, Image, Link } from "@wix/editor-react-types";
import type { ActiveItemIndex } from "@wix/react-component-utils";

export type Slide = {
  name: string;
  image: Image;
  title?: string;
  description?: string;
  buttonLabel?: string;
  link?: Link;
};

export type SlideshowProps = {
  id: string;
  className?: string;
  direction?: Direction;
  a11y?: A11y;

  slides: Array<Slide>;
  activeItem: ActiveItemIndex<"slides">;

  /** Start advancing slides on load. Default `true`. */
  autoPlay?: boolean;
  /** Seconds each slide stays on screen while playing. @min 2 @max 20 */
  intervalSeconds?: number;
  /** Return to the first slide after the last one. Default `true`. */
  loop?: boolean;
  /** Show play/pause button. Default `'showOnHover'`. */
  pauseButtonVisibility?: "showAlways" | "showOnHover";

  /**
   * ID of a published slider from the Slideshow Studio dashboard. When set, it is shown
   * instead of the slides above. Left unset until a choice is made, so the
   * slider picker can tell "never chosen" from "chose this page's slides" ("").
   */
  dashboardSliderId?: string;

  elementProps?: {
    title?: { className?: string };
    description?: { className?: string };
    button?: { className?: string };
    navButton?: { className?: string };
    dot?: { className?: string };
    playButton?: { className?: string };
  };
};

export const defaultProps = {
  slides: [
    {
      name: "Slide 1",
      image: {
        url: "https://static.wixstatic.com/media/11062b_2f97b87dcea2446fa48e9ad9c5457ae1~mv2.jpg",
        uri: "11062b_2f97b87dcea2446fa48e9ad9c5457ae1~mv2.jpg",
        alt: "Tropical beach viewed from above",
      },
      title: "Discover something new",
      description: "Tell visitors what makes this worth a look.",
      buttonLabel: "Learn more",
    },
    {
      name: "Slide 2",
      image: {
        url: "https://static.wixstatic.com/media/11062b_73f31c7e7d3544c69dc8ecd8d34c5717~mv2.jpg",
        uri: "11062b_73f31c7e7d3544c69dc8ecd8d34c5717~mv2.jpg",
        alt: "Dead Sea landscape",
      },
      title: "Made for every season",
      description: "Highlight a product, offer, or story.",
      buttonLabel: "Shop now",
    },
    {
      name: "Slide 3",
      image: {
        url: "https://static.wixstatic.com/media/11062b_3682ebfcb08e4da5b3168b62819a1e68~mv2.jpg",
        uri: "11062b_3682ebfcb08e4da5b3168b62819a1e68~mv2.jpg",
        alt: "Palm tree at sunset",
      },
      title: "Stay in the loop",
      description: "Invite visitors to take the next step.",
      buttonLabel: "Get started",
    },
  ],
  activeItem: 0,
  autoPlay: true,
  intervalSeconds: 5,
  loop: true,
  pauseButtonVisibility: "showOnHover",
} as const satisfies Omit<SlideshowProps, "id" | "className">;
