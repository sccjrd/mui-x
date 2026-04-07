'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
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
const DEFAULT_MIN_COLUMN_WIDTH = 150;
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
  minWidth:
    'calc(var(--fixed-cell-width) + var(--column-count, 1) * var(--min-column-width))',
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
})({
  width: 'var(--fixed-cell-width)',
  flexShrink: 0,
  position: 'sticky',
  left: 0,
  zIndex: 1, // within the header stacking context (header is already z-index: 3)
  backgroundColor: 'inherit',
});

/**
 * Grid wrapper for the resource column headers.
 * Uses the same column template as the body grid so headers stay aligned with columns.
 */
const ResourceDayTimeGridHeaderCells = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderCells',
})({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(var(--column-count), var(--column-template))',
});

const ResourceDayTimeGridHeaderCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderCell',
})(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1.25),
  borderInlineStart: `1px solid ${(theme.vars || theme).palette.divider}`,
  minHeight: 48,
  overflow: 'hidden',
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
  zIndex: 2, // above grid lines (z-index: 0) so background masks them on the left
  backgroundColor: (theme.vars || theme).palette.background.paper,
}));

const ResourceDayTimeGridTimeAxisCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxisCell',
})(({ theme }) => ({
  height: `calc(100% / ${HOURS_IN_DAY})`,
  lineHeight: `calc(100% / ${HOURS_IN_DAY})`,
  paddingInline: theme.spacing(1),
  textAlign: 'end',
  '&:not(:first-of-type)::after': {
    content: '""',
    position: 'absolute',
    // Start from left: 0 so lines extend across the full scrollable width.
    // The sticky time axis (z-index: 2, with background) sits on top and visually
    // masks the portion of each line that falls under the time axis column.
    left: 0,
    right: 0,
    borderBlockEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
    top: `calc(var(--hour) * var(--hour-height))`,
    zIndex: 0,
  },
}));

const ResourceDayTimeGridTimeAxisText = styled('time', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxisText',
})(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  lineHeight: 'calc(100% / 24)',
  color: (theme.vars || theme).palette.text.secondary,
  whiteSpace: 'nowrap',
}));

/**
 * Grid container for the resource columns.
 * Uses the same column template as the header cells so they stay in sync.
 */
const ResourceDayTimeGridGrid = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridGrid',
})({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(var(--column-count), var(--column-template))',
  position: 'relative',
});

export const ResourceDayTimeGrid = React.forwardRef(function ResourceDayTimeGrid(
  props: ResourceDayTimeGridProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    day,
    className,
    hourHeight = DEFAULT_HOUR_HEIGHT,
    columnWidth,
    minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
    style,
    ...other
  } = props;

  const adapter = useAdapterContext();
  const { classes } = useEventCalendarStyledContext();
  const store = useEventCalendarStoreContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useMergedRefs(forwardedRef, containerRef);

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

  // Build inline style overrides.
  // --min-column-width drives both the scroll threshold and the minmax() floor.
  // --column-template is only overridden when a fixed columnWidth is requested.
  const inlineStyle = {
    ...style,
    '--hour-height': `${hourHeight}px`,
    '--min-column-width': `${columnWidth ?? minColumnWidth}px`,
    ...(columnWidth != null ? { '--column-template': `${columnWidth}px` } : {}),
  } as React.CSSProperties;

  const timeAxis = (
    <ResourceDayTimeGridTimeAxis
      className={classes.resourceDayTimeGridTimeAxis}
      aria-hidden="true"
    >
      {Array.from({ length: HOURS_IN_DAY }, (_, hour) => (
        <ResourceDayTimeGridTimeAxisCell
          className={classes.resourceDayTimeGridTimeAxisCell}
          key={hour}
          style={{ '--hour': hour } as React.CSSProperties}
        >
          <ResourceDayTimeGridTimeAxisText
            className={classes.resourceDayTimeGridTimeAxisText}
            as="time"
          >
            {hour === 0 ? null : formatTime(adapter.setHours(template, hour))}
          </ResourceDayTimeGridTimeAxisText>
        </ResourceDayTimeGridTimeAxisCell>
      ))}
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
        <ResourceDayTimeGridRoot className={classes.resourceDayTimeGridBody}>
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
    '--column-count': resourceGroups.length,
  } as React.CSSProperties;

  return (
    <ResourceDayTimeGridContainer
      ref={handleRef}
      {...other}
      style={inlineStyle}
      className={clsx(className, classes.resourceDayTimeGridContainer)}
    >
      <ResourceDayTimeGridRoot className={classes.resourceDayTimeGridBody}>
        <ResourceDayTimeGridInner
          className={classes.resourceDayTimeGridInner}
          style={columnCountStyle}
        >
          <ResourceDayTimeGridHeader className={classes.resourceDayTimeGridHeader}>
            <ResourceDayTimeGridHeaderAxisCell />
            <ResourceDayTimeGridHeaderCells className={classes.resourceDayTimeGridHeaderCells}>
              {resourceGroups.map(({ resource }) => (
                <ResourceDayTimeGridHeaderCell
                  key={resource.id}
                  className={classes.resourceDayTimeGridHeaderCell}
                >
                  <ResourceDayTimeGridResourceName
                    className={classes.resourceDayTimeGridResourceName}
                  >
                    {resource.title}
                  </ResourceDayTimeGridResourceName>
                </ResourceDayTimeGridHeaderCell>
              ))}
            </ResourceDayTimeGridHeaderCells>
          </ResourceDayTimeGridHeader>

          <ResourceDayTimeGridScrollableContent
            className={classes.resourceDayTimeGridScrollableContent}
            as={CalendarGrid.TimeScrollableContent}
          >
            {timeAxis}

            <ResourceDayTimeGridGrid className={classes.resourceDayTimeGridGrid}>
              {resourceGroups.map(({ resource, occurrences }, index) => (
                <ResourceTimeGridColumn
                  key={resource.id}
                  resource={resource}
                  occurrences={occurrences}
                  day={day}
                  index={index}
                  showCurrentTimeIndicator={showCurrentTimeIndicator && isTodayInView}
                />
              ))}
            </ResourceDayTimeGridGrid>
          </ResourceDayTimeGridScrollableContent>
        </ResourceDayTimeGridInner>
      </ResourceDayTimeGridRoot>
    </ResourceDayTimeGridContainer>
  );
});
