'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useStore } from '@base-ui/utils/store';
import { useEventCalendarStoreContext } from '@mui/x-scheduler-internals/use-event-calendar-store-context';
import {
  schedulerOtherSelectors,
  schedulerPreferenceSelectors,
} from '@mui/x-scheduler-internals/scheduler-selectors';
import { formatTime } from '@mui/x-scheduler-internals/internals';
import { getStickyEdgeShadowStyles } from './resourceDayTimeGridStyles';
import { useEventCalendarStyledContext } from '../../../event-calendar/EventCalendarStyledContext';

/**
 * Stays at the inline start while scrolling horizontally, and hides the start of the grid lines.
 */
const ResourceDayTimeGridTimeAxisRoot = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxis',
})(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  width: 'var(--fixed-cell-width)',
  position: 'sticky',
  insetInlineStart: 0,
  // Above the columns, so its background and its shadow cover them.
  zIndex: 2,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  '&::after': getStickyEdgeShadowStyles(theme, '--axis-shadow-opacity'),
}));

const ResourceDayTimeGridTimeAxisCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxisCell',
})(({ theme }) => ({
  height: 'var(--slot-height)',
  // The label is centered on the line above the cell, so it overflows the cell.
  overflow: 'visible',
  paddingInline: theme.spacing(1),
  textAlign: 'end',
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  '&[data-minor] time': {
    opacity: 0.5,
  },
}));

const ResourceDayTimeGridTimeAxisText = styled('time', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridTimeAxisText',
})(({ theme }) => ({
  display: 'block',
  // Shrinks with the time axis on narrow screens, like the labels of the day view.
  fontSize: 'var(--EventCalendar-fontSize-timeText, 0.75rem)',
  lineHeight: theme.typography.caption.lineHeight,
  color: (theme.vars || theme).palette.text.secondary,
  whiteSpace: 'nowrap',
  // Centers the label on the line at the top of its cell.
  transform: 'translateY(-50%)',
}));

/**
 * One label per slot. The labels of the slots that don't start an hour are minor.
 */
export function ResourceDayTimeGridTimeAxis(props: ResourceDayTimeGridTimeAxisProps) {
  const { startTime, endTime, slotDuration } = props;

  // Context hooks
  const store = useEventCalendarStoreContext();
  const { classes } = useEventCalendarStyledContext();

  // Selector hooks
  const locale = useStore(store, schedulerOtherSelectors.dateLocale);
  const ampm = useStore(store, schedulerPreferenceSelectors.ampm);

  const slotCount = ((endTime - startTime) * 60) / slotDuration;

  return (
    <ResourceDayTimeGridTimeAxisRoot
      className={classes.resourceDayTimeGridTimeAxis}
      aria-hidden="true"
    >
      {Array.from({ length: slotCount }, (_, slot) => {
        const minutesInDay = startTime * 60 + slot * slotDuration;
        return (
          <ResourceDayTimeGridTimeAxisCell
            key={slot}
            className={classes.resourceDayTimeGridTimeAxisCell}
            data-minor={minutesInDay % 60 !== 0 || undefined}
          >
            <ResourceDayTimeGridTimeAxisText className={classes.resourceDayTimeGridTimeAxisText}>
              {slot === 0 ? null : formatTime(locale, minutesInDay, ampm)}
            </ResourceDayTimeGridTimeAxisText>
          </ResourceDayTimeGridTimeAxisCell>
        );
      })}
    </ResourceDayTimeGridTimeAxisRoot>
  );
}

interface ResourceDayTimeGridTimeAxisProps {
  /**
   * Inclusive start of the displayed hours.
   */
  startTime: number;
  /**
   * Exclusive end of the displayed hours.
   */
  endTime: number;
  /**
   * The duration of each slot, in minutes.
   */
  slotDuration: number;
}
