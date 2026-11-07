import type { SxProps } from '@mui/system/styleFunctionSx';
import type { Theme } from '@mui/material/styles';
import type {
  EventCalendarParameters,
  EventCalendarSchedulerParametersOverrides,
  CollapsibleResourcesParameterKeys,
} from '@mui/x-scheduler-internals/use-event-calendar';
import type { EventCalendarLocaleText } from '../models/translations';
import type { ExportedResourceDayTimeGridProps } from '../internals/components/resource-day-time-grid/ResourceDayTimeGrid.types';
import type { SchedulerSlotsAndSlotProps } from '../models/slots';

export interface ResourceDayViewProps extends ExportedResourceDayTimeGridProps {}

export interface StandaloneResourceDayViewProps<TEvent extends object, TResource extends object>
  extends
    ResourceDayViewProps,
    Omit<
      EventCalendarParameters<TEvent, TResource>,
      | 'viewConfig'
      | keyof EventCalendarSchedulerParametersOverrides
      | CollapsibleResourcesParameterKeys
    >,
    EventCalendarSchedulerParametersOverrides,
    SchedulerSlotsAndSlotProps {
  /**
   * Set the locale text of the view.
   * You can find all the translation keys supported in [the source](https://github.com/mui/mui-x/blob/HEAD/packages/x-scheduler/src/models/translations.ts)
   * in the GitHub repository.
   */
  localeText?: Partial<EventCalendarLocaleText>;
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx?: SxProps<Theme>;
}
