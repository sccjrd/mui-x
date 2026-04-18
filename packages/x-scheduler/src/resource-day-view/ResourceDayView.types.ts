import { SxProps } from '@mui/system/styleFunctionSx';
import { Theme } from '@mui/material/styles';
import { EventCalendarParameters } from '@mui/x-scheduler-headless/use-event-calendar';
import { ExportedResourceDayTimeGridProps } from '../internals/components/resource-day-time-grid/ResourceDayTimeGrid.types';
import type { EventDialogRenderProps } from '../internals/components/event-dialog/EventDialog.types';

export interface ResourceDayViewProps extends ExportedResourceDayTimeGridProps {}

export interface StandaloneResourceDayViewProps<TEvent extends object, TResource extends object>
  extends ResourceDayViewProps,
    EventCalendarParameters<TEvent, TResource> {
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx?: SxProps<Theme>;
  /**
   * Custom render function for the event dialog.
   * When provided, the built-in dialog is replaced entirely.
   * Receives the open state, the clicked occurrence, an anchor ref, and a close callback.
   *
   * @example
   * ```tsx
   * <StandaloneResourceDayView
   *   renderDialog={({ isOpen, occurrence, onClose }) => (
   *     <MyModal open={isOpen} event={occurrence} onClose={onClose} />
   *   )}
   * />
   * ```
   */
  renderDialog?: (props: EventDialogRenderProps) => React.ReactNode;
}
