'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStore } from '@base-ui/utils/store';
import { CalendarGrid } from '@mui/x-scheduler-internals/calendar-grid';
import { useEventCalendarStoreContext } from '@mui/x-scheduler-internals/use-event-calendar-store-context';
import {
  schedulerNowSelectors,
  schedulerOccurrenceSelectors,
  schedulerOtherSelectors,
} from '@mui/x-scheduler-internals/scheduler-selectors';
import {
  getDayNumber,
  getDisplayedHourRange,
  getEndOfDayMs,
  getInitialScrollTime,
} from '@mui/x-scheduler-internals/internals';
import clsx from 'clsx';
import type { ResourceDayTimeGridProps } from './ResourceDayTimeGrid.types';
import { getSlotDuration } from './getSlotDuration';
import { ResourceDayTimeGridHeader } from './ResourceDayTimeGridHeader';
import { ResourceDayTimeGridTimeAxis } from './ResourceDayTimeGridTimeAxis';
import { ResourceTimeGridColumn } from './ResourceTimeGridColumn';
import { usePinnedColumnsScrollShadow, usePinnedResources } from './usePinnedResources';
import { useEventEditingContext } from '../event-editing';
import { useDisarmOnOutsidePointer } from '../armed-occurrence';
import { useEventCalendarStyledContext } from '../../../event-calendar/EventCalendarStyledContext';
import { eventCalendarClasses } from '../../../event-calendar/eventCalendarClasses';

const DEFAULT_HOUR_HEIGHT = 80;
const DEFAULT_MIN_COLUMN_WIDTH = 200;
// Names the component in the warnings about invalid props.
const WARNING_SOURCE = 'ResourceDayView';
// This grid has no focusable header or all-day row, so arrow keys stay in the resource columns.
const ROW_TYPES: CalendarGrid.Root.Props['rowTypes'] = ['time-grid'];

const ResourceDayTimeGridContainer = styled(CalendarGrid.Root, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridContainer',
})(({ theme }) => ({
  '--fixed-cell-width': 'var(--EventCalendar-size-fixedCellWidth)',
  '--hour-height': `${DEFAULT_HOUR_HEIGHT}px`,
  '--min-column-width': `${DEFAULT_MIN_COLUMN_WIDTH}px`,
  '--column-template': `minmax(var(--min-column-width), 1fr)`,
  width: '100%',
  height: '100%',
  maxHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

/**
 * The only scroll container, for both axes, so the header, the time axis and the pinned
 * columns can all be sticky.
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
 * Scrolls horizontally once the columns don't fit at their minimum width.
 */
const ResourceDayTimeGridInner = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridInner',
})({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 'calc(var(--fixed-cell-width) + var(--column-count, 1) * var(--min-column-width))',
});

const ResourceDayTimeGridScrollableContent = styled(CalendarGrid.TimeScrollableContent, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridScrollableContent',
})({
  display: 'flex',
  height: 'calc(var(--hour-height) * var(--hours-count))',
  position: 'relative',
  // `ResourceDayTimeGridRoot` scrolls.
  overflow: 'visible',
});

/**
 * Its own stacking context, so the pinned columns stay above the others
 * and the time axis stays above all of them.
 */
const ResourceDayTimeGridGrid = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridGrid',
})({
  flex: 1,
  display: 'grid',
  // Same template as the header cells, so each column stays below its header cell.
  gridTemplateColumns: 'repeat(var(--column-count), var(--column-template))',
  position: 'relative',
  isolation: 'isolate',
});

export const ResourceDayTimeGrid = React.forwardRef(function ResourceDayTimeGrid(
  props: ResourceDayTimeGridProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    day,
    className,
    style,
    hourHeight = DEFAULT_HOUR_HEIGHT,
    slotDuration: slotDurationProp,
    columnWidth,
    minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
    startTime: startTimeProp,
    endTime: endTimeProp,
    initialScrollTime: initialScrollTimeProp,
    pinnedResourceIds,
    defaultPinnedResourceIds,
    onPinnedResourceIdsChange,
    pinnedColumnsSectionSeparator = 'border-and-shadow',
    loadingResourceIds = [],
    ...other
  } = props;

  const hourRange = getDisplayedHourRange(startTimeProp, endTimeProp, WARNING_SOURCE);
  const { startTime, endTime } = hourRange;
  const initialScrollTime = getInitialScrollTime(initialScrollTimeProp, hourRange, WARNING_SOURCE);
  const slotDuration = getSlotDuration(slotDurationProp, WARNING_SOURCE);

  // Context hooks
  const { classes } = useEventCalendarStyledContext();
  const store = useEventCalendarStoreContext();
  const { stopEditing } = useEventEditingContext();

  // Ref hooks
  const containerRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useMergedRefs(forwardedRef, containerRef);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  // Only the values of the first render are used, like `defaultValue` on an input.
  const initialScrollTopRef = React.useRef((initialScrollTime - startTime) * hourHeight);

  // Selector hooks
  const isArmed = useStore(store, schedulerOtherSelectors.editingMode) === 'armed';
  const nowDayNumber = useStore(store, schedulerNowSelectors.nowDayNumber);
  const showCurrentTimeIndicator = useStore(store, schedulerNowSelectors.showCurrentTimeIndicator);
  const displayTimezone = useStore(store, schedulerOtherSelectors.displayTimezone);
  const dayEnd = React.useMemo(
    () => getEndOfDayMs(day.timestamp, displayTimezone),
    [day.timestamp, displayTimezone],
  );
  // `day.timestamp` is the first instant of the day.
  const resourceGroups = useStore(
    store,
    schedulerOccurrenceSelectors.groupedByResourceList,
    day.timestamp,
    dayEnd,
  );

  // Feature hooks
  // The resize handle is skipped so finishing a resize doesn't disarm.
  useDisarmOnOutsidePointer({
    ref: containerRef,
    active: isArmed,
    onDisarm: stopEditing,
    ignoreSelector: `.${eventCalendarClasses.timeGridEventResizeHandler}`,
  });

  const { columns, hasPinnedColumns, togglePinned } = usePinnedResources({
    columns: resourceGroups,
    pinnedResourceIds,
    defaultPinnedResourceIds,
    onPinnedResourceIdsChange,
  });

  usePinnedColumnsScrollShadow(scrollRef, {
    enabled: pinnedColumnsSectionSeparator !== 'border',
    hasPinnedColumns,
  });

  // Before the first paint, so the grid doesn't visibly jump.
  useIsoLayoutEffect(() => {
    if (scrollRef.current && initialScrollTopRef.current > 0) {
      scrollRef.current.scrollTop = initialScrollTopRef.current;
    }
  }, []);

  const isTodayInView = nowDayNumber === getDayNumber(day.plainDate);
  const hasColumns = columns.length > 0;

  const containerStyle = {
    ...style,
    '--hour-height': `${hourHeight}px`,
    '--hours-count': endTime - startTime,
    '--slot-height': `${(hourHeight * slotDuration) / 60}px`,
    '--min-column-width': `${columnWidth ?? minColumnWidth}px`,
    ...(columnWidth != null && { '--column-template': `${columnWidth}px` }),
  } as React.CSSProperties;

  return (
    <ResourceDayTimeGridContainer
      ref={handleRef}
      {...other}
      style={containerStyle}
      className={clsx(className, classes.resourceDayTimeGridContainer)}
      rowTypes={ROW_TYPES}
      // The header row and the row of resource columns.
      aria-rowcount={2}
      aria-colcount={columns.length}
    >
      <ResourceDayTimeGridRoot ref={scrollRef} className={classes.resourceDayTimeGridBody}>
        <ResourceDayTimeGridInner
          className={classes.resourceDayTimeGridInner}
          style={
            hasColumns ? ({ '--column-count': columns.length } as React.CSSProperties) : undefined
          }
        >
          {hasColumns && (
            <ResourceDayTimeGridHeader
              columns={columns}
              separator={pinnedColumnsSectionSeparator}
              onTogglePinned={togglePinned}
            />
          )}

          <ResourceDayTimeGridScrollableContent
            className={classes.resourceDayTimeGridScrollableContent}
          >
            <ResourceDayTimeGridTimeAxis
              startTime={startTime}
              endTime={endTime}
              slotDuration={slotDuration}
            />

            {hasColumns && (
              <ResourceDayTimeGridGrid
                className={classes.resourceDayTimeGridGrid}
                role="row"
                aria-rowindex={2}
              >
                {columns.map((column, index) => (
                  <ResourceTimeGridColumn
                    key={column.resource.id}
                    column={column}
                    day={day}
                    index={index}
                    startTime={startTime}
                    endTime={endTime}
                    separator={pinnedColumnsSectionSeparator}
                    showCurrentTimeIndicator={showCurrentTimeIndicator && isTodayInView}
                    isLoading={loadingResourceIds.includes(column.resource.id)}
                  />
                ))}
              </ResourceDayTimeGridGrid>
            )}
          </ResourceDayTimeGridScrollableContent>
        </ResourceDayTimeGridInner>
      </ResourceDayTimeGridRoot>
    </ResourceDayTimeGridContainer>
  );
});
