import type { SchedulerProcessedDay } from '@mui/x-scheduler-internals/models';

export interface ResourceDayTimeGridProps extends ExportedResourceDayTimeGridProps {
  /**
   * The day to render resource columns for.
   */
  day: SchedulerProcessedDay;
}

export interface ExportedResourceDayTimeGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The height in pixels of each hour slot in the time grid.
   * Increasing this value zooms in on the time axis.
   * @default 80
   */
  hourHeight?: number;
  /**
   * Fixed width in pixels for each resource column.
   * When set, columns will not grow or shrink beyond this value and horizontal scrolling is enabled.
   * Takes precedence over `minColumnWidth`.
   */
  columnWidth?: number;
  /**
   * Minimum width in pixels for each resource column.
   * When the total column width exceeds the available space, horizontal scrolling is enabled.
   * @default 200
   */
  minColumnWidth?: number;
  /**
   * The duration of each time slot in minutes.
   * Must be a divisor of 60 (e.g. 60, 30, 15).
   * Controls both the time-axis label density and the grid-line frequency.
   * @default 60
   */
  slotDuration?: number;
  /**
   * Inclusive start of the hour range displayed in the time grid (whole hour between 0 and 24).
   * @default 0
   */
  startTime?: number;
  /**
   * Exclusive end of the hour range displayed in the time grid (whole hour between 0 and 24).
   * @default 24
   */
  endTime?: number;
  /**
   * The hour the grid scrolls to when it first renders. Must be a displayed hour.
   * @default 7 when it is a displayed hour, otherwise `startTime`
   */
  initialScrollTime?: number;
  /**
   * The resource IDs of the columns that are pinned to the left (controlled).
   * Pinned columns always appear immediately after the time axis and stay fixed
   * while the remaining columns scroll horizontally.
   */
  pinnedResourceIds?: string[];
  /**
   * The resource IDs to pin by default when the component first mounts (uncontrolled).
   * @default []
   */
  defaultPinnedResourceIds?: string[];
  /**
   * Callback fired when the set of pinned columns changes.
   */
  onPinnedResourceIdsChange?: (ids: string[]) => void;
  /**
   * Controls how the pinned columns section is visually separated from the
   * scrollable columns.
   * - `'border'` – always shows a thicker divider border.
   * - `'shadow'` – shows a drop-shadow that appears only when content is scrolled.
   * - `'border-and-shadow'` – shows both (default, matches DataGrid behaviour).
   * @default 'border-and-shadow'
   */
  pinnedColumnsSectionSeparator?: 'border' | 'shadow' | 'border-and-shadow';
  /**
   * IDs of resource columns that are currently loading their data.
   * Only those columns show a skeleton; already-loaded columns are unaffected.
   * This is independent of the global `isLoading` state; both can be true simultaneously.
   * @default []
   */
  loadingResourceIds?: string[];
}
