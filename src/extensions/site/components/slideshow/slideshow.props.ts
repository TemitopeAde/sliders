import type { Image, Direction } from '@wix/editor-react-types';

export type SlideshowProps = {
  id: string;
  className?: string;
  image?: Image;
  title?: string;
  description?: string;
  direction?: Direction;
};

export const defaultProps = {
  title: 'Title',
  description: 'Description goes here',
} as const satisfies Omit<SlideshowProps, 'id' | 'className'>;
