import React, { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { createPortal } from "react-dom";
import { useIsEditMode } from "@wix/react-component-utils";
import { Slider } from "../../../../../../components/slider/Slider";
import {
  usePublishedSlider,
  type PublishedSliderError,
} from "../../../../../../hooks/usePublishedSlider";
import styles from "./dashboard-slider.module.css";

const editorMessages: Record<PublishedSliderError, string> = {
  "": "",
  missing: "",
  unpublished:
    "No published slider has this ID. Publish it in the Slideshow Studio dashboard, or check the ID.",
  unavailable: "This slider is temporarily unavailable.",
};

type DashboardSliderProps = { sliderId: string };

/**
 * Shows a slider built in the Slideshow Studio dashboard. The shared Slider ships its
 * own global styles (Swiper), so it renders inside a shadow root, as it does
 * in the custom element widget.
 */
export const DashboardSlider: FC<DashboardSliderProps> = ({ sliderId }) => {
  const isEditMode = useIsEditMode();
  const editModeRef = useRef(isEditMode);
  editModeRef.current = isEditMode;
  const { slider, error, products, context, onEvent } = usePublishedSlider({
    sliderId,
    detectEditor: async () => editModeRef.current,
  });

  const host = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState<HTMLElement>();
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const shadow = el.shadowRoot ?? el.attachShadow({ mode: "open" });
    const target = document.createElement("div");
    target.style.width = "100%";
    target.style.height = "100%";
    shadow.replaceChildren(target);
    setMount(target);
  }, []);

  const message =
    isEditMode || error === "unavailable" ? editorMessages[error] : "";

  return (
    <div className={styles.host}>
      <div ref={host} className={styles.mount} />
      {mount && slider
        ? createPortal(
            <Slider
              slider={slider}
              preview={isEditMode}
              context={context}
              products={products}
              onEvent={onEvent}
            />,
            mount,
          )
        : null}
      {!slider && message ? (
        <p role="status" className={styles.message}>
          {message}
        </p>
      ) : null}
    </div>
  );
};
