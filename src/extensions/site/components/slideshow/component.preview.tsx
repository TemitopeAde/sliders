// This file is the Editor preview entry point for your component.
// Override or extend it when you need Editor-specific behavior or rendering
// (e.g. mock data, Editor-only interactions, or a different visual state).

import React from "react";
import type { ComponentProps, FC } from "react";
import {
  useIsEditMode,
  withDefaults,
  withFallbackPlaceholder,
} from "@wix/react-component-utils";
import Component from "./slideshow";
import { defaultProps } from "./slideshow.props";

const SlideshowPreview: FC<ComponentProps<typeof Component>> = (props) => {
  const isEditMode = useIsEditMode();
  return (
    <Component
      {...props}
      autoPlay={isEditMode ? false : props.autoPlay}
      pauseButtonVisibility={
        isEditMode ? "showAlways" : props.pauseButtonVisibility
      }
    />
  );
};

const SlideshowPreviewWithFallback = withFallbackPlaceholder(SlideshowPreview, {
  requiredDataFields: ["slides"],
  rootClassName: "slideshow",
});

export default withDefaults(SlideshowPreviewWithFallback, defaultProps);
