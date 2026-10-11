/** Tooltip text for slider settings, keyed by setting name. Shared by the
 * dashboard's Slider settings panel and the Wix editor widget panel so both
 * explain each option the same way. */
export const settingsHelp: Record<string, string> = {
  // Behavior
  effect:
    "How slides change. Slide moves one at a time; Fade and Crossfade blend slides; Centered keeps the active slide in the middle; Multi-item shows several at once; Free-scroll lets visitors scroll freely.",
  autoplay: "Advance to the next slide automatically.",
  delay:
    "How long each slide stays on screen during autoplay, in milliseconds.",
  speed: "How long the transition between slides takes, in milliseconds.",
  pauseOnHover:
    "Pause autoplay while the visitor's pointer is over the slider.",
  pauseOnInteraction: "Stop autoplay once a visitor swipes or clicks an arrow.",
  loop: "After the last slide, continue from the first one.",
  swipe: "Let visitors change slides by swiping on touch screens.",
  mouseDrag: "Let visitors change slides by dragging with the mouse.",
  keyboard:
    "Let visitors change slides with the arrow keys while the slider is on screen.",
  centered: "Keep the active slide in the middle when several are visible.",
  autoHeight: "Resize the slider to fit each slide's content.",
  direction: "Move slides left and right, or up and down.",
  initialSlide:
    "Which slide is shown first when the page loads. 0 is the first slide, 1 is the second, and so on.",
  loopAdditionalSlides:
    "Extra slide copies kept ready when looping. Raise this if you see gaps at the loop point.",
  // Container
  width: "Slider width as a percentage of the space it's placed in.",
  maxWidth: "The widest the slider can grow, in pixels.",
  minHeight: "The slider never gets shorter than this, in pixels.",
  background: "Color behind the slides, visible in gaps and around padding.",
  borderWidth: "Thickness of the border around the slider, in pixels.",
  borderColor: "Color of the border around the slider.",
  borderStyle: "Solid, dashed or dotted border line.",
  radius: "How rounded the slider's corners are, in pixels.",
  padding: "Space between the slider's edge and its slides, in pixels.",
  margin: "Space around the outside of the slider, in pixels.",
  shadow: "Drop shadow under the slider.",
  // Navigation arrows
  showArrows:
    "Show the previous/next arrows. Turn off to rely on swipe, dots or autoplay.",
  arrowSize: "Width and height of the previous/next arrows, in pixels.",
  arrowIcon: "The symbol drawn inside the arrows.",
  arrowColor: "Color of the arrow symbol.",
  arrowBackground: "Fill color of the arrow buttons.",
  arrowBorder: "Border color of the arrow buttons.",
  arrowRadius: "How rounded the arrow buttons are. 50 or more makes circles.",
  arrowOpacity: "How see-through the arrows are, from 0 (invisible) to 1.",
  arrowPosition: "Place the arrows over the slides or outside them.",
  // Pagination
  showPagination: "Show the dots (or counter/progress bar) under the slides.",
  pagination:
    "The slide indicator: dots, a slide counter, a progress bar, or none.",
  paginationColor: "Color of the inactive dots.",
  paginationActiveColor: "Color of the dot for the current slide.",
  paginationSize: "Size of each dot, in pixels.",
  paginationSpacing: "Space between dots, in pixels.",
  paginationPosition: "Show the indicator above or below the slides.",
  // Typography
  typography:
    "Default text styles for all slides. A slide or layer can override them.",
  heading: "Style for slide headings.",
  description: "Style for paragraph text.",
  badge: "Style for small badge labels.",
  price: "Style for prices on product slides.",
  fontFamily: "Typeface. Inherit uses your site's font.",
  fontSize: "Text size in pixels.",
  fontWeight: "Text thickness, from 100 (thin) to 900 (black).",
  lineHeight: "Space between lines, as a multiple of the text size.",
  letterSpacing: "Extra space between letters, in pixels.",
  color: "Text color.",
  // Products
  collectionId:
    "Fill the slider with products from a Wix Stores collection on the live site.",
  productSort: "Order of products pulled from the collection.",
  syncProducts:
    "Keep product names, prices and images up to date from Wix Stores.",
  // Analytics
  analytics:
    "Record views and clicks for this slider. Visitors with Do Not Track on are never recorded.",
  // Responsive (per device)
  slidesPerView: "How many slides are visible at once on this device.",
  slidesPerGroup: "How many slides move with each arrow click or swipe.",
  gap: "Space between slides, in pixels.",
  height: "Slider height on this device, in pixels.",
  navigation: "Show the previous/next arrows on this device.",
  textSize:
    "Heading size on this device, for slides using the slider's typography.",
  buttonSize: "Button text size on this device, in pixels.",
  alignment: "Default position of slide text on this device.",
  mediaFit:
    "Cover fills the slide and may crop; Contain shows the whole image; Fill stretches it.",
};
/** Responsive settings reuse the same text, except where a key means
 * something different per device. */
export const responsiveHelp: Record<string, string> = {
  ...settingsHelp,
  pagination: "Show the slide indicator on this device.",
};
