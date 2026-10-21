// This file is the Editor preview entry point for your component.
// Override or extend it when you need Editor-specific behavior or rendering
// (e.g. mock data, Editor-only interactions, or a different visual state).

import React from 'react';
import type { ComponentProps, FC } from 'react';
import {
  withDefaults,
  withFallbackPlaceholder,
} from '@wix/react-component-utils';
import Component from './slideshow';
import { defaultProps } from './slideshow.props';

const SlideshowPreview: FC<ComponentProps<typeof Component>> = (props) => {
  return <Component {...props} />;
};

const SlideshowPreviewWithFallback = withFallbackPlaceholder(SlideshowPreview, {
  requiredDataFields: ['title', 'description'],
  rootClassName: 'slideshow',
});

export default withDefaults(
  SlideshowPreviewWithFallback,
  defaultProps
);
