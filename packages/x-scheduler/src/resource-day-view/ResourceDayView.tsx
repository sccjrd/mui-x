'use client';
import * as React from 'react';
import { createSelectorMemoized } from '@base-ui/utils/store';
import { EventCalendarViewConfig } from '@mui/x-scheduler-headless/models';
import {
  useExtractEventCalendarParameters,
  EventCalendarState as State,
} from '@mui/x-scheduler-headless/use-event-calendar';
import { useEventCalendarView } from '@mui/x-scheduler-headless/use-event-calendar-view';
import { processDate } from '@mui/x-scheduler-headless/process-date';
import { schedulerOtherSelectors } from '@mui/x-scheduler-headless/scheduler-selectors';
import { ResourceDayViewProps, StandaloneResourceDayViewProps } from './ResourceDayView.types';
import { EventCalendarProvider } from '../internals/components/EventCalendarProvider';
import { ResourceDayTimeGrid } from '../internals/components/resource-day-time-grid/ResourceDayTimeGrid';
import { EventDialogProvider } from '../internals/components/event-dialog';

const RESOURCE_DAY_VIEW_CONFIG: EventCalendarViewConfig = {
  siblingVisibleDateGetter: ({ state, delta }) =>
    state.adapter.addDays(schedulerOtherSelectors.visibleDate(state), delta),
  visibleDaysSelector: createSelectorMemoized(
    schedulerOtherSelectors.visibleDate,
    (state: State) => state.adapter,
    (visibleDate, adapter) => [processDate(visibleDate, adapter)],
  ),
};

/**
 * A Resource Day View that shows one column per resource for a single day.
 * Use inside the Event Calendar.
 */
export const ResourceDayView = React.memo(
  React.forwardRef(function ResourceDayView(
    props: ResourceDayViewProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { days } = useEventCalendarView(RESOURCE_DAY_VIEW_CONFIG);

    return <ResourceDayTimeGrid ref={forwardedRef} day={days[0]} {...props} />;
  }),
);

/**
 * A Resource Day View that can be used outside of the Event Calendar.
 * Shows one column per resource for a single day.
 */
export const StandaloneResourceDayView = React.forwardRef(function StandaloneResourceDayView<
  TEvent extends object,
  TResource extends object,
>(
  props: StandaloneResourceDayViewProps<TEvent, TResource>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { parameters, forwardedProps } = useExtractEventCalendarParameters<
    TEvent,
    TResource,
    typeof props
  >(props);

  return (
    <EventCalendarProvider {...parameters}>
      <EventDialogProvider>
        <ResourceDayView ref={forwardedRef} {...forwardedProps} />
      </EventDialogProvider>
    </EventCalendarProvider>
  );
}) as StandaloneResourceDayViewComponent;

type StandaloneResourceDayViewComponent = <TEvent extends object, TResource extends object>(
  props: StandaloneResourceDayViewProps<TEvent, TResource> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => React.JSX.Element;
