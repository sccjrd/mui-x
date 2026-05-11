import { useEventOccurrencesGroupedByDay } from '@usi-inside-tmp/x-scheduler-headless/use-event-occurrences-grouped-by-day';
import { SchedulerProcessedDate } from '@usi-inside-tmp/x-scheduler-headless/models';

export interface MonthViewWeekRowProps {
  maxEvents: number;
  days: SchedulerProcessedDate[];
  occurrencesMap: useEventOccurrencesGroupedByDay.ReturnValue;
  firstDayRef: React.Ref<HTMLDivElement | null> | undefined;
}
