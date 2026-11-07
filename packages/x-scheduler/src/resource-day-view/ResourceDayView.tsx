'use client';
import * as React from 'react';
import { useThemeProps } from '@mui/material/styles';
import { useExtractEventCalendarParameters } from '@mui/x-scheduler-internals/use-event-calendar';
import { useEventCalendarView } from '@mui/x-scheduler-internals/use-event-calendar-view';
import type { ResourceDayViewProps, StandaloneResourceDayViewProps } from './ResourceDayView.types';
import { EventCalendarProvider } from '../internals/components/EventCalendarProvider';
import { ResourceDayTimeGrid } from '../internals/components/resource-day-time-grid/ResourceDayTimeGrid';
import { EventDialogProvider } from '../internals/components/event-dialog';
import { ResponsiveTypographyContainer } from '../internals/components/ResponsiveTypographyContainer';
import { createDayTimeGridViewDefinition } from '../internals/utils/day-time-grid-view-definition';

const RESOURCE_DAY_VIEW_DEFINITION = createDayTimeGridViewDefinition(1);

/**
 * A Resource Day View that shows one column per resource for a single day.
 * Use inside the Event Calendar.
 */
export const ResourceDayView = React.memo(
  React.forwardRef(function ResourceDayView(
    props: ResourceDayViewProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { days } = useEventCalendarView(RESOURCE_DAY_VIEW_DEFINITION);

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
  inProps: StandaloneResourceDayViewProps<TEvent, TResource>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  // eslint-disable-next-line mui/material-ui-name-matches-component-name
  const props = useThemeProps({ props: inProps, name: 'MuiEventCalendar' });

  const { parameters, forwardedProps } = useExtractEventCalendarParameters<
    TEvent,
    TResource,
    typeof props
  >(props);

  const { localeText, slots, slotProps, ...other } = forwardedProps;

  return (
    <ResponsiveTypographyContainer>
      <EventCalendarProvider
        {...parameters}
        localeText={localeText}
        slots={slots}
        slotProps={slotProps}
      >
        <EventDialogProvider>
          <ResourceDayView ref={forwardedRef} {...other} />
        </EventDialogProvider>
      </EventCalendarProvider>
    </ResponsiveTypographyContainer>
  );
}) as StandaloneResourceDayViewComponent;

type StandaloneResourceDayViewComponent = <TEvent extends object, TResource extends object>(
  props: StandaloneResourceDayViewProps<TEvent, TResource> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => React.JSX.Element;
