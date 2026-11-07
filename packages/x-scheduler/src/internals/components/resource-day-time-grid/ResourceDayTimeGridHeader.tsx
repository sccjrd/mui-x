'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import PushPinIcon from '@mui/icons-material/PushPin';
import type { SchedulerResource } from '@mui/x-scheduler-internals/models';
import { CalendarGrid } from '@mui/x-scheduler-internals/calendar-grid';
import { getPinnedColumnProps } from './usePinnedResources';
import type { PinnedColumnState } from './usePinnedResources';
import { getStickyEdgeShadowStyles } from './resourceDayTimeGridStyles';
import type { ExportedResourceDayTimeGridProps } from './ResourceDayTimeGrid.types';
import { useEventCalendarStyledContext } from '../../../event-calendar/EventCalendarStyledContext';
import { eventCalendarClasses } from '../../../event-calendar/eventCalendarClasses';

/**
 * The first row of the grid. Stays at the top while scrolling vertically,
 * and scrolls horizontally with the columns.
 */
const ResourceDayTimeGridHeaderRoot = styled(CalendarGrid.HeaderRow, {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeader',
})(({ theme }) => ({
  display: 'flex',
  flexShrink: 0,
  borderBlockEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  position: 'sticky',
  top: 0,
  zIndex: 3,
}));

/**
 * The corner above the time axis.
 */
const ResourceDayTimeGridHeaderAxisCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderAxisCell',
})(({ theme }) => ({
  width: 'var(--fixed-cell-width)',
  flexShrink: 0,
  position: 'sticky',
  left: 0,
  // Above the pinned header cells, so its shadow isn't hidden by the first one.
  zIndex: 3,
  backgroundColor: 'inherit',
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  '&::after': getStickyEdgeShadowStyles(theme, '--axis-shadow-opacity'),
}));

const ResourceDayTimeGridHeaderCells = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderCells',
})(({ theme }) => ({
  flex: 1,
  display: 'grid',
  // Same template as the columns, so each header cell stays above its column.
  gridTemplateColumns: 'repeat(var(--column-count), var(--column-template))',
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
}));

const ResourceDayTimeGridHeaderCell = styled('div', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridHeaderCell',
})(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1.25),
  borderInlineEnd: `1px solid ${(theme.vars || theme).palette.divider}`,
  minHeight: 48,
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
  [`&:hover .${eventCalendarClasses.resourceDayTimeGridPinButton}, &:focus-within .${eventCalendarClasses.resourceDayTimeGridPinButton}`]:
    {
      opacity: 1,
    },
}));

/**
 * Shown on hover and focus, and always when the column is pinned.
 */
const ResourceDayTimeGridPinButton = styled('button', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridPinButton',
})(({ theme }) => ({
  position: 'absolute',
  top: 4,
  right: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 2,
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  background: 'transparent',
  cursor: 'pointer',
  color: (theme.vars || theme).palette.action.active,
  opacity: 0,
  transition: 'opacity 0.15s, background-color 0.15s',
  '&:hover': {
    backgroundColor: (theme.vars || theme).palette.action.hover,
  },
  '&:focus-visible': {
    outline: `2px solid ${(theme.vars || theme).palette.primary.main}`,
    outlineOffset: 1,
  },
  '&[data-pinned]': {
    opacity: 1,
    color: (theme.vars || theme).palette.primary.main,
  },
}));

const ResourceDayTimeGridResourceName = styled('span', {
  name: 'MuiEventCalendar',
  slot: 'ResourceDayTimeGridResourceName',
})(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
  color: (theme.vars || theme).palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export function ResourceDayTimeGridHeader(props: ResourceDayTimeGridHeaderProps) {
  const { columns, separator, onTogglePinned } = props;

  // Context hooks
  const { classes, localeText } = useEventCalendarStyledContext();

  return (
    <ResourceDayTimeGridHeaderRoot className={classes.resourceDayTimeGridHeader}>
      <ResourceDayTimeGridHeaderAxisCell aria-hidden="true" />
      <ResourceDayTimeGridHeaderCells className={classes.resourceDayTimeGridHeaderCells}>
        {columns.map((column, index) => {
          const { resource } = column;
          const isPinned = column.pinnedIndex !== undefined;

          return (
            <ResourceDayTimeGridHeaderCell
              key={resource.id}
              className={classes.resourceDayTimeGridHeaderCell}
              role="columnheader"
              aria-colindex={index + 1}
              {...getPinnedColumnProps(column, separator)}
            >
              <ResourceDayTimeGridResourceName className={classes.resourceDayTimeGridResourceName}>
                {resource.title}
              </ResourceDayTimeGridResourceName>
              <ResourceDayTimeGridPinButton
                type="button"
                className={classes.resourceDayTimeGridPinButton}
                data-pinned={isPinned || undefined}
                aria-label={
                  isPinned
                    ? localeText.unpinResourceColumn(resource.title)
                    : localeText.pinResourceColumn(resource.title)
                }
                aria-pressed={isPinned}
                onClick={() => onTogglePinned(resource.id)}
              >
                <PushPinIcon sx={{ fontSize: 14 }} />
              </ResourceDayTimeGridPinButton>
            </ResourceDayTimeGridHeaderCell>
          );
        })}
      </ResourceDayTimeGridHeaderCells>
    </ResourceDayTimeGridHeaderRoot>
  );
}

interface ResourceDayTimeGridHeaderProps {
  columns: ({ resource: SchedulerResource } & PinnedColumnState)[];
  separator: NonNullable<ExportedResourceDayTimeGridProps['pinnedColumnsSectionSeparator']>;
  onTogglePinned: (resourceId: string) => void;
}
