import * as React from 'react';
import { StandaloneResourceDayView } from '@mui/x-scheduler/resource-day-view';
import { rooms, initialEvents, defaultVisibleDate } from '../../datasets/room-bookings';

export default function RoomBookings() {
  const [events, setEvents] = React.useState(initialEvents);

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <StandaloneResourceDayView
        events={events}
        onEventsChange={setEvents}
        resources={rooms}
        defaultVisibleDate={defaultVisibleDate}
      />
    </div>
  );
}
