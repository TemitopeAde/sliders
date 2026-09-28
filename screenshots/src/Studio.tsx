import { useEffect, useState } from "react";
import App from "../../src/dashboard/App";
import { Slider } from "../../src/components/slider/Slider";
import { collection, hero } from "./catalog";
import "../../src/styles/global.css";

function Site() {
  const wide = {
    ...hero,
    responsiveSettings: {
      ...hero.responsiveSettings,
      desktop: { ...hero.responsiveSettings.desktop, height: 1200 },
    },
  };
  return (
    <div className="min-h-screen bg-white">
      <Slider slider={wide} device="desktop" />
    </div>
  );
}

function Collection() {
  const wide = {
    ...collection,
    settings: { ...collection.settings, effect: "multi-item" as const },
    responsiveSettings: {
      ...collection.responsiveSettings,
      desktop: {
        ...collection.responsiveSettings.desktop,
        height: 860,
        slidesPerView: 3,
        gap: 20,
      },
    },
  };
  return (
    <div className="min-h-screen bg-[#f6f3ee] px-12 py-10">
      <p className="text-[11px] tracking-[0.22em] uppercase text-[#7a7368] mb-3">
        Shop
      </p>
      <h1 className="text-4xl font-medium tracking-tight mb-8">
        Spring collection
      </h1>
      <Slider slider={wide} device="desktop" />
    </div>
  );
}

export default function Studio() {
  const [scene, setScene] = useState("app");
  useEffect(() => {
    setScene(new URLSearchParams(location.search).get("scene") ?? "app");
  }, []);
  if (scene === "site") return <Site />;
  if (scene === "collection") return <Collection />;
  return <App />;
}
