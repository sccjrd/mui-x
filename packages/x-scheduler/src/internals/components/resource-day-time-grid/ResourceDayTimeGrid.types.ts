import { SchedulerProcessedDate } from '@mui/x-scheduler-headless/models';

export interface ResourceDayTimeGridProps extends ExportedResourceDayTimeGridProps {
  /**
   * The day to render resource columns for.
   */
  day: SchedulerProcessedDate;
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
   * @default 150
   */
  minColumnWidth?: number;
}
