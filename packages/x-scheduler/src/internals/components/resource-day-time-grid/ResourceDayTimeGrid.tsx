'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStore } from '@base-ui/utils/store';
import { CalendarGrid } from '@mui/x-scheduler-headless/calendar-grid';
import { useAdapterContext } from '@mui/x-scheduler-headless/use-adapter-context';
import { useEventCalendarStoreContext } from '@mui/x-scheduler-headless/use-event-calendar-store-context';
import {
  schedulerNowSelectors,
  schedulerOccurrenceSelectors,
} from '@mui/x-scheduler-headless/scheduler-selectors';
import clsx from 'clsx';
import { ResourceDayTimeGridProps } from './ResourceDayTimeGrid.types';
import { ResourceTimeGridColumn } from './ResourceTimeGridColumn';
import { useFormatTime } from '../../hooks/useFormatTime';
import { useEventCalendarStyledContext } from '../../../event-calendar/EventCalendarStyledContext';

const FIXED_CELL_WIDTH = 68;
const DEFAULT_HOUR_HEIGHT = 80;
const DEFAULT_MIN_COLUMN_WIDTH = 200;
const HOURS_IN_DAY = 24;

const ResourceDayTimeGridContainer = styled(CalendarGrid.Root, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridContainer',
})(({ theme }) => ({
  '--fixed-cell-width': `${FIXED_CELL_WIDTH}px`,
  '--hour-height': `${DEFAULT_HOUR_HEIGHT}px`,
  '--min-column-width': `${DEFAULT_MIN_COLUMN_WIDTH}px`,
  '--column-template': `minmax(var(--min-column-width), 1fr)`,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  maxHeight: '100%',
}));

/**
 * Single scroll container for both axes.
 * Horizontal scroll appears when ResourceDayTimeGridInner's min-width exceeds the available width.
 */
const ResourceDayTimeGridRoot = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridRoot',
})({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'auto',
});

/**
 * Flex-column wrapper that enforces a minimum width so horizontal scroll kicks in
 * when columns are too narrow to fit.
 */
const ResourceDayTimeGridInner = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridInner',
})({
  display: 'flex',
  flexDirection: 'column',
  // Triggers horizontal scroll when column count × min-width exceeds available space.
  minWidth: 'calc(var(--fixed-cell-width) + var(--column-count, 1) * var(--min-column-width))',
});

/**
 * Sticky header row that stays at the top as the user scrolls vertically.
 * It rides along with horizontal scroll because it lives inside the scroll container.
 */
const ResourceDayTimeGridHeader = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeader',
})(({ theme }) => ({
  display: 'flex',
  flexShrink: 0,
  borderBlockEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  position: 'sticky',
  top: 0,
  zIndex: 3,
}));

/**
 * The time-axis placeholder in the header — stays pinned to the left corner
 * while columns scroll horizontally beneath it.
 */
const ResourceDayTimeGridHeaderAxisCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderAxisCell',
})(({ theme }) => ({
  width: 'var(--fixed-cell-width)',
  flexShrink: 0,
  position: 'sticky',
  left: 0,
  // z-index 3 — must be above pinned column headers (max z-index 2) so the
  // shadow ::after, which bleeds 8 px to the right, is not hidden behind the
  // first pinned column's opaque background.
  zIndex: 3,
  backgroundColor: 'inherit',
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  // Shadow that fades in on scroll when no column is pinned.
  // Uses --axis-shadow-opacity (distinct from --shadow-opacity) so it is hidden
  // the moment a column is pinned and the column separator shadow takes over.
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: -8,
    bottom: 0,
    width: 8,
    background: `linear-gradient(to right, ${
      theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'
    }, transparent)`,
    pointerEvents: 'none',
    opacity: 'var(--axis-shadow-opacity, 0)',
    transition: 'opacity 0.2s',
  },
}));

/**
 * Grid wrapper for the resource column headers.
 * Uses the same column template as the body grid so headers stay aligned with columns.
 */
const ResourceDayTimeGridHeaderCells = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderCells',
})(({ theme }) => ({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(var(--column-count), var(--column-template))',
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
}));

const ResourceDayTimeGridHeaderCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderCell',
})(({ theme }) => ({
  position: 'relative', // anchor for the absolutely-positioned pin button
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1.25),
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  minHeight: 48,
  // Text truncation is handled by ResourceDayTimeGridResourceName which has
  // its own overflow: hidden / text-overflow: ellipsis.
  // Pinned column header: sticky so the header cell follows the body column.
  '&[data-pinned]': {
    zIndex: 1,
    backgroundColor: (theme.vars || theme).palette.background.paper,
  },
  '&[data-last-pinned]': {
    zIndex: 2,
  },
  '&[data-last-pinned][data-separator-border]': {
    borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  },
  '&[data-last-pinned][data-separator-shadow]::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: -8,
    bottom: 0,
    width: 8,
    background: `linear-gradient(to right, ${
      theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'
    }, transparent)`,
    pointerEvents: 'none',
    opacity: 'var(--shadow-opacity, 0)',
    transition: 'opacity 0.2s',
    zIndex: 1,
  },
  // Reveal the pin button when hovering the cell.
  [`&:hover .MuiEventCalendar-resourceDayTimeGridPinButton,
    &:focus-within .MuiEventCalendar-resourceDayTimeGridPinButton`]: {
    opacity: 1,
  },
}));

/**
 * Small icon button visible on header-cell hover (or always when the column is pinned).
 * Clicking toggles the pinned state for that resource column.
 */
const ResourceDayTimeGridPinButton = styled('button', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridPinButton',
})(({ theme }) => ({
  position: 'absolute',
  top: 4,
  right: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 2,
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  background: 'transparent',
  cursor: 'pointer',
  color: (theme.vars || theme).palette.action.active,
  opacity: 0, // hidden by default, revealed by the header cell :hover rule above
  transition: 'opacity 0.15s, background-color 0.15s',
  '&:hover': {
    backgroundColor: (theme.vars || theme).palette.action.hover,
  },
  '&:focus-visible': {
    outline: `2px solid ${(theme.vars || theme).palette.primary.main}`,
    outlineOffset: 1,
  },
  // Always visible (and coloured) when the column is pinned.
  '&[data-pinned]': {
    opacity: 1,
    color: (theme.vars || theme).palette.primary.main,
  },
}));

const ResourceDayTimeGridResourceName = styled('span', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridResourceName',
})(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
  color: (theme.vars || theme).palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

/**
 * The scrollable time-grid body.
 * overflow is set to visible so the parent ResourceDayTimeGridRoot handles scrollbars.
 */
const ResourceDayTimeGridScrollableContent = styled(CalendarGrid.TimeScrollableContent, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridScrollableContent',
})({
  display: 'flex',
  height: `calc(var(--hour-height) * ${HOURS_IN_DAY})`,
  position: 'relative', // positioning context for ::after grid lines
  overflow: 'visible', // Root handles overflow
});

/**
 * The hour labels column — sticks to the left as the user scrolls horizontally,
 * always covering the left edge of the horizontal grid lines.
 */
const ResourceDayTimeGridTimeAxis = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxis',
})(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  width: 'var(--fixed-cell-width)',
  position: 'sticky',
  left: 0,
  // z-index 2 — above the isolated grid (z-index: auto) so the background
  // masks grid lines on the left and the shadow ::after renders on top of columns.
  zIndex: 2,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  // Same shadow as the header axis cell — uses --axis-shadow-opacity so it
  // disappears when a column is pinned and the column separator takes over.
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: -8,
    bottom: 0,
    width: 8,
    background: `linear-gradient(to right, ${
      theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'
    }, transparent)`,
    pointerEvents: 'none',
    opacity: 'var(--axis-shadow-opacity, 0)',
    transition: 'opacity 0.2s',
  },
}));

const ResourceDayTimeGridTimeAxisCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxisCell',
})(({ theme }) => ({
  // Height driven by --slot-height so changing slotDuration automatically
  // adjusts the label row height to match the grid-line spacing.
  height: 'var(--slot-height)',
  // overflow: visible lets the <time> text straddle the grid line without
  // being clipped by the cell boundary.
  overflow: 'visible',
  paddingInline: theme.spacing(1),
  textAlign: 'end',
  // Minor slots (sub-hour marks) render at reduced opacity so hour labels
  // remain visually dominant.
  '&[data-minor] time': {
    opacity: 0.5,
  },
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
}));

const ResourceDayTimeGridTimeAxisText = styled('time', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxisText',
})(({ theme }) => ({
  // display: block is required for transform to apply to an inline element.
  display: 'block',
  fontSize: theme.typography.caption.fontSize,
  lineHeight: theme.typography.caption.lineHeight,
  color: (theme.vars || theme).palette.text.secondary,
  whiteSpace: 'nowrap',
  // Shift the text upward by half its own height so its vertical center sits
  // exactly on the grid line (= the top edge of the parent cell).
  // This is the standard calendar time-label positioning technique used by
  // Google Calendar and similar UIs.
  transform: 'translateY(-50%)',
}));

/**
 * Grid container for the resource columns.
 * Uses the same column template as the header cells so they stay in sync.
 *
 * Layer order (bottom → top):
 *  0. Horizontal grid lines — drawn per-column via background-image on
 *     ResourceDayTimeGridColumn so they appear in pinned columns too.
 *  1. Events inside each column (contained by each column's isolation context).
 *  2. Time axis column (z-index: 2 in the parent context, above this entire grid).
 *
 * `isolation: isolate` creates a self-contained stacking context for the grid so
 * that pinned columns (z-index: 1) are guaranteed to be above non-pinned columns
 * (z-index: auto), while the time axis above remains unaffected.
 */
const ResourceDayTimeGridGrid = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridGrid',
})({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(var(--column-count), var(--column-template))',
  position: 'relative',
  // Self-contained stacking context: pinned columns (z-index:1) paint above
  // non-pinned (z-index:auto), and the time axis remains above the whole grid.
  isolation: 'isolate',
  // Grid lines are on individual columns — no background-image here.
});

export const ResourceDayTimeGrid = React.forwardRef(function ResourceDayTimeGrid(
  props: ResourceDayTimeGridProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    day,
    className,
    hourHeight = DEFAULT_HOUR_HEIGHT,
    slotDuration = 60,
    columnWidth,
    minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
    defaultScrollToHour = 0,
    pinnedResourceIds: pinnedResourceIdsProp,
    defaultPinnedResourceIds,
    onPinnedResourceIdsChange,
    pinnedColumnsSectionSeparator = 'border-and-shadow',
    style,
    ...other
  } = props;

  const adapter = useAdapterContext();
  const { classes } = useEventCalendarStyledContext();
  const store = useEventCalendarStoreContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useMergedRefs(forwardedRef, containerRef);

  // Ref for the scroll container (handles initial scroll + shadow tracking).
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Capture the initial prop values in refs so the layout effect below has a
  // genuinely empty dependency array without needing an eslint-disable comment.
  // Refs are stable objects and are not reactive — reading ref.current inside
  // the effect gives the mount-time values, which is the correct uncontrolled
  // initial-value semantics (same as defaultValue on <input>).
  const initialScrollToHourRef = React.useRef(defaultScrollToHour);
  const initialHourHeightRef = React.useRef(hourHeight);

  // Scroll to the requested hour before the first paint so there is no visible jump.
  useIsoLayoutEffect(() => {
    if (scrollRef.current && initialScrollToHourRef.current > 0) {
      scrollRef.current.scrollTop = initialScrollToHourRef.current * initialHourHeightRef.current;
    }
  }, []);

  // ── Pinned columns state ────────────────────────────────────────────────────
  // Supports controlled (pinnedResourceIds prop) and uncontrolled (internal state)
  // patterns, mirroring the DataGrid pinnedColumns API.
  const [internalPinnedIds, setInternalPinnedIds] = React.useState<string[]>(
    () => defaultPinnedResourceIds ?? [],
  );
  const isControlled = pinnedResourceIdsProp !== undefined;
  const activePinnedIds = isControlled ? pinnedResourceIdsProp : internalPinnedIds;

  const handlePinToggle = React.useCallback(
    (resourceId: string) => {
      const next = activePinnedIds.includes(resourceId)
        ? activePinnedIds.filter((id) => id !== resourceId)
        : [...activePinnedIds, resourceId];
      if (!isControlled) {
        setInternalPinnedIds(next);
      }
      onPinnedResourceIdsChange?.(next);
    },
    [activePinnedIds, isControlled, onPinnedResourceIdsChange],
  );

  // ── Separator shadow on scroll ──────────────────────────────────────────────
  const showSeparatorBorder = pinnedColumnsSectionSeparator !== 'shadow';
  const showSeparatorShadow = pinnedColumnsSectionSeparator !== 'border';
  // Derived here (before the effect) so it can be used as a dependency.
  const pinnedCount = activePinnedIds.length;

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || !showSeparatorShadow) {
      return undefined;
    }
    const onScroll = () => {
      const isScrolled = el.scrollLeft > 0;
      const hasPinned = pinnedCount > 0;
      // --shadow-opacity: drives the last-pinned column separator shadow.
      // Only meaningful when columns are actually pinned.
      el.style.setProperty('--shadow-opacity', isScrolled && hasPinned ? '1' : '0');
      // --axis-shadow-opacity: drives the time-axis shadow (header corner + body).
      // Shows when scrolled and NO column is pinned — the moment a column is
      // pinned its separator shadow takes over, so the axis shadow is hidden.
      el.style.setProperty('--axis-shadow-opacity', isScrolled && !hasPinned ? '1' : '0');
    };
    // Sync immediately so the shadow updates as soon as a column is pinned/unpinned,
    // without waiting for the next scroll event.
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [showSeparatorShadow, pinnedCount]);

  const now = useStore(store, schedulerNowSelectors.nowUpdatedEveryMinute);
  const showCurrentTimeIndicator = useStore(store, schedulerNowSelectors.showCurrentTimeIndicator);

  const start = React.useMemo(() => adapter.startOfDay(day.value), [adapter, day]);
  const end = React.useMemo(() => adapter.endOfDay(day.value), [adapter, day]);

  const resourceGroups = useStore(
    store,
    schedulerOccurrenceSelectors.groupedByResourceList,
    start,
    end,
  );

  const isTodayInView = React.useMemo(
    () => adapter.isWithinRange(now, [start, end]),
    [adapter, now, start, end],
  );

  const formatTime = useFormatTime();
  const template = adapter.date('2020-01-01T00:00:00', 'default');

  // ── Slot sizing ────────────────────────────────────────────────────────────
  // slotsPerHour: e.g. 2 for 30-min slots, 4 for 15-min slots.
  // totalSlots:   total number of time cells in the day (48 for 30-min).
  // slotHeight:   pixel height of each slot cell (hourHeight / slotsPerHour).
  const slotsPerHour = 60 / slotDuration;
  const totalSlots = HOURS_IN_DAY * slotsPerHour;
  const slotHeight = hourHeight / slotsPerHour;

  // Build inline style overrides.
  // --min-column-width drives both the scroll threshold and the minmax() floor.
  // --column-template is only overridden when a fixed columnWidth is requested.
  // --slot-height is consumed by the time-axis cells and the column grid-line gradient.
  const inlineStyle = {
    ...style,
    '--hour-height': `${hourHeight}px`,
    '--slot-height': `${slotHeight}px`,
    '--min-column-width': `${columnWidth ?? minColumnWidth}px`,
    ...(columnWidth != null ? { '--column-template': `${columnWidth}px` } : {}),
  } as React.CSSProperties;

  // ── Pinned column helpers ───────────────────────────────────────────────────
  // Column width used to compute sticky `left` offsets.
  // Falls back to minColumnWidth; accurate when columnWidth is explicitly set.
  const effectiveColumnWidth = columnWidth ?? minColumnWidth;

  // Sort groups so pinned columns appear first (they are rendered in the same
  // CSS grid — reordering keeps the header and body grids in sync).
  const sortedResourceGroups = React.useMemo(() => {
    const pinned = resourceGroups.filter((g) => activePinnedIds.includes(g.resource.id));
    const scrollable = resourceGroups.filter((g) => !activePinnedIds.includes(g.resource.id));
    return [...pinned, ...scrollable];
  }, [resourceGroups, activePinnedIds]);

  const timeAxis = (
    <ResourceDayTimeGridTimeAxis className={classes.resourceDayTimeGridTimeAxis} aria-hidden="true">
      {Array.from({ length: totalSlots }, (_, slot) => {
        const hour = Math.floor(slot / slotsPerHour);
        const minute = (slot % slotsPerHour) * slotDuration;
        // Minor slot = any slot that is not on the hour (e.g. :30 marks).
        const isMinor = minute !== 0;
        return (
          <ResourceDayTimeGridTimeAxisCell
            className={classes.resourceDayTimeGridTimeAxisCell}
            key={slot}
            data-minor={isMinor || undefined}
          >
            <ResourceDayTimeGridTimeAxisText
              className={classes.resourceDayTimeGridTimeAxisText}
              as="time"
            >
              {slot === 0
                ? null
                : formatTime(adapter.setMinutes(adapter.setHours(template, hour), minute))}
            </ResourceDayTimeGridTimeAxisText>
          </ResourceDayTimeGridTimeAxisCell>
        );
      })}
    </ResourceDayTimeGridTimeAxis>
  );

  if (resourceGroups.length === 0) {
    return (
      <ResourceDayTimeGridContainer
        ref={handleRef}
        {...other}
        style={inlineStyle}
        className={clsx(className, classes.resourceDayTimeGridContainer)}
      >
        <ResourceDayTimeGridRoot ref={scrollRef} className={classes.resourceDayTimeGridBody}>
          <ResourceDayTimeGridInner className={classes.resourceDayTimeGridInner}>
            <ResourceDayTimeGridScrollableContent
              className={classes.resourceDayTimeGridScrollableContent}
              as={CalendarGrid.TimeScrollableContent}
            >
              {timeAxis}
            </ResourceDayTimeGridScrollableContent>
          </ResourceDayTimeGridInner>
        </ResourceDayTimeGridRoot>
      </ResourceDayTimeGridContainer>
    );
  }

  const columnCountStyle = {
    '--column-count': sortedResourceGroups.length,
  } as React.CSSProperties;

  return (
    <ResourceDayTimeGridContainer
      ref={handleRef}
      {...other}
      style={inlineStyle}
      className={clsx(className, classes.resourceDayTimeGridContainer)}
    >
      <ResourceDayTimeGridRoot ref={scrollRef} className={classes.resourceDayTimeGridBody}>
        <ResourceDayTimeGridInner
          className={classes.resourceDayTimeGridInner}
          style={columnCountStyle}
        >
          <ResourceDayTimeGridHeader className={classes.resourceDayTimeGridHeader}>
            <ResourceDayTimeGridHeaderAxisCell />
            <ResourceDayTimeGridHeaderCells className={classes.resourceDayTimeGridHeaderCells}>
              {sortedResourceGroups.map(({ resource }, gridIndex) => {
                const isPinned = activePinnedIds.includes(resource.id);
                const isLastPinned = isPinned && gridIndex === pinnedCount - 1;
                // Sticky left offset: fixed-cell-width + accumulated pinned column widths.
                const pinnedLeft = isPinned
                  ? FIXED_CELL_WIDTH + gridIndex * effectiveColumnWidth
                  : undefined;
                return (
                  <ResourceDayTimeGridHeaderCell
                    key={resource.id}
                    className={classes.resourceDayTimeGridHeaderCell}
                    data-pinned={isPinned || undefined}
                    data-last-pinned={isLastPinned || undefined}
                    data-separator-border={(isLastPinned && showSeparatorBorder) || undefined}
                    data-separator-shadow={(isLastPinned && showSeparatorShadow) || undefined}
                    style={isPinned ? { position: 'sticky', left: pinnedLeft } : undefined}
                  >
                    <ResourceDayTimeGridResourceName
                      className={classes.resourceDayTimeGridResourceName}
                    >
                      {resource.title}
                    </ResourceDayTimeGridResourceName>
                    <ResourceDayTimeGridPinButton
                      className={classes.resourceDayTimeGridPinButton}
                      data-pinned={isPinned || undefined}
                      aria-label={isPinned ? `Unpin ${resource.title}` : `Pin ${resource.title}`}
                      aria-pressed={isPinned}
                      onClick={() => handlePinToggle(resource.id)}
                    >
                      <PushPinIcon sx={{ fontSize: 14 }} />
                    </ResourceDayTimeGridPinButton>
                  </ResourceDayTimeGridHeaderCell>
                );
              })}
            </ResourceDayTimeGridHeaderCells>
          </ResourceDayTimeGridHeader>

          <ResourceDayTimeGridScrollableContent
            className={classes.resourceDayTimeGridScrollableContent}
            as={CalendarGrid.TimeScrollableContent}
          >
            {timeAxis}

            <ResourceDayTimeGridGrid className={classes.resourceDayTimeGridGrid}>
              {sortedResourceGroups.map(({ resource, occurrences }, gridIndex) => {
                const isPinned = activePinnedIds.includes(resource.id);
                const isLastPinned = isPinned && gridIndex === pinnedCount - 1;
                const pinnedLeft = isPinned
                  ? FIXED_CELL_WIDTH + gridIndex * effectiveColumnWidth
                  : undefined;
                return (
                  <ResourceTimeGridColumn
                    key={resource.id}
                    resource={resource}
                    occurrences={occurrences}
                    day={day}
                    index={gridIndex}
                    showCurrentTimeIndicator={showCurrentTimeIndicator && isTodayInView}
                    isPinned={isPinned}
                    isLastPinned={isLastPinned}
                    pinnedLeft={pinnedLeft}
                    showSeparatorBorder={showSeparatorBorder}
                    showSeparatorShadow={showSeparatorShadow}
                  />
                );
              })}
            </ResourceDayTimeGridGrid>
          </ResourceDayTimeGridScrollableContent>
        </ResourceDayTimeGridInner>
      </ResourceDayTimeGridRoot>
    </ResourceDayTimeGridContainer>
  );
});
