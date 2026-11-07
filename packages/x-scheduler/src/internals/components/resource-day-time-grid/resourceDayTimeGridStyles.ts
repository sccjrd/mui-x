import type { CSSObject, Theme } from '@mui/material/styles';

/**
 * The shadow at the inline end of a sticky element (the time axis or the last pinned column).
 * Use it as a `::after` style. `opacityVariable` is set by `usePinnedColumnsScrollShadow`.
 */
export function getStickyEdgeShadowStyles(
  theme: Theme,
  opacityVariable: '--shadow-opacity' | '--axis-shadow-opacity',
): CSSObject {
  // Gradients have no logical direction, so it follows the theme, like the rest of the scheduler.
  const towardsInlineEnd = theme.direction === 'rtl' ? 'to left' : 'to right';
  const getBackground = (opacity: number) =>
    `linear-gradient(${towardsInlineEnd}, ${theme.alpha((theme.vars || theme).palette.common.black, opacity)}, transparent)`;

  return {
    content: '""',
    position: 'absolute',
    top: 0,
    insetInlineEnd: -8,
    bottom: 0,
    width: 8,
    background: getBackground(0.15),
    pointerEvents: 'none',
    opacity: `var(${opacityVariable}, 0)`,
    transition: 'opacity 0.2s',
    ...theme.applyStyles('dark', {
      background: getBackground(0.4),
    }),
  };
}
