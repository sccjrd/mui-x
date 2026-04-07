'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useStore } from '@base-ui/utils/store';
import { SchedulerEventOccurrence, SchedulerProcessedDate, SchedulerResource, TemporalSupportedObject } from '@mui/x-scheduler-headless/models';
import { CalendarGrid } from '@mui/x-scheduler-headless/calendar-grid';
import { useEventCalendarStoreContext } from '@mui/x-scheduler-headless/use-event-calendar-store-context';
import { useAdapterContext } from '@mui/x-scheduler-headless/use-adapter-context';
import { useEventOccurrencesWithTimelinePosition } from '@mui/x-scheduler-headless/use-event-occurrences-with-timeline-position';
import { eventCalendarOccurrencePlaceholderSelectors } from '@mui/x-scheduler-headless/event-calendar-selectors';
import { schedulerOtherSelectors } from '@mui/x-scheduler-headless/scheduler-selectors';
import { TimeGridEvent } from '../event/time-grid-event/TimeGridEvent';
import { EventSkeleton } from '../event-skeleton';
import { EventDialogTrigger, useEventDialogContext } from '../event-dialog/EventDialog';
import { useEventCalendarStyledContext } from '../../../event-calendar/EventCalendarStyledContext';
import { isOccurrenceAllDayOrMultipleDay } from '../../utils/event-utils';

const ResourceDayTimeGridColumn = styled(CalendarGrid.TimeColumn, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridColumn',
})(({ theme }) => ({
  borderInlineStart: `1px solid ${(theme.vars || theme).palette.divider}`,
  flexGrow: 1,
  flexShrink: 0,
  flexBasis: 0,
  minWidth: 0,
  position: 'relative',
  ':last-of-type': {
    borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
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
  const { resource, occurrences: allOccurrences, day, showCurrentTimeIndicator, index } = props;

  const adapter = useAdapterContext();
  const { classes } = useEventCalendarStyledContext();

  const start = React.useMemo(() => adapter.startOfDay(day.value), [adapter, day]);
  const end = React.useMemo(() => adapter.endOfDay(day.value), [adapter, day]);

  // Filter to only time-based (non-all-day) occurrences for this resource
  const timedOccurrences = React.useMemo(
    () => allOccurrences.filter((occ) => !isOccurrenceAllDayOrMultipleDay(occ, adapter)),
    [allOccurrences, adapter],
  );

  const { occurrences, maxIndex } = useEventOccurrencesWithTimelinePosition({
    occurrences: timedOccurrences,
    maxSpan: Infinity,
  });

  const resourceId = resource.id;
  const addPropertiesToDroppedEvent = React.useMemo(
    () => () => ({ allDay: false as const, resource: resourceId }),
    [resourceId],
  );

  return (
    <ResourceDayTimeGridColumn
      className={classes.resourceDayTimeGridColumn}
      start={start}
      end={end}
      addPropertiesToDroppedEvent={addPropertiesToDroppedEvent}
      resourceId={resource.id}
      style={{ '--columns-count': maxIndex } as React.CSSProperties}
    >
      <ResourceColumnInteractiveLayer
        start={start}
        end={end}
        showCurrentTimeIndicator={showCurrentTimeIndicator}
        index={index}
        occurrences={occurrences}
        maxIndex={maxIndex}
        resourceId={resource.id}
      />
    </ResourceDayTimeGridColumn>
  );
}

function ResourceColumnInteractiveLayer({
  start,
  end,
  showCurrentTimeIndicator,
  index,
  occurrences,
  maxIndex,
  resourceId,
}: {
  start: TemporalSupportedObject;
  end: TemporalSupportedObject;
  showCurrentTimeIndicator: boolean;
  index: number;
  occurrences: useEventOccurrencesWithTimelinePosition.EventOccurrenceWithPosition[];
  maxIndex: number;
  resourceId: string;
}) {
  const store = useEventCalendarStoreContext();
  const { onOpen: startEditing } = useEventDialogContext();
  const { classes } = useEventCalendarStyledContext();

  const columnRef = React.useRef<HTMLDivElement | null>(null);

  const isCreatingAnEvent = useStore(
    store,
    eventCalendarOccurrencePlaceholderSelectors.isCreatingInTimeRange,
    start,
    end,
    resourceId,
  );
  const placeholder = CalendarGrid.usePlaceholderInRange({ start, end, occurrences, maxIndex, resourceId });
  const isLoading = useStore(store, schedulerOtherSelectors.isLoading);

  React.useEffect(() => {
    if (!isCreatingAnEvent || !placeholder || !columnRef.current) {
      return;
    }
    startEditing(columnRef, placeholder);
  }, [isCreatingAnEvent, placeholder, startEditing]);

  return (
    <ResourceDayTimeGridColumnInteractiveLayer
      className={classes.resourceDayTimeGridColumnInteractiveLayer}
      ref={columnRef}
    >
      {isLoading && <EventSkeleton data-variant="time-column" />}
      {!isLoading &&
        occurrences.map((occurrence) => (
          <EventDialogTrigger key={occurrence.key} occurrence={occurrence}>
            <TimeGridEvent occurrence={occurrence} variant="regular" />
          </EventDialogTrigger>
        ))}
      {placeholder != null && <TimeGridEvent occurrence={placeholder} variant="placeholder" />}
      {showCurrentTimeIndicator ? (
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
      ) : null}
    </ResourceDayTimeGridColumnInteractiveLayer>
  );
}

interface ResourceTimeGridColumnProps {
  resource: SchedulerResource;
  occurrences: SchedulerEventOccurrence[];
  day: SchedulerProcessedDate;
  index: number;
  showCurrentTimeIndicator: boolean;
}
