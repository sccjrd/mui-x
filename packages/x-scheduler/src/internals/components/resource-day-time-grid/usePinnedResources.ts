'use client';
import * as React from 'react';
import useControlled from '@mui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { SchedulerResource } from '@mui/x-scheduler-internals/models';
import type { ExportedResourceDayTimeGridProps } from './ResourceDayTimeGrid.types';

type PinnedColumnsSeparator = NonNullable<
  ExportedResourceDayTimeGridProps['pinnedColumnsSectionSeparator']
>;

const EMPTY_IDS: string[] = [];

/**
 * Manages which resource columns are pinned, and returns the columns with the pinned ones first.
 * Pinned columns keep the order of `columns`, not the order in which they were pinned.
 */
export function usePinnedResources<TColumn extends { resource: SchedulerResource }>(
  parameters: usePinnedResources.Parameters<TColumn>,
): usePinnedResources.ReturnValue<TColumn> {
  const { columns, pinnedResourceIds, defaultPinnedResourceIds, onPinnedResourceIdsChange } =
    parameters;

  const [pinnedIds, setPinnedIds] = useControlled({
    controlled: pinnedResourceIds,
    default: defaultPinnedResourceIds ?? EMPTY_IDS,
    name: 'ResourceDayView',
    state: 'pinnedResourceIds',
  });

  const togglePinned = useStableCallback((resourceId: string) => {
    const nextPinnedIds = pinnedIds.includes(resourceId)
      ? pinnedIds.filter((id) => id !== resourceId)
      : [...pinnedIds, resourceId];
    setPinnedIds(nextPinnedIds);
    onPinnedResourceIdsChange?.(nextPinnedIds);
  });

  const sortedColumns = React.useMemo(() => {
    const pinned = columns.filter((column) => pinnedIds.includes(column.resource.id));
    const scrollable = columns.filter((column) => !pinnedIds.includes(column.resource.id));

    // Only the rendered pinned columns count, so a pinned resource that is hidden
    // doesn't move the separator.
    return [
      ...pinned.map((column, index) => ({
        ...column,
        pinnedIndex: index,
        isLastPinned: index === pinned.length - 1,
      })),
      ...scrollable.map((column) => ({ ...column, pinnedIndex: undefined, isLastPinned: false })),
    ];
  }, [columns, pinnedIds]);

  const hasPinnedColumns = sortedColumns.length > 0 && sortedColumns[0].pinnedIndex !== undefined;

  return { columns: sortedColumns, hasPinnedColumns, togglePinned };
}

export namespace usePinnedResources {
  export interface Parameters<TColumn> extends Pick<
    ExportedResourceDayTimeGridProps,
    'pinnedResourceIds' | 'defaultPinnedResourceIds' | 'onPinnedResourceIdsChange'
  > {
    /**
     * The columns to render, in their default order.
     */
    columns: readonly TColumn[];
  }

  export interface ReturnValue<TColumn> {
    /**
     * The columns with the pinned ones first.
     */
    columns: (TColumn & PinnedColumnState)[];
    /**
     * Whether at least one rendered column is pinned.
     */
    hasPinnedColumns: boolean;
    /**
     * Pins the column of the resource, or unpins it if it is already pinned.
     */
    togglePinned: (resourceId: string) => void;
  }
}

export interface PinnedColumnState {
  /**
   * The position of the column among the pinned columns, `undefined` when the column scrolls.
   */
  pinnedIndex: number | undefined;
  /**
   * Whether the column is the last pinned one, which carries the separator.
   */
  isLastPinned: boolean;
}

/**
 * Returns the data attributes and the sticky position shared by a pinned header cell and its column.
 */
export function getPinnedColumnProps(column: PinnedColumnState, separator: PinnedColumnsSeparator) {
  if (column.pinnedIndex === undefined) {
    return {};
  }

  return {
    'data-pinned': true,
    'data-last-pinned': column.isLastPinned || undefined,
    'data-separator-border': (column.isLastPinned && separator !== 'shadow') || undefined,
    'data-separator-shadow': (column.isLastPinned && separator !== 'border') || undefined,
    style: {
      position: 'sticky',
      // Pinned columns have the minimum width, since the grid only scrolls when every column does.
      left: `calc(var(--fixed-cell-width) + ${column.pinnedIndex} * var(--min-column-width))`,
    } as React.CSSProperties,
  };
}

/**
 * Shows the shadows of the sticky edge while the grid is scrolled horizontally.
 * The last pinned column carries the shadow when there is one, otherwise the time axis does.
 */
export function usePinnedColumnsScrollShadow(
  scrollRef: React.RefObject<HTMLElement | null>,
  parameters: { enabled: boolean; hasPinnedColumns: boolean },
) {
  const { enabled, hasPinnedColumns } = parameters;

  React.useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) {
      return undefined;
    }

    const updateShadows = () => {
      const isScrolled = element.scrollLeft > 0;
      element.style.setProperty('--shadow-opacity', isScrolled && hasPinnedColumns ? '1' : '0');
      element.style.setProperty(
        '--axis-shadow-opacity',
        isScrolled && !hasPinnedColumns ? '1' : '0',
      );
    };

    // Also runs on pin changes, without waiting for the next scroll.
    updateShadows();
    element.addEventListener('scroll', updateShadows, { passive: true });
    return () => element.removeEventListener('scroll', updateShadows);
  }, [scrollRef, enabled, hasPinnedColumns]);
}
