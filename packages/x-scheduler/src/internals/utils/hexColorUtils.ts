import type * as React from 'react';

export function isHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/** Returns '#ffffff' or '#000000' based on relative luminance of the hex color. */
function getContrastColor(hex: string): string {
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = parseInt(full.slice(1, 3), 16) / 255;
  const g = parseInt(full.slice(3, 5), 16) / 255;
  const b = parseInt(full.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? '#000000' : '#ffffff';
}

/**
 * Generates the CSS custom properties equivalent to what getPaletteVariants() sets
 * for named colors, but derived from an arbitrary hex color.
 */
export function getHexColorVars(hex: string): React.CSSProperties {
  const text = getContrastColor(hex);
  return {
    '--event-main': hex,
    '--event-surface-bold': hex,
    '--event-surface-bold-hover': `color-mix(in srgb, ${hex}, black 12%)`,
    '--event-on-surface-bold': text,
    '--event-surface-subtle': `color-mix(in srgb, ${hex}, white 80%)`,
    '--event-surface-subtle-hover': `color-mix(in srgb, ${hex}, white 70%)`,
    '--event-surface-accent': hex,
    '--event-on-surface-subtle-primary': `color-mix(in srgb, ${hex}, black 30%)`,
    '--event-on-surface-subtle-secondary': `color-mix(in srgb, ${hex}, black 15%)`,
    '--event-surface-selected': `color-mix(in srgb, ${hex}, white 35%)`,
    '--event-surface-selected-hover': `color-mix(in srgb, ${hex}, white 20%)`,
    '--event-on-surface-selected': text,
  } as React.CSSProperties;
}
