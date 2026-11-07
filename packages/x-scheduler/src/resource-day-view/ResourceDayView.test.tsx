import { act } from '@mui/internal-test-utils';
import { createSchedulerRenderer } from 'test/utils/scheduler';
import { StandaloneResourceDayView } from '@mui/x-scheduler/resource-day-view';
import { eventCalendarClasses } from '@mui/x-scheduler/event-calendar';
import { describe, it, expect } from 'vitest';

const resources = [
  { id: 'room-b', title: 'Room B' },
  { id: 'room-a', title: 'Room A' },
  { id: 'room-c', title: 'Room C' },
];

const events = [
  {
    id: 'a1',
    title: 'Sprint Planning',
    start: '2025-07-01T09:00:00',
    end: '2025-07-01T10:30:00',
    resource: 'room-a',
  },
  {
    id: 'b1',
    title: 'Client Call',
    start: '2025-07-01T11:00:00',
    end: '2025-07-01T12:00:00',
    resource: 'room-b',
  },
  {
    id: 'c1',
    title: 'Other Day',
    start: '2025-07-02T11:00:00',
    end: '2025-07-02T12:00:00',
    resource: 'room-c',
  },
];

const visibleDate = new Date('2025-07-01T00:00:00');

function getColumns() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`.${eventCalendarClasses.resourceDayTimeGridColumn}`),
  );
}

describe('<StandaloneResourceDayView />', () => {
  const { render } = createSchedulerRenderer();

  it('should render one column per resource with only its own events of the visible day', () => {
    render(
      <StandaloneResourceDayView
        events={events}
        resources={resources}
        defaultVisibleDate={visibleDate}
      />,
    );

    const headers = Array.from(
      document.querySelectorAll(`.${eventCalendarClasses.resourceDayTimeGridResourceName}`),
    ).map((element) => element.textContent);
    expect(headers).to.deep.equal(['Room A', 'Room B', 'Room C']);

    const columns = getColumns();
    expect(columns[0].textContent).to.include('Sprint Planning');
    expect(columns[0].textContent).not.to.include('Client Call');
    expect(columns[1].textContent).to.include('Client Call');
    expect(columns[2].textContent).not.to.include('Other Day');
  });

  it('should assign the column resource to an event created from that column', async () => {
    const { user } = render(
      <StandaloneResourceDayView
        events={events}
        resources={resources}
        defaultVisibleDate={visibleDate}
      />,
    );

    // Focus without clicking, so the Enter keypress is the only creation trigger.
    act(() => {
      getColumns()[1].focus();
    });
    await user.keyboard('{Enter}');

    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).to.include('Room B');
    expect(dialog.textContent).not.to.include('No resource');
  });
});
