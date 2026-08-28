import { slotsForDate, bookedSlots } from '../lib/hours';

/**
 * Repopulates a <select> with the slots that day's opening hours actually
 * allow. With markBooked, slots already taken are shown but disabled — seeing
 * that 19:00 has gone is more useful than it silently not being there.
 */
export function bindSlots(dateInput, select, { markBooked = false, emptyLabel = 'Pick a date first' } = {}) {
  function fill() {
    const iso = dateInput.value;
    select.innerHTML = '';
    if (!iso) {
      select.append(new Option(emptyLabel, ''));
      select.disabled = true;
      return;
    }
    const slots = slotsForDate(iso);
    if (slots.length === 0) {
      select.append(new Option('Closed that day', ''));
      select.disabled = true;
      return;
    }
    const taken = markBooked ? bookedSlots(iso) : new Set();
    select.disabled = false;
    select.append(new Option('Choose a time', ''));
    let free = 0;
    for (const slot of slots) {
      const isTaken = taken.has(slot);
      const option = new Option(isTaken ? `${slot} — fully booked` : slot, slot);
      option.disabled = isTaken;
      select.append(option);
      if (!isTaken) free++;
    }
    select.dataset.freeCount = String(free);
    select.dispatchEvent(new CustomEvent('slots:filled', { detail: { free, total: slots.length } }));
  }

  dateInput.addEventListener('change', fill);
  fill();
}

/** Today in the bar's local terms, as an ISO date for an <input type=date>. */
export function todayISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts;
}
