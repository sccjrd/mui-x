import { warnOnce } from '@mui/x-internals/warning';

const DEFAULT_SLOT_DURATION = 60;

/**
 * Resolves and validates the duration of the time slots, in minutes.
 *
 * Every hour must hold a whole number of slots, so the duration must be a whole number of minutes
 * that divides 60. Otherwise, it falls back to one slot per hour and warns in development.
 */
export function getSlotDuration(slotDuration: number | undefined, source: string): number {
  if (slotDuration === undefined) {
    return DEFAULT_SLOT_DURATION;
  }

  const isValid =
    Number.isInteger(slotDuration) &&
    slotDuration > 0 &&
    DEFAULT_SLOT_DURATION % slotDuration === 0;

  if (!isValid) {
    if (process.env.NODE_ENV !== 'production') {
      warnOnce(
        [
          `MUI X Scheduler: \`${source}\` received an invalid \`slotDuration\` (${slotDuration}).`,
          'The time slots would not line up with the hours, so the time axis and the grid lines would be misplaced.',
          '`slotDuration` must be a whole number of minutes that divides 60, such as 60, 30, 15 or 10.',
          'Falling back to 60.',
        ].join('\n'),
      );
    }
    return DEFAULT_SLOT_DURATION;
  }

  return slotDuration;
}
