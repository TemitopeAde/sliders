import { settingsHelp } from "./settings-help";

export const buttonHelp: Record<string, string> = {
  ...settingsHelp,
  label: "Text shown on the button.",
  url: "Where the button takes visitors. Use an https:// URL or a relative /page path.",
  newTab: "Open the button's link in a new browser tab.",
  background: "Button fill color.",
  color: "Button text color.",
  hoverBackground: "Button fill color while the pointer is over it.",
  hoverColor: "Button text color while the pointer is over it.",
  radius: "How rounded the button's corners are, in pixels.",
  padding: "Space inside the button around its text, in pixels.",
  borderWidth: "Thickness of the button's border, in pixels.",
  borderColor: "Color of the button's border.",
};

export const slideHelp: Record<string, string> = {
  ...settingsHelp,
  title:
    "A name to identify this slide in the editor. Edit visible text in its layers.",
  enabled:
    "Include this slide in the slider. Turn off to hide it without deleting it.",
  "media.url": "The image or video URL used by this slide.",
  "media.alt": "Describe the image for visitors using a screen reader.",
  "media.poster": "An image shown before the video starts playing.",
  "media.fit":
    "Cover fills the slide and may crop; Contain shows the whole image; Fill stretches it.",
  "media.focalX":
    "Horizontal point kept in focus when cropping, from 0% (left) to 100% (right).",
  "media.focalY":
    "Vertical point kept in focus when cropping, from 0% (top) to 100% (bottom).",
  "media.zoom":
    "Enlarge the media. 1 is its normal size; higher values crop more of the image.",
  "media.radius": "How rounded the media's corners are, in pixels.",
  "media.autoplay":
    "Start the video automatically when the slide appears. Browsers usually require muted audio for autoplay.",
  "media.muted": "Play the video without sound.",
  "media.loop": "Restart the video when it reaches the end.",
  "media.controls": "Show the video's playback controls.",
  "media.playsInline":
    "Play the video within the slide on mobile devices instead of requesting fullscreen playback.",
  "media.pauseInactive": "Pause the video when its slide is no longer active.",
  "media.resumeActive": "Resume the video when its slide becomes active again.",
  "style.background": "Background color behind this slide's media and content.",
  "style.useGradient": "Blend the background color into a second color.",
  "style.gradient": "The second color of the slide's background gradient.",
  "style.gradientAngle": "Direction of the background gradient, in degrees.",
  "style.mediaBlur": "Blur the image or video, in pixels. Text stays sharp.",
  "style.mediaOpacity":
    "Media visibility, from 0 (invisible) to 1 (fully visible).",
  "style.mediaBrightness":
    "Media brightness as a percentage. 100 keeps the original brightness.",
  "style.mediaContrast":
    "Media contrast as a percentage. 100 keeps the original contrast.",
  "style.mediaSaturation":
    "Media color intensity as a percentage. 0 removes color; 100 keeps the original colors.",
  "style.mediaGrayscale":
    "How much color to remove, from 0% (original colors) to 100% (black and white).",
  "style.overlay":
    "Strength of the color overlay over the media, from 0 (invisible) to 1 (opaque).",
  "style.overlayType":
    "Cover the media with a single color or a gradient to make text easier to read.",
  "style.overlayColor": "Main color of the overlay over the media.",
  "style.overlayColor2": "Second color of a gradient overlay.",
  "style.overlayAngle": "Direction of the overlay gradient, in degrees.",
  "style.textShadow":
    "Add a shadow behind text to improve its contrast against the background.",
  "style.panel": "Add a frosted background behind text and buttons.",
  "style.panel.enabled": "Show the frosted panel behind the slide's content.",
  "style.panel.color": "Background color of the frosted panel.",
  "style.panel.opacity":
    "Panel visibility, from 0 (transparent) to 1 (opaque).",
  "style.panel.blur": "Blur the background behind the panel, in pixels.",
  "style.panel.radius": "How rounded the panel's corners are, in pixels.",
  "style.panel.padding":
    "Space inside the panel around the content, in pixels.",
  "style.padding":
    "Space kept between the slide edges and its text and buttons, in pixels.",
  "style.position": "Default area of the slide where content sits.",
  "style.offsetX":
    "Horizontal content offset, in pixels. Positive values move right; negative values move left.",
  "style.offsetY":
    "Vertical content offset, in pixels. Positive values move down; negative values move up.",
  "style.contentWidth":
    "Content width as a percentage of the slide's available space.",
  "style.maxContentWidth":
    "The widest the slide's content can grow, in pixels.",
  "style.inheritTypography":
    "Use the slider's default heading and paragraph styles. Turn off to customize them for this slide.",
  "animation.type":
    "How the slide's content enters when the slide becomes active.",
  "animation.duration":
    "How long the entrance animation lasts, in milliseconds.",
  "animation.delay":
    "How long to wait before starting the entrance animation, in milliseconds.",
  "animation.easing":
    "How the animation accelerates and slows down. Linear keeps a constant speed.",
  "responsive.desktop": "Show this slide on desktop screens.",
  "responsive.tablet": "Show this slide on tablet screens.",
  "responsive.mobile": "Show this slide on mobile screens.",
  "responsive.mobileHeadingSize":
    "Heading size on mobile, in pixels, when this slide uses custom typography.",
  "responsive.tabletHeadingSize":
    "Heading size on tablets, in pixels, when this slide uses custom typography.",
  "productFields.image": "Show the product's image.",
  "productFields.name": "Show the product's name.",
  "productFields.description": "Show the product's description.",
  "productFields.price": "Show the product's regular price.",
  "productFields.discountedPrice":
    "Show the sale price when the product has a discount.",
  "productFields.saleBadge": "Show a sale badge for discounted products.",
  "productFields.sku": "Show the product's stock keeping unit (SKU).",
  "productFields.stock": "Show the product's stock status.",
  "productFields.viewProduct": "Show a button linking to the product's page.",
  "productFields.addToCart": "Show an Add to cart button for this product.",
};

export const layerHelp = {
  text: "Text shown on this layer in the slide.",
  variant:
    "Choose heading, paragraph, badge, or price styling for this text layer.",
  zone: "Choose the area of the slide where this layer sits. Layers in the same area stack in list order.",
  offsetX:
    "Move this layer horizontally, in pixels. Positive values move right; negative values move left.",
  offsetY:
    "Move this layer vertically, in pixels. Positive values move down; negative values move up.",
  width: "Width of this text layer as a percentage of its available space.",
  maxWidth: "The widest this text layer can grow, in pixels.",
  inheritTypography:
    "Use the slide's text styles for this layer. Turn off to customize its font, size, and color.",
};

export const visibilityValueHelp: Record<string, string> = {
  page: "Enter the exact page path where this slide should appear, such as /shop.",
  "not-page":
    "Enter the exact page path where this slide should be hidden, such as /checkout.",
  device: "Enter desktop, tablet, or mobile.",
  country:
    "Enter the visitor's two-letter country code, such as US. The slide is hidden if their country is unavailable.",
  day: "Enter day numbers separated by commas: 0 is Sunday and 6 is Saturday. For weekdays, use 1,2,3,4,5.",
  time: "Enter a time range in HH:mm-HH:mm format, such as 09:00-17:00, in the visitor's timezone. Ranges can cross midnight.",
  role: "Enter the exact member role to match. The slide is hidden if role information is unavailable.",
  inventory:
    "Enter in-stock for available products or out-of-stock for unavailable products. Stock information must be available.",
};
