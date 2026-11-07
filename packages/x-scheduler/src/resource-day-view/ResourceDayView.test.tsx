import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  clientYForTime,
  createSchedulerRenderer,
  mockElementBounds,
  simulateDragAndDrop,
} from 'test/utils/scheduler';
import { isJSDOM } from 'test/utils/skipIf';
import { StandaloneResourceDayView } from '@mui/x-scheduler/resource-day-view';
import { eventCalendarClasses } from '@mui/x-scheduler/event-calendar';
import { describe, it, expect, vi } from 'vitest';

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

function getHeaderCells() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      `.${eventCalendarClasses.resourceDayTimeGridHeaderCell}`,
    ),
  );
}

function getHeaderTitles() {
  return getHeaderCells().map(
    (cell) =>
      cell.querySelector(`.${eventCalendarClasses.resourceDayTimeGridResourceName}`)!.textContent,
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

  describe('pinning', () => {
    it('should move a pinned column first and mark it as the last pinned one (uncontrolled)', async () => {
      const { user } = render(
        <StandaloneResourceDayView
          events={events}
          resources={resources}
          defaultVisibleDate={visibleDate}
        />,
      );

      const pinButton = screen.getByRole('button', { name: 'Pin Room C' });
      expect(pinButton).to.have.attribute('aria-pressed', 'false');

      await user.click(pinButton);

      expect(getHeaderTitles()).to.deep.equal(['Room C', 'Room A', 'Room B']);
      expect(screen.getByRole('button', { name: 'Unpin Room C' })).to.have.attribute(
        'aria-pressed',
        'true',
      );
      const [pinnedHeader, otherHeader] = getHeaderCells();
      expect(pinnedHeader).to.have.attribute('data-pinned');
      expect(pinnedHeader).to.have.attribute('data-last-pinned');
      expect(pinnedHeader.style.position).to.equal('sticky');
      expect(otherHeader).not.to.have.attribute('data-pinned');

      const [pinnedColumn, otherColumn] = getColumns();
      expect(pinnedColumn).to.have.attribute('data-last-pinned');
      expect(pinnedColumn.style.position).to.equal('sticky');
      expect(otherColumn).not.to.have.attribute('data-pinned');

      await user.click(screen.getByRole('button', { name: 'Unpin Room C' }));
      expect(getHeaderTitles()).to.deep.equal(['Room A', 'Room B', 'Room C']);
    });

    it('should start with the default pinned resources', () => {
      render(
        <StandaloneResourceDayView
          events={events}
          resources={resources}
          defaultVisibleDate={visibleDate}
          defaultPinnedResourceIds={['room-c', 'room-b']}
        />,
      );

      // Pinned columns keep the resource order, not the pinning order.
      expect(getHeaderTitles()).to.deep.equal(['Room B', 'Room C', 'Room A']);
      const [first, second, third] = getHeaderCells();
      expect(first).to.have.attribute('data-pinned');
      expect(first).not.to.have.attribute('data-last-pinned');
      expect(second).to.have.attribute('data-last-pinned');
      expect(third).not.to.have.attribute('data-pinned');
    });

    it('should only report the change when controlled', async () => {
      const onPinnedResourceIdsChange = vi.fn();
      const { user } = render(
        <StandaloneResourceDayView
          events={events}
          resources={resources}
          defaultVisibleDate={visibleDate}
          pinnedResourceIds={['room-b']}
          onPinnedResourceIdsChange={onPinnedResourceIdsChange}
        />,
      );

      expect(getHeaderTitles()).to.deep.equal(['Room B', 'Room A', 'Room C']);

      await user.click(screen.getByRole('button', { name: 'Pin Room A' }));

      expect(onPinnedResourceIdsChange.mock.calls).to.deep.equal([[['room-b', 'room-a']]]);
      expect(getHeaderTitles()).to.deep.equal(['Room B', 'Room A', 'Room C']);
      expect(getHeaderCells()[1]).not.to.have.attribute('data-pinned');
    });

    it('should mark the last visible pinned column when a pinned resource is not rendered', () => {
      render(
        <StandaloneResourceDayView
          events={events}
          resources={resources.filter((resource) => resource.id !== 'room-c')}
          defaultVisibleDate={visibleDate}
          pinnedResourceIds={['room-b', 'room-c']}
        />,
      );

      const [first] = getHeaderCells();
      expect(first).to.have.attribute('data-last-pinned');
      expect(getColumns()[0]).to.have.attribute('data-last-pinned');
    });
  });

  it('should only show the loading skeleton in the loading resource columns', () => {
    render(
      <StandaloneResourceDayView
        events={events}
        resources={resources}
        defaultVisibleDate={visibleDate}
        loadingResourceIds={['room-a']}
      />,
    );

    const [roomA, roomB] = getColumns();
    expect(roomA.querySelector(`.${eventCalendarClasses.eventSkeleton}`)).not.to.equal(null);
    expect(roomA.textContent).not.to.include('Sprint Planning');
    expect(roomB.querySelector(`.${eventCalendarClasses.eventSkeleton}`)).to.equal(null);
    expect(roomB.textContent).to.include('Client Call');
  });

  it('should render one time-axis cell per slot, with sub-hour slots marked as minor', () => {
    render(
      <StandaloneResourceDayView
        events={events}
        resources={resources}
        defaultVisibleDate={visibleDate}
        slotDuration={30}
      />,
    );

    const cells = Array.from(
      document.querySelectorAll(`.${eventCalendarClasses.resourceDayTimeGridTimeAxisCell}`),
    );
    expect(cells).to.have.length(48);
    expect(cells[0].textContent).to.equal('');
    expect(cells[1].textContent).to.include('12:30');
    expect(cells[1]).to.have.attribute('data-minor');
    expect(cells[2].textContent).to.include('1:00');
    expect(cells[2]).not.to.have.attribute('data-minor');
  });

  describe('hour range', () => {
    const eventsWithEarlyMeeting = [
      ...events,
      {
        id: 'a0',
        title: 'Early Standup',
        start: '2025-07-01T06:00:00',
        end: '2025-07-01T06:30:00',
        resource: 'room-a',
      },
    ];

    it('should only render the hours between startTime and endTime', () => {
      render(
        <StandaloneResourceDayView
          events={eventsWithEarlyMeeting}
          resources={resources}
          defaultVisibleDate={visibleDate}
          startTime={8}
          endTime={18}
        />,
      );

      const cells = Array.from(
        document.querySelectorAll(`.${eventCalendarClasses.resourceDayTimeGridTimeAxisCell}`),
      );
      expect(cells).to.have.length(10);
      expect(cells[0].textContent).to.equal('');
      expect(cells[1].textContent).to.include('9:00');

      const [roomA] = getColumns();
      expect(roomA.textContent).to.include('Sprint Planning');
      expect(roomA.textContent).not.to.include('Early Standup');
    });

    it.skipIf(isJSDOM)('should scroll to initialScrollTime', () => {
      render(
        <div style={{ height: 400 }}>
          <StandaloneResourceDayView
            events={events}
            resources={resources}
            defaultVisibleDate={visibleDate}
            startTime={6}
            initialScrollTime={9}
          />
        </div>,
      );

      const scroller = document.querySelector<HTMLElement>(
        `.${eventCalendarClasses.resourceDayTimeGridBody}`,
      )!;
      // 3 hours after `startTime`, at the default hour height of 80px.
      expect(scroller.scrollTop).to.equal(240);
    });
  });

  describe('accessibility', () => {
    it('should expose a grid with a header row and a row of resource columns', () => {
      render(
        <StandaloneResourceDayView
          events={events}
          resources={resources}
          defaultVisibleDate={visibleDate}
        />,
      );

      const grid = screen.getByRole('grid');
      expect(grid).to.have.attribute('aria-rowcount', '2');
      expect(grid).to.have.attribute('aria-colcount', '3');

      const [headerRow, columnsRow] = screen.getAllByRole('row');
      expect(headerRow).to.have.attribute('aria-rowindex', '1');
      expect(columnsRow).to.have.attribute('aria-rowindex', '2');

      const headers = screen.getAllByRole('columnheader');
      expect(headers.map((header) => header.getAttribute('aria-colindex'))).to.deep.equal([
        '1',
        '2',
        '3',
      ]);
      expect(headers[0].textContent).to.include('Room A');

      const cells = screen.getAllByRole('gridcell');
      expect(cells.map((cell) => cell.getAttribute('aria-colindex'))).to.deep.equal([
        '1',
        '2',
        '3',
      ]);
    });

    it('should use the localeText for the pin buttons, which do not submit forms', () => {
      render(
        <StandaloneResourceDayView
          events={events}
          resources={resources}
          defaultVisibleDate={visibleDate}
          defaultPinnedResourceIds={['room-b']}
          localeText={{
            pinResourceColumn: (resourceTitle) => `Épingler ${resourceTitle}`,
            unpinResourceColumn: (resourceTitle) => `Désépingler ${resourceTitle}`,
          }}
        />,
      );

      expect(screen.getByRole('button', { name: 'Épingler Room A' })).to.have.attribute(
        'type',
        'button',
      );
      expect(screen.getByRole('button', { name: 'Désépingler Room B' })).to.have.attribute(
        'type',
        'button',
      );
    });
  });

  it('should warn and fall back to one slot per hour when slotDuration does not divide 60', () => {
    expect(() =>
      render(
        <StandaloneResourceDayView
          events={events}
          resources={resources}
          defaultVisibleDate={visibleDate}
          slotDuration={7}
        />,
      ),
    ).toWarnDev('MUI X Scheduler: `ResourceDayView` received an invalid `slotDuration` (7).');

    expect(
      document.querySelectorAll(`.${eventCalendarClasses.resourceDayTimeGridTimeAxisCell}`),
    ).to.have.length(24);
  });

  describe('drag and drop', () => {
    function setUpDraggableView() {
      const onEventsChange = vi.fn();
      render(
        <StandaloneResourceDayView
          events={events}
          resources={resources}
          defaultVisibleDate={visibleDate}
          onEventsChange={onEventsChange}
        />,
      );
      // 1px per minute of the day, so a time maps to a `clientY`.
      getColumns().forEach((column) => {
        mockElementBounds(column, { top: 0, height: 1440, width: 200 });
      });
      return onEventsChange;
    }

    function getUpdatedEvent(onEventsChange: ReturnType<typeof vi.fn>, id: string) {
      expect(onEventsChange.mock.calls.length).to.equal(1);
      return onEventsChange.mock.calls[0][0].find((event: { id: string }) => event.id === id);
    }

    it('should move an event to the resource of the column it is dropped in', async () => {
      const onEventsChange = setUpDraggableView();
      const [, roomB] = getColumns();

      await act(async () => {
        simulateDragAndDrop({
          source: screen.getByRole('button', { name: /Sprint Planning/ }),
          target: roomB,
          targetClientY: clientYForTime(0, 24, 14),
        });
      });

      const updatedEvent = getUpdatedEvent(onEventsChange, 'a1');
      expect(updatedEvent.resource).to.equal('room-b');
      expect(new Date(updatedEvent.start).getUTCHours()).not.to.equal(9);
    });

    it('should keep the resource when an event is moved within its column', async () => {
      const onEventsChange = setUpDraggableView();
      const [roomA] = getColumns();

      await act(async () => {
        simulateDragAndDrop({
          source: screen.getByRole('button', { name: /Sprint Planning/ }),
          target: roomA,
          targetClientY: clientYForTime(0, 24, 14),
        });
      });

      const updatedEvent = getUpdatedEvent(onEventsChange, 'a1');
      expect(updatedEvent.resource).to.equal('room-a');
      expect(new Date(updatedEvent.start).getUTCHours()).not.to.equal(9);
    });
  });

  describe('right-to-left', () => {
    it('should show the pinned columns shadow when scrolled in right-to-left', async () => {
      const { user } = render(
        <ThemeProvider theme={createTheme({ direction: 'rtl' })}>
          <div dir="rtl">
            <StandaloneResourceDayView
              events={events}
              resources={resources}
              defaultVisibleDate={visibleDate}
            />
          </div>
        </ThemeProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Pin Room C' }));

      const scroller = document.querySelector<HTMLElement>(
        `.${eventCalendarClasses.resourceDayTimeGridBody}`,
      )!;
      expect(scroller.style.getPropertyValue('--shadow-opacity')).to.equal('0');

      // Browsers report a negative `scrollLeft` once a right-to-left element is scrolled.
      Object.defineProperty(scroller, 'scrollLeft', { configurable: true, value: -120 });
      fireEvent.scroll(scroller);

      expect(scroller.style.getPropertyValue('--shadow-opacity')).to.equal('1');
      expect(scroller.style.getPropertyValue('--axis-shadow-opacity')).to.equal('0');
    });
  });
});
