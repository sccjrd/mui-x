import type { DateLocale } from '@usi-inside-tmp/x-scheduler-headless/use-adapter';

export interface DateLocaleTheme {
  components: {
    MuiEventCalendar: {
      defaultProps: {
        dateLocale: DateLocale;
      };
    };
    MuiEventTimeline: {
      defaultProps: {
        dateLocale: DateLocale;
      };
    };
  };
}

export const createDateLocaleTheme = (dateFnsLocale: DateLocale): DateLocaleTheme => ({
  components: {
    MuiEventCalendar: {
      defaultProps: {
        dateLocale: dateFnsLocale,
      },
    },
    MuiEventTimeline: {
      defaultProps: {
        dateLocale: dateFnsLocale,
      },
    },
  },
});
