declare module 'react-big-calendar' {
  import { ReactNode, ComponentType } from 'react';

  export interface Event {
    id?: string | number;
    title: ReactNode;
    start: Date;
    end: Date;
    [key: string]: any;
  }

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action?: 'select' | 'click' | 'doubleClick';
  }

  export interface Localizer {
    format: (value: Date | number, format: string, culture?: string) => string;
    parse: (value: string, format: string, culture?: string) => Date;
    startOf: (value: Date, unit: string, culture?: string) => Date;
  }

  export function dateFnsLocalizer(options: {
    format: (value: Date | number, format: string, culture?: string) => string;
    parse: (value: string, format: string, culture?: string) => Date;
    startOf: (value: Date, unit: string, culture?: string) => Date;
    getDay: (value: Date) => number;
    locales: any;
  }): Localizer;

  export interface CalendarProps {
    events: Event[];
    localizer: Localizer;
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    defaultView?: 'month' | 'week' | 'work_week' | 'day' | 'agenda';
    views?: Array<'month' | 'week' | 'work_week' | 'day' | 'agenda'>;
    onSelectEvent?: (event: Event) => void;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    selectable?: boolean;
    popup?: boolean;
    eventPropGetter?: (event: Event) => { style: React.CSSProperties };
  }

  export const Calendar: ComponentType<CalendarProps>;
}
