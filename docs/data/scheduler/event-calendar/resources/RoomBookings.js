import * as React from 'react';
import { StandaloneResourceDayView } from '@mui/x-scheduler/resource-day-view';
import {
  rooms,
  initialEvents,
  defaultVisibleDate,
} from '../../datasets/room-bookings';

const LOADING_DELAY_MS = 1500;

export default function RoomBookings() {
  const [events, setEvents] = React.useState(initialEvents);
  const [visibleRoomIds, setVisibleRoomIds] = React.useState(() =>
    rooms.slice(0, 3).map((r) => r.id),
  );
  const [loadingResourceIds, setLoadingResourceIds] = React.useState([]);

  const visibleRooms = React.useMemo(
    () => rooms.filter((r) => visibleRoomIds.includes(r.id)),
    [visibleRoomIds],
  );

  const handleToggleRoom = React.useCallback(
    (roomId) => {
      const isVisible = visibleRoomIds.includes(roomId);
      if (isVisible) {
        setVisibleRoomIds((prev) => prev.filter((id) => id !== roomId));
        setLoadingResourceIds((prev) => prev.filter((id) => id !== roomId));
      } else {
        setVisibleRoomIds((prev) => [...prev, roomId]);
        setLoadingResourceIds((prev) => [...prev, roomId]);
        setTimeout(() => {
          setLoadingResourceIds((prev) => prev.filter((id) => id !== roomId));
        }, LOADING_DELAY_MS);
      }
    },
    [visibleRoomIds],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '660px',
        width: '100%',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => handleToggleRoom(room.id)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid',
              cursor: 'pointer',
              opacity: visibleRoomIds.includes(room.id) ? 1 : 0.5,
            }}
          >
            {room.title}
          </button>
        ))}
      </div>
      <StandaloneResourceDayView
        events={events}
        onEventsChange={setEvents}
        resources={visibleRooms}
        defaultVisibleDate={defaultVisibleDate}
        loadingResourceIds={loadingResourceIds}
      />
    </div>
  );
}
