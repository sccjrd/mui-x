import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { TemporalSupportedObject } from '@usi-inside-tmp/x-scheduler-headless/models';
import { useAdapterContext } from '@usi-inside-tmp/x-scheduler-headless/use-adapter-context';
import { useSchedulerStoreContext } from '@usi-inside-tmp/x-scheduler-headless/use-scheduler-store-context';
import { schedulerPreferenceSelectors } from '@usi-inside-tmp/x-scheduler-headless/scheduler-selectors';
import { formatHourAndMinutes } from '../utils/date-utils';

export function useFormatTime() {
  // Context hooks
  const adapter = useAdapterContext();
  const store = useSchedulerStoreContext();

  // Selector hooks
  const ampm = useStore(store, schedulerPreferenceSelectors.ampm);

  return React.useCallback(
    (date: TemporalSupportedObject) => {
      return formatHourAndMinutes(date, adapter, ampm);
    },
    [adapter, ampm],
  );
}
