/**
 * One schedule, used three ways: the static hours tables, the live "open now"
 * badge, and the reservation slot list. Everything is computed in the bar's
 * timezone, not the visitor's — someone checking from Berlin still wants to
 * know whether the door in Fitzrovia is open.
 */
export const TIMEZONE = 'Europe/London';

export interface Session {
  /** 0 = Sunday, matching Date.getDay(). */
  day: number;
  label: string;
  open: string;
  close: string;
  /** True when the session runs past midnight into the next day. */
  overnight?: boolean;
}

export const HOURS: Session[] = [
  { day: 1, label: 'Monday', open: '16:00', close: '23:00' },
  { day: 2, label: 'Tuesday', open: '16:00', close: '23:00' },
  { day: 3, label: 'Wednesday', open: '16:00', close: '23:00' },
  { day: 4, label: 'Thursday', open: '16:00', close: '01:00', overnight: true },
  { day: 5, label: 'Friday', open: '16:00', close: '01:00', overnight: true },
  { day: 6, label: 'Saturday', open: '13:00', close: '01:00', overnight: true },
  { day: 0, label: 'Sunday', open: '13:00', close: '22:00' },
];

/** Rows for the hours tables, grouped so identical days collapse. */
export const HOURS_ROWS = [
  { label: 'Mon – Wed', time: '16:00 – 23:00' },
  { label: 'Thu – Fri', time: '16:00 – 01:00' },
  { label: 'Saturday', time: '13:00 – 01:00' },
  { label: 'Sunday', time: '13:00 – 22:00' },
];

export const LAST_ORDERS_MINUTES = 30;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Current weekday and minute-of-day in the bar's timezone. */
export function localNow(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // 24:00 shows up at midnight in some ICU versions.
  const hour = Number(get('hour')) % 24;
  return { day: days.indexOf(get('weekday')), minutes: hour * 60 + Number(get('minute')) };
}

export type OpenState =
  | { open: true; closesAt: string; lastOrders: string; minutesLeft: number }
  | { open: false; opensDay: string; opensAt: string; today: boolean };

export function openState(now: Date = new Date()): OpenState {
  const { day, minutes } = localNow(now);

  // A session that runs past midnight belongs to the previous day, so check
  // yesterday's too before deciding we're shut.
  for (const offset of [0, -1]) {
    const checkDay = (day + offset + 7) % 7;
    const session = HOURS.find((s) => s.day === checkDay);
    if (!session) continue;
    const start = toMinutes(session.open);
    const end = toMinutes(session.close) + (session.overnight ? 24 * 60 : 0);
    const nowMinutes = minutes + (offset === -1 ? 24 * 60 : 0);
    if (nowMinutes >= start && nowMinutes < end) {
      return {
        open: true,
        closesAt: session.close,
        lastOrders: fromMinutes(end - LAST_ORDERS_MINUTES),
        minutesLeft: end - nowMinutes,
      };
    }
  }

  // Shut: find the next session that starts.
  for (let offset = 0; offset < 8; offset++) {
    const checkDay = (day + offset) % 7;
    const session = HOURS.find((s) => s.day === checkDay);
    if (!session) continue;
    if (offset === 0 && minutes >= toMinutes(session.open)) continue;
    return {
      open: false,
      opensDay: offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : session.label,
      opensAt: session.open,
      today: offset === 0,
    };
  }
  return { open: false, opensDay: 'soon', opensAt: '16:00', today: false };
}

function fromMinutes(total: number) {
  const m = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Bookable slots for a given ISO date, respecting that day's hours. */
export function slotsForDate(iso: string): string[] {
  const day = new Date(iso + 'T12:00:00Z').getUTCDay();
  const session = HOURS.find((s) => s.day === day);
  if (!session) return [];
  const start = toMinutes(session.open);
  const end = toMinutes(session.close) + (session.overnight ? 24 * 60 : 0);
  // Last booking is 90 minutes before close — nobody wants a 20-minute table.
  const latest = end - 90;
  const slots: string[] = [];
  for (let m = start; m <= latest; m += 30) slots.push(fromMinutes(m));
  return slots;
}

/**
 * Demo availability. A real build reads this from the booking system; here it
 * is derived from the date so the same day always shows the same slots,
 * instead of flickering on every render.
 */
export function bookedSlots(iso: string): Set<string> {
  let hash = 0;
  for (const ch of iso) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const slots = slotsForDate(iso);
  const taken = new Set<string>();
  for (let i = 0; i < slots.length; i++) {
    if (((hash >> i) & 3) === 0) taken.add(slots[i]);
  }
  return taken;
}
