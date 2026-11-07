'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useStore } from '@base-ui/utils/store';
import type {
  SchedulerEventOccurrence,
  SchedulerProcessedDay,
  SchedulerResource,
} from '@mui/x-scheduler-internals/models';
import { useCalendarGridTimeColumnContext } from '@mui/x-scheduler-internals/internals';
import { CalendarGrid } from '@mui/x-scheduler-internals/calendar-grid';
import { useEventCalendarStoreContext } from '@mui/x-scheduler-internals/use-event-calendar-store-context';
import { useEventOccurrencesWithTimelinePosition } from '@mui/x-scheduler-internals/use-event-occurrences-with-timeline-position';
import { eventCalendarOccurrencePlaceholderSelectors } from '@mui/x-scheduler-internals/event-calendar-selectors';
import { schedulerOtherSelectors } from '@mui/x-scheduler-internals/scheduler-selectors';
import { getPinnedColumnProps } from './usePinnedResources';
import type { PinnedColumnState } from './usePinnedResources';
import { getStickyEdgeShadowStyles } from './resourceDayTimeGridStyles';
import type { ExportedResourceDayTimeGridProps } from './ResourceDayTimeGrid.types';
import { TimeGridEvent } from '../event/time-grid-event/TimeGridEvent';
import { EventSkeleton } from '../event-skeleton';
import { useEventEditingContext } from '../event-editing';
import { EventContextMenuTrigger } from '../event-context-menu';
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

const ResourceDayTimeGridColumnInteractiveLayer = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridColumnInteractiveLayer',
})({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

const ResourceDayTimeGridCurrentTimeIndicator = styled(CalendarGrid.CurrentTimeIndicator, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridCurrentTimeIndicator',
})(({ theme }) => ({
  position: 'absolute',
  zIndex: 2,
  top: 'var(--y-position)',
  left: 0,
  right: -1,
  height: 0,
  borderTop: `2px solid ${(theme.vars || theme).palette.primary.main}`,
}));

const ResourceDayTimeGridCurrentTimeIndicatorCircle = styled('span', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridCurrentTimeIndicatorCircle',
})(({ theme }) => ({
  position: 'absolute',
  zIndex: 1,
  left: -5,
  top: -5,
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: (theme.vars || theme).palette.primary.main,
}));

export function ResourceTimeGridColumn(props: ResourceTimeGridColumnProps) {
  const { column, day, index, separator, showCurrentTimeIndicator, isLoading } = props;
  const { resource } = column;

  // Context hooks
  const { classes } = useEventCalendarStyledContext();

  // Only the timed events, since this grid has no all-day row.
  const timedOccurrences = React.useMemo(
    () => column.occurrences.filter((occurrence) => !isOccurrenceAllDayOrMultipleDay(occurrence)),
    [column.occurrences],
  );

  // Feature hooks
  const { occurrences, maxIndex } = useEventOccurrencesWithTimelinePosition({
    occurrences: timedOccurrences,
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
      resourceId={resource.id}
      addPropertiesToDroppedEvent={addPropertiesToDroppedEvent}
      {...pinnedAttributes}
      style={{ '--columns-count': maxIndex, ...pinnedStyle } as React.CSSProperties}
    >
      <ResourceColumnInteractiveLayer
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

function ResourceColumnInteractiveLayer(props: ResourceColumnInteractiveLayerProps) {
  const { resourceId, occurrences, maxIndex, index, showCurrentTimeIndicator, isLoading } = props;

  // Context hooks
  const store = useEventCalendarStoreContext();
  const { start, end } = useCalendarGridTimeColumnContext().axis;
  const { startEditing } = useEventEditingContext();
  const { classes } = useEventCalendarStyledContext();

  // Ref hooks
  const columnRef = React.useRef<HTMLDivElement | null>(null);

  // Selector hooks
  const isCreatingAnEvent = useStore(
    store,
    eventCalendarOccurrencePlaceholderSelectors.isCreatingInTimeRange,
    start,
    end,
    resourceId,
  );
  const isStoreLoading = useStore(store, schedulerOtherSelectors.isLoading);

  // Feature hooks
  const placeholder = CalendarGrid.usePlaceholderInRange({
    start,
    end,
    occurrences,
    maxIndex,
    resourceId,
  });

  React.useEffect(() => {
    if (!isCreatingAnEvent || !placeholder || !columnRef.current) {
      return;
    }
    startEditing(columnRef, placeholder);
  }, [isCreatingAnEvent, placeholder, startEditing]);

  const showSkeleton = isStoreLoading || isLoading;

  return (
    <ResourceDayTimeGridColumnInteractiveLayer
      className={classes.resourceDayTimeGridColumnInteractiveLayer}
      ref={columnRef}
    >
      {showSkeleton && <EventSkeleton data-variant="time-column" />}
      {!showSkeleton &&
        occurrences.map((occurrence) => (
          <EventContextMenuTrigger key={occurrence.key} occurrence={occurrence}>
            <TimeGridEvent occurrence={occurrence} variant="regular" />
          </EventContextMenuTrigger>
        ))}
      {placeholder != null && <TimeGridEvent occurrence={placeholder} variant="placeholder" />}
      {showCurrentTimeIndicator && (
        <ResourceDayTimeGridCurrentTimeIndicator
          className={classes.resourceDayTimeGridCurrentTimeIndicator}
          aria-hidden
        >
          {index === 0 && (
            <ResourceDayTimeGridCurrentTimeIndicatorCircle
              className={classes.resourceDayTimeGridCurrentTimeIndicatorCircle}
            />
          )}
        </ResourceDayTimeGridCurrentTimeIndicator>
      )}
    </ResourceDayTimeGridColumnInteractiveLayer>
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
  separator: NonNullable<ExportedResourceDayTimeGridProps['pinnedColumnsSectionSeparator']>;
  showCurrentTimeIndicator: boolean;
  /**
   * Whether this column is loading, in addition to the loading state of the whole calendar.
   */
  isLoading: boolean;
}

interface ResourceColumnInteractiveLayerProps {
  resourceId: string;
  occurrences: useEventOccurrencesWithTimelinePosition.EventOccurrenceWithPosition[];
  maxIndex: number;
  index: number;
  showCurrentTimeIndicator: boolean;
  isLoading: boolean;
}
