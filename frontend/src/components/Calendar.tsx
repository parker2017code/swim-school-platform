// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import deDE from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales: any = { 'de': deDE };
// @ts-ignore
const localizer = dateFnsLocalizer({
  format: (date: any, formatStr: string) => format(date, formatStr, { locale: deDE }),
  parse: (dateStr: string, formatStr: string) => parse(dateStr, formatStr, new Date(), { locale: deDE }),
  startOfWeek: () => startOfWeek(new Date()),
  getDay: (date: any) => getDay(date),
  locales
});

interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

interface CalendarComponentProps {
  locationId: string;
  onEventSelect: (event: any) => void;
  token?: string;
  isAdmin?: boolean;
}

export default function CalendarComponent({ locationId, onEventSelect, token, isAdmin }: CalendarComponentProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!locationId) return;

    fetchCalendarEvents();
  }, [locationId]);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const url = `/api/calendar/${locationId}?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      const response = await fetch(url);
      const data = await response.json();

      const transformed = data.map((event: any) => ({
        id: event.id,
        title: `${event.courseName} (${event.enrolledCount}/${event.maxCapacity})`,
        start: new Date(event.start),
        end: new Date(event.end),
        resource: event
      }));

      setEvents(transformed);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    }
    setLoading(false);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    onEventSelect(event);
  };

  const handleSelectSlot = (slotInfo: any) => {
    if (isAdmin) {
      // Show form to create new session
      console.log('Create new session:', slotInfo.start);
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#667eea';
    if (event.resource?.status === 'full') backgroundColor = '#ff6b6b';
    if (event.resource?.status === 'cancelled') backgroundColor = '#aaa';

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div style={{ height: '600px', marginTop: '20px' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading calendar...</div>
      ) : (
        // @ts-ignore
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={isAdmin}
          popup
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
        />
      )}
    </div>
  );
}
