'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useStore } from '@base-ui/utils/store';
import type {
  SchedulerEventOccurrence,
  SchedulerProcessedDay,
  SchedulerResource,
} from '@mui/x-scheduler-internals/models';
import { getPlainDateTimelineAxis } from '@mui/x-scheduler-internals/internals';
import { CalendarGrid } from '@mui/x-scheduler-internals/calendar-grid';
import { useEventCalendarStoreContext } from '@mui/x-scheduler-internals/use-event-calendar-store-context';
import { useEventOccurrencesWithTimelinePosition } from '@mui/x-scheduler-internals/use-event-occurrences-with-timeline-position';
import { schedulerOtherSelectors } from '@mui/x-scheduler-internals/scheduler-selectors';
import { getPinnedColumnProps } from './usePinnedResources';
import type { PinnedColumnState } from './usePinnedResources';
import { getStickyEdgeShadowStyles } from './resourceDayTimeGridStyles';
import type { ExportedResourceDayTimeGridProps } from './ResourceDayTimeGrid.types';
import { ColumnInteractiveLayer } from '../day-time-grid/TimeGridColumn';
import { useEventCalendarStyledContext } from '../../../event-calendar/EventCalendarStyledContext';
import { getCellFocusBackground } from '../../utils/tokens';
import { isOccurrenceAllDayOrMultipleDay } from '../../utils/event-utils';

const ResourceDayTimeGridColumn = styled(CalendarGrid.TimeColumn, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridColumn',
})(({ theme }) => ({
  position: 'relative',
  flexGrow: 1,
  flexShrink: 0,
  flexBasis: 0,
  minWidth: 0,
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  // One line per slot, drawn by each column so the opaque pinned columns still show them.
  backgroundImage: `repeating-linear-gradient(
    to bottom,
    transparent,
    transparent calc(var(--slot-height) - 1px),
    ${(theme.vars || theme).palette.divider} calc(var(--slot-height) - 1px),
    ${(theme.vars || theme).palette.divider} var(--slot-height)
  )`,
  // Its own stacking context, so its events never go above a pinned column.
  isolation: 'isolate',
  '&:focus-visible': {
    outline: 'none',
    backgroundColor: getCellFocusBackground(theme),
  },
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
    ...getStickyEdgeShadowStyles(theme, '--shadow-opacity'),
    zIndex: 1,
  },
}));

export function ResourceTimeGridColumn(props: ResourceTimeGridColumnProps) {
  const { column, day, index, startTime, endTime, separator, showCurrentTimeIndicator, isLoading } =
    props;
  const { resource } = column;

  // Context hooks
  const store = useEventCalendarStoreContext();
  const { classes } = useEventCalendarStyledContext();

  // Selector hooks
  const displayTimezone = useStore(store, schedulerOtherSelectors.displayTimezone);

  const dayStartMinute = startTime * 60;
  const dayEndMinute = endTime * 60;
  // The bounds of the column, which builds them the same way.
  const { start, end } = React.useMemo(
    () =>
      getPlainDateTimelineAxis(day.plainDate, { dayStartMinute, dayEndMinute }, displayTimezone),
    [day.plainDate, dayStartMinute, dayEndMinute, displayTimezone],
  );

  // Only the timed events inside the displayed hours, since this grid has no all-day row.
  const visibleOccurrences = React.useMemo(
    () =>
      column.occurrences.filter(
        (occurrence) =>
          !isOccurrenceAllDayOrMultipleDay(occurrence) &&
          occurrence.displayTimezone.end.timestamp > start &&
          occurrence.displayTimezone.start.timestamp < end,
      ),
    [column.occurrences, start, end],
  );

  // Feature hooks
  const { occurrences, maxIndex } = useEventOccurrencesWithTimelinePosition({
    occurrences: visibleOccurrences,
    maxSpan: Infinity,
  });

  const addPropertiesToDroppedEvent = React.useCallback(
    () => ({ allDay: false as const, resource: resource.id }),
    [resource.id],
  );

  const { style: pinnedStyle, ...pinnedAttributes } = getPinnedColumnProps(column, separator);

  return (
    <ResourceDayTimeGridColumn
      className={classes.resourceDayTimeGridColumn}
      value={day.plainDate}
      dayStartMinute={dayStartMinute}
      dayEndMinute={dayEndMinute}
      resourceId={resource.id}
      addPropertiesToDroppedEvent={addPropertiesToDroppedEvent}
      {...pinnedAttributes}
      style={{ '--columns-count': maxIndex, ...pinnedStyle } as React.CSSProperties}
    >
      <ColumnInteractiveLayer
        resourceId={resource.id}
        occurrences={occurrences}
        maxIndex={maxIndex}
        index={index}
        showCurrentTimeIndicator={showCurrentTimeIndicator}
        isLoading={isLoading}
      />
    </ResourceDayTimeGridColumn>
  );
}

interface ResourceTimeGridColumnProps {
  column: {
    resource: SchedulerResource;
    occurrences: SchedulerEventOccurrence[];
  } & PinnedColumnState;
  day: SchedulerProcessedDay;
  /**
   * The position of the column in the grid. The first column draws the dot of the current time.
   */
  index: number;
  /**
   * Inclusive start of the displayed hours.
   */
  startTime: number;
  /**
   * Exclusive end of the displayed hours.
   */
  endTime: number;
  separator: NonNullable<ExportedResourceDayTimeGridProps['pinnedColumnsSectionSeparator']>;
  showCurrentTimeIndicator: boolean;
  /**
   * Whether this column is loading, in addition to the loading state of the whole calendar.
   */
  isLoading: boolean;
}
