import type { CSSObject, Theme } from '@mui/material/styles';

/**
 * The shadow at the inline end of a sticky element (the time axis or the last pinned column).
 * Use it as a `::after` style. `opacityVariable` is set by `usePinnedColumnsScrollShadow`.
 */
export function getStickyEdgeShadowStyles(
  theme: Theme,
  opacityVariable: '--shadow-opacity' | '--axis-shadow-opacity',
): CSSObject {
  const shadowColor = (opacity: number) =>
    theme.alpha((theme.vars || theme).palette.common.black, opacity);

  return {
    content: '""',
    position: 'absolute',
    top: 0,
    right: -8,
    bottom: 0,
    width: 8,
    background: `linear-gradient(to right, ${shadowColor(0.15)}, transparent)`,
    pointerEvents: 'none',
    opacity: `var(${opacityVariable}, 0)`,
    transition: 'opacity 0.2s',
    ...theme.applyStyles('dark', {
      background: `linear-gradient(to right, ${shadowColor(0.4)}, transparent)`,
    }),
  };
}
