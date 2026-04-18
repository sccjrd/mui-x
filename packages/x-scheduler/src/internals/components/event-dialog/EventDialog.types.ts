import * as React from 'react';
import { SchedulerRenderableEventOccurrence } from '@mui/x-scheduler-headless/models';
import { DialogProps } from '@mui/material/Dialog';

export interface EventDialogProps extends DialogProps {
  /**
   * The event occurrence to display in the popover.
   */
  occurrence: SchedulerRenderableEventOccurrence;
  /**
   * The anchor element for the popover positioning.
   */
  anchorRef: React.RefObject<HTMLElement | null>;
  /**
   * Handles the close action of the popover.
   */
  onClose: () => void;
}

export interface EventDialogRenderProps {
  /** Whether the dialog is currently open. */
  isOpen: boolean;
  /** The event occurrence that was clicked. */
  occurrence: SchedulerRenderableEventOccurrence;
  /** The DOM element of the event chip that was clicked (useful for anchoring a Popover). */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Call this to close the dialog. */
  onClose: () => void;
}

export interface EventDialogProviderProps {
  children: React.ReactNode;
  /**
   * Custom render function for the event dialog.
   * When provided, the built-in dialog is replaced entirely.
   * Receives the open state, the clicked occurrence, an anchor ref, and a close callback.
   *
   * @example
   * ```tsx
   * <EventCalendar
   *   renderDialog={({ isOpen, occurrence, onClose }) => (
   *     <MyCustomModal open={isOpen} event={occurrence} onClose={onClose} />
   *   )}
   * />
   * ```
   */
  renderDialog?: (props: EventDialogRenderProps) => React.ReactNode;
}

export interface EventDialogTriggerProps extends React.HTMLAttributes<HTMLElement> {
  occurrence: SchedulerRenderableEventOccurrence;
  children: React.ReactNode;
}
