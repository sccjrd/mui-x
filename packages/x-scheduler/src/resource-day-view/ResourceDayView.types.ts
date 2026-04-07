import { SxProps } from '@mui/system/styleFunctionSx';
import { Theme } from '@mui/material/styles';
import { EventCalendarParameters } from '@mui/x-scheduler-headless/use-event-calendar';
import { ExportedResourceDayTimeGridProps } from '../internals/components/resource-day-time-grid/ResourceDayTimeGrid.types';

export interface ResourceDayViewProps extends ExportedResourceDayTimeGridProps {}

export interface StandaloneResourceDayViewProps<TEvent extends object, TResource extends object>
  extends ResourceDayViewProps,
    EventCalendarParameters<TEvent, TResource> {
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx?: SxProps<Theme>;
}
