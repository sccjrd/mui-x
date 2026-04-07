// Room Bookings Dataset — used by ResourceDayView demos

export const defaultVisibleDate = new Date('2025-07-01T00:00:00');

export const rooms = [
  { id: 'room-a', title: 'Room A', eventColor: 'blue' },
  { id: 'room-b', title: 'Room B', eventColor: 'purple' },
  { id: 'room-c', title: 'Room C', eventColor: 'teal' },
  { id: 'room-d', title: 'Room D', eventColor: 'orange' },
  { id: 'room-e', title: 'Room E', eventColor: 'pink' },
];

export const initialEvents = [
  // Room A
  {
    id: 'ra-1',
    title: 'Sprint Planning',
    start: '2025-07-01T09:00:00',
    end: '2025-07-01T10:30:00',
    resource: 'room-a',
  },
  {
    id: 'ra-2',
    title: 'Design Review',
    start: '2025-07-01T11:00:00',
    end: '2025-07-01T12:00:00',
    resource: 'room-a',
  },
  {
    id: 'ra-3',
    title: 'All-hands',
    start: '2025-07-01T14:00:00',
    end: '2025-07-01T15:30:00',
    resource: 'room-a',
  },
  // Room B
  {
    id: 'rb-1',
    title: '1:1 with Manager',
    start: '2025-07-01T09:30:00',
    end: '2025-07-01T10:00:00',
    resource: 'room-b',
  },
  {
    id: 'rb-2',
    title: 'Product Demo',
    start: '2025-07-01T13:00:00',
    end: '2025-07-01T14:00:00',
    resource: 'room-b',
  },
  {
    id: 'rb-3',
    title: 'Hiring Interview',
    start: '2025-07-01T15:00:00',
    end: '2025-07-01T16:00:00',
    resource: 'room-b',
  },
  // Room C
  {
    id: 'rc-1',
    title: 'Client Call',
    start: '2025-07-01T10:00:00',
    end: '2025-07-01T11:00:00',
    resource: 'room-c',
  },
  {
    id: 'rc-2',
    title: 'Team Lunch',
    start: '2025-07-01T12:00:00',
    end: '2025-07-01T13:00:00',
    resource: 'room-c',
  },
  {
    id: 'rc-3',
    title: 'Roadmap Review',
    start: '2025-07-01T14:30:00',
    end: '2025-07-01T16:00:00',
    resource: 'room-c',
  },
  // Room D
  {
    id: 'rd-1',
    title: 'Engineering Sync',
    start: '2025-07-01T09:00:00',
    end: '2025-07-01T09:45:00',
    resource: 'room-d',
  },
  {
    id: 'rd-2',
    title: 'Security Training',
    start: '2025-07-01T11:00:00',
    end: '2025-07-01T13:00:00',
    resource: 'room-d',
  },
  {
    id: 'rd-3',
    title: 'Retro',
    start: '2025-07-01T16:00:00',
    end: '2025-07-01T17:00:00',
    resource: 'room-d',
  },
  // Room E
  {
    id: 're-1',
    title: 'Onboarding',
    start: '2025-07-01T09:00:00',
    end: '2025-07-01T12:00:00',
    resource: 'room-e',
  },
  {
    id: 're-2',
    title: 'UX Workshop',
    start: '2025-07-01T13:30:00',
    end: '2025-07-01T15:30:00',
    resource: 'room-e',
  },
];
