'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useEventCalendarView } from '@mui/x-scheduler-internals/use-event-calendar-view';
import type { ResourceDayViewProps } from './ResourceDayView.types';
import { ResourceDayTimeGrid } from '../internals/components/resource-day-time-grid/ResourceDayTimeGrid';
import { createDayTimeGridViewDefinition } from '../internals/utils/day-time-grid-view-definition';

const RESOURCE_DAY_VIEW_DEFINITION = createDayTimeGridViewDefinition(1);

/**
 * A Resource Day View that shows one column per resource for a single day.
 * Use inside the Event Calendar.
 */
const ResourceDayView = React.memo(
  React.forwardRef(function ResourceDayView(
    props: ResourceDayViewProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { days } = useEventCalendarView(RESOURCE_DAY_VIEW_DEFINITION);

    return <ResourceDayTimeGrid ref={forwardedRef} day={days[0]} {...props} />;
  }),
);

// @ts-expect-error React.memo typing doesn't include propTypes

ResourceDayView.propTypes /* remove-proptypes */ = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "pnpm proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * Fixed width in pixels for each resource column.
   * When set, columns will not grow or shrink beyond this value and horizontal scrolling is enabled.
   * Takes precedence over `minColumnWidth`.
   */
  columnWidth: PropTypes.number,
  /**
   * The resource IDs to pin by default when the component first mounts (uncontrolled).
   * @default []
   */
  defaultPinnedResourceIds: PropTypes.arrayOf(PropTypes.string),
  /**
   * The hour (0–23) to scroll to when the component first mounts.
   * Useful for starting the view at business hours instead of midnight.
   * @default 0
   */
  defaultScrollToHour: PropTypes.number,
  /**
   * The height in pixels of each hour slot in the time grid.
   * Increasing this value zooms in on the time axis.
   * @default 80
   */
  hourHeight: PropTypes.number,
  /**
   * IDs of resource columns that are currently loading their data.
   * Only those columns show a skeleton; already-loaded columns are unaffected.
   * This is independent of the global `isLoading` state; both can be true simultaneously.
   * @default []
   */
  loadingResourceIds: PropTypes.arrayOf(PropTypes.string),
  /**
   * Minimum width in pixels for each resource column.
   * When the total column width exceeds the available space, horizontal scrolling is enabled.
   * @default 200
   */
  minColumnWidth: PropTypes.number,
  /**
   * Callback fired when the set of pinned columns changes.
   */
  onPinnedResourceIdsChange: PropTypes.func,
  /**
   * Controls how the pinned columns section is visually separated from the
   * scrollable columns.
   * - `'border'` – always shows a thicker divider border.
   * - `'shadow'` – shows a drop-shadow that appears only when content is scrolled.
   * - `'border-and-shadow'` – shows both (default, matches DataGrid behaviour).
   * @default 'border-and-shadow'
   */
  pinnedColumnsSectionSeparator: PropTypes.oneOf(['border-and-shadow', 'border', 'shadow']),
  /**
   * The resource IDs of the columns that are pinned to the left (controlled).
   * Pinned columns always appear immediately after the time axis and stay fixed
   * while the remaining columns scroll horizontally.
   */
  pinnedResourceIds: PropTypes.arrayOf(PropTypes.string),
  /**
   * The duration of each time slot in minutes.
   * Must be a divisor of 60 (e.g. 60, 30, 15).
   * Controls both the time-axis label density and the grid-line frequency.
   * @default 60
   */
  slotDuration: PropTypes.number,
} as any;

export { ResourceDayView };
