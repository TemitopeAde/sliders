import { useEffect, useState } from "react";
import App from "../../src/dashboard/App";
import Panel from "../../src/extensions/site/widgets/slider-carousel/slider-carousel.panel";
import { Slider } from "../../src/components/slider/Slider";
import {
  responsiveSchema,
  settingsSchema,
  sliderSchema,
  type Slider as SliderModel,
} from "../../src/schemas/slider";
import { collection, hero } from "./catalog";
import { propsChanged, readProp } from "./wix-editor";
import "../../src/styles/global.css";

const heroLive: SliderModel = {
  ...hero,
  settings: {
    ...hero.settings,
    autoplay: true,
    delay: 3200,
    effect: "fade",
    maxWidth: 3840,
  },
  responsiveSettings: {
    ...hero.responsiveSettings,
    desktop: { ...hero.responsiveSettings.desktop, height: 640 },
    tablet: { ...hero.responsiveSettings.tablet, height: 520 },
    mobile: { ...hero.responsiveSettings.mobile, height: 520 },
  },
};
const shelf: SliderModel = {
  ...collection,
  settings: {
    ...collection.settings,
    effect: "multi-item",
    autoplay: true,
    delay: 2600,
    maxWidth: 3840,
    typography: {
      ...collection.settings.typography,
      heading: { ...collection.settings.typography.heading, fontSize: 26 },
      description: {
        ...collection.settings.typography.description,
        fontSize: 14,
      },
    },
  },
  responsiveSettings: {
    desktop: {
      ...collection.responsiveSettings.desktop,
      height: 460,
      slidesPerView: 3,
      gap: 20,
    },
    tablet: {
      ...collection.responsiveSettings.tablet,
      height: 400,
      slidesPerView: 2,
      gap: 16,
      textSize: 24,
    },
    mobile: {
      ...collection.responsiveSettings.mobile,
      height: 380,
      slidesPerView: 1,
      gap: 12,
      textSize: 24,
    },
  },
};

/** A storefront page with the widget in context; responsive by width. */
function Site() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#1f1c18]">
      <header className="flex items-center justify-between px-[5vw] py-5">
        <span className="text-xl font-semibold tracking-tight">
          Maison &amp; Co.
        </span>
        <nav className="hidden md:flex gap-8 text-sm text-[#5d574f]">
          <span>Shop</span>
          <span>Living</span>
          <span>Journal</span>
          <span>About</span>
        </nav>
        <span className="text-sm">Cart (2)</span>
      </header>
      <div className="px-[3vw]">
        <Slider slider={heroLive} />
      </div>
      <section className="px-[5vw] pt-14 pb-16">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#7a7368] mb-2">
          Shop
        </p>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-7">
          Spring collection
        </h2>
        <Slider slider={shelf} />
      </section>
    </div>
  );
}

/** The widget as the site editor shows it: canvas plus the real panel. */
function EditorPanel() {
  const [live, setLive] = useState<SliderModel>(hero);
  useEffect(() => {
    const update = () => {
      try {
        const snapshot = readProp("preview-snapshot");
        let next = snapshot ? sliderSchema.parse(JSON.parse(snapshot)) : hero;
        const s = readProp("settings");
        const r = readProp("responsive");
        if (s) next = { ...next, settings: settingsSchema.parse(JSON.parse(s)) };
        if (r)
          next = {
            ...next,
            responsiveSettings: responsiveSchema.parse(JSON.parse(r)),
          };
        setLive(next);
      } catch {
        /* Keep the last valid preview while props are mid-update. */
      }
    };
    update();
    window.addEventListener(propsChanged, update);
    return () => window.removeEventListener(propsChanged, update);
  }, []);
  return (
    <div className="h-screen flex flex-col bg-[#e9ebf0]">
      <div className="h-12 bg-white border-b flex items-center px-4 gap-3 text-xs text-gray-500">
        <span className="font-semibold text-gray-800">Site editor</span>
        <span className="text-gray-300">|</span>
        <span>Home</span>
        <span className="ml-auto rounded-md bg-blue-600 text-white px-3 py-1.5">
          Publish
        </span>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-hidden p-8">
          <div className="bg-[#f6f3ee] rounded-md shadow-sm h-full overflow-hidden">
            <div className="flex items-center justify-between px-10 py-5 text-sm">
              <span className="font-semibold">Maison &amp; Co.</span>
              <span className="text-[#5d574f]">Shop · Living · Journal</span>
            </div>
            <div className="px-6 relative">
              <div className="absolute inset-x-6 -inset-y-1 border-2 border-blue-500 rounded pointer-events-none z-10" />
              <span className="absolute -top-6 left-6 z-10 text-[11px] bg-blue-500 text-white px-2 py-0.5 rounded-t">
                Slide show
              </span>
              <Slider slider={live} device="desktop" preview />
            </div>
          </div>
        </div>
        <div className="w-[300px] bg-white border-l overflow-auto">
          <Panel />
        </div>
      </div>
    </div>
  );
}

export default function Studio() {
  const [scene, setScene] = useState("app");
  useEffect(() => {
    setScene(new URLSearchParams(location.search).get("scene") ?? "app");
  }, []);
  if (scene === "site") return <Site />;
  if (scene === "panel") return <EditorPanel />;
  return <App />;
}
