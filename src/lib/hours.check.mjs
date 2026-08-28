// Self-check for the opening-hours logic: run `node src/lib/hours.check.mjs`.
// The overnight sessions and the "what opens next" walk are the parts that
// break quietly, so they get pinned here.
import assert from 'node:assert/strict';
import { openState, slotsForDate, localNow } from './hours.ts';

// A UTC instant that lands on a known London wall-clock time. August is BST
// (UTC+1), January is GMT, so both offsets get exercised.
const at = (iso) => new Date(iso);

// Thursday 27 Aug 2026, 21:00 London (20:00Z) — open until 01:00.
let s = openState(at('2026-08-27T20:00:00Z'));
assert.equal(s.open, true, 'Thursday evening should be open');
assert.equal(s.closesAt, '01:00');
assert.equal(s.lastOrders, '00:30');

// Friday 00:30 London (23:30Z Thursday) — still Thursday's overnight session.
s = openState(at('2026-08-27T23:30:00Z'));
assert.equal(s.open, true, 'after midnight is still the previous session');
assert.equal(s.closesAt, '01:00');

// Friday 04:20 London — shut, opens later the same day.
s = openState(at('2026-08-28T03:20:00Z'));
assert.equal(s.open, false);
assert.equal(s.today, true);
assert.equal(s.opensAt, '16:00');

// Monday 15:00 London — shut, opens at four today.
s = openState(at('2026-08-31T14:00:00Z'));
assert.equal(s.open, false);
assert.equal(s.opensAt, '16:00');
assert.equal(s.today, true);

// Sunday 23:00 London — shut (closed 22:00), next open is Monday.
s = openState(at('2026-08-30T22:00:00Z'));
assert.equal(s.open, false);
assert.equal(s.today, false);
assert.equal(s.opensDay, 'tomorrow');

// Winter, so GMT rather than BST: Wednesday 20:00 London = 20:00Z.
s = openState(at('2027-01-13T20:00:00Z'));
assert.equal(s.open, true, 'GMT half of the year should behave the same');
assert.equal(s.closesAt, '23:00');

// Closing-soon window drives the amber dot.
s = openState(at('2026-08-31T21:45:00Z')); // Monday 22:45 London, closes 23:00
assert.equal(s.open, true);
assert.ok(s.minutesLeft <= 60, 'should report the closing-soon window');

// Slots respect the day's hours and stop 90 minutes before close.
assert.deepEqual(slotsForDate('2026-08-31').at(0), '16:00');   // Monday
assert.deepEqual(slotsForDate('2026-08-31').at(-1), '21:30');  // 23:00 - 90m
assert.deepEqual(slotsForDate('2026-09-05').at(0), '13:00');   // Saturday
assert.deepEqual(slotsForDate('2026-09-05').at(-1), '23:30');  // 01:00 - 90m

// localNow reads the bar's clock, not the machine's.
const { day } = localNow(at('2026-08-28T03:20:00Z'));
assert.equal(day, 5, 'Friday');

console.log('hours: all checks passed');
