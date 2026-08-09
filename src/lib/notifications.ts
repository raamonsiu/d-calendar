/**
 * Planning of the local reminders.
 *
 * This module decides *what* has to be notified and *when*, and nothing else:
 * talking to the system is `src/services/notifications.ts`. Keeping the two
 * apart means every rule here is a pure function that can be reasoned about
 * without a device.
 *
 * The plan is rebuilt whole instead of being kept up to date one item at a
 * time, because iOS only keeps the 64 soonest pending requests per app: what
 * reaches the system is a rolling window over the near future, not every
 * reminder that will ever fire. A repeating trigger takes a single slot however
 * many times it fires, which is why habits use one.
 */
import {
  MS_PER_DAY,
  addDays,
  formatLongDate,
  formatTime,
  isSameDay,
  startOfDay,
  withTime,
} from '@/lib/date';
import { isWeeklyFrequency } from '@/lib/habits';
import type { CalEvent, Habit, RelativeReminder, Task } from '@/types';

/** How far ahead reminders are scheduled. */
export const HORIZON_DAYS = 30;

/**
 * How many notifications the plan may hold. iOS drops everything past 64
 * pending requests, so the margin leaves room for the debug ones and for
 * anything the system counts that we do not.
 */
export const PENDING_LIMIT = 60;

/**
 * Time of day an all-day event or a task without a time is announced at. Events
 * with no time start at midnight, and a reminder at midnight is a reminder
 * nobody reads.
 */
export const ALL_DAY_HOUR = 9;

const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;

/** Multiplier of each `ReminderUnit`: 0 minutes, 1 hours, 2 days. */
const REMINDER_UNIT_MS = [MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY];

/**
 * When a planned notification fires. A date fires once; the other two repeat on
 * their own, which is how a habit costs one slot instead of one per day.
 *
 * `weekday` is a `getDay()` index (0 = Sunday), the same one the model uses.
 */
export type PlannedTrigger =
  | { kind: 'date'; at: number }
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekday: number; hour: number; minute: number };

/**
 * Prefix the id of every planned notification starts with, one per item type.
 *
 * The queue is shared with anything else the app may schedule, so the sync only
 * touches what it recognises as its own instead of emptying it wholesale.
 */
const PLANNED_ID_PREFIXES = ['event:', 'task:', 'habit:'];

/**
 * Whether a notification already in the system was put there by the planner.
 *
 * Postcondition: false for any id the planner did not build, which is what
 * keeps the sync from cancelling notifications it does not own.
 *
 * @param identifier Id the notification was scheduled with.
 */
export const isPlannedId = (identifier: string) =>
  PLANNED_ID_PREFIXES.some((prefix) => identifier.startsWith(prefix));

/** A notification the system should be holding, with its own stable id. */
export type PlannedNotification = {
  /**
   * Deterministic: the same reminder of the same item always produces the same
   * id, so two rebuilds of an unchanged plan are indistinguishable.
   */
  id: string;
  title: string;
  body: string;
  /** Item the notification opens when tapped. */
  itemId: string;
  trigger: PlannedTrigger;
};

/**
 * Data the plan is built from.
 *
 * Precondition: `events` are the ones from the checked calendars
 * (`visibleEvents`); a hidden calendar does not notify.
 */
export type NotificationPlanInput = {
  events: CalEvent[];
  tasks: Task[];
  habits: Habit[];
};

/**
 * Milliseconds a relative reminder fires before the item it belongs to.
 *
 * Precondition: `reminder.unit` is a `ReminderUnit` and `reminder.value` is 0
 * or more. Postcondition: never negative, so a reminder never lands after the
 * thing it announces.
 *
 * @param reminder Reminder as the form stores it.
 */
export function reminderLeadMs(reminder: RelativeReminder) {
  return Math.max(0, reminder.value) * REMINDER_UNIT_MS[reminder.unit];
}

/** The same day of `day` at a given hour, minutes and seconds at zero. */
function atHour(day: Date, hour: number) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
}

/**
 * Lowercases the first letter, to drop a label into the middle of a sentence.
 */
function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * When something happens, as the body of a notification reads it: "Hoy ·
 * 09:30", "Mañana · 09:30" or "Miércoles 5 agosto · 09:30".
 *
 * The day is named relative to `firesAt` and not to the moment the plan is
 * built, because that is when the text gets read: a reminder two days ahead of
 * an event must not say "Hoy".
 *
 * Precondition: `instant` and `firesAt` are instants in ms. Postcondition: the
 * time is left out of all-day items, which have none.
 *
 * @param instant When the item happens.
 * @param firesAt When the notification arrives.
 * @param allDay Whether the item takes the whole day.
 */
function whenLabel(instant: number, firesAt: number, allDay: boolean) {
  const date = new Date(instant);
  const fireDay = startOfDay(new Date(firesAt));

  let dayLabel = formatLongDate(date);
  if (isSameDay(date, fireDay)) dayLabel = 'Hoy';
  else if (isSameDay(date, addDays(fireDay, 1))) dayLabel = 'Mañana';

  if (allDay) return `${dayLabel}, todo el día`;
  return `${dayLabel} · ${formatTime(date)}`;
}

/**
 * Whether a repeating event falls on a given day.
 *
 * Precondition: `event.repeat` is not 'No'. Postcondition: a weekly event with
 * no weekdays chosen falls on the weekday of its first occurrence, and a
 * monthly one simply does not happen in months that are too short.
 *
 * @param event Event whose rule is being read.
 * @param day Candidate day.
 * @param firstOccurrence First occurrence of the event.
 */
function repeatsOnDay(event: CalEvent, day: Date, firstOccurrence: Date) {
  if (event.repeat === 'Cada día') return true;
  if (event.repeat === 'Días de la semana') {
    const weekdays =
      event.weekdays.length > 0 ? event.weekdays : [firstOccurrence.getDay()];
    return weekdays.includes(day.getDay());
  }
  return day.getDate() === firstOccurrence.getDate();
}

/**
 * Instants an event happens at inside a window.
 *
 * Every occurrence keeps the time of day of the first one; only the day moves.
 *
 * Precondition: `from` is 1 or more and `to` is 1 or more; both are instants in
 * ms. Postcondition: returns them in ascending order, at most one per day, and
 * an empty list when the event does not reach the window.
 *
 * @param event Event to expand.
 * @param from Start of the window, inclusive.
 * @param to End of the window, inclusive.
 */
export function eventOccurrences(event: CalEvent, from: number, to: number) {
  if (event.repeat === 'No') {
    const withinWindow = event.startsAt >= from && event.startsAt <= to;
    return withinWindow ? [event.startsAt] : [];
  }

  const firstOccurrence = new Date(event.startsAt);
  const firstDay = startOfDay(new Date(Math.max(from, event.startsAt)));
  const dayCount = Math.ceil((to - firstDay.getTime()) / MS_PER_DAY);

  const occurrences: number[] = [];
  for (let dayOffset = 0; dayOffset <= dayCount; dayOffset += 1) {
    const day = addDays(firstDay, dayOffset);
    const instant = withTime(day, firstOccurrence).getTime();
    if (instant < from || instant > to) continue;
    if (repeatsOnDay(event, day, firstOccurrence)) occurrences.push(instant);
  }
  return occurrences;
}

/**
 * Reminders of one event that fall inside the window.
 *
 * Occurrences are looked for further ahead than the window itself, because a
 * reminder several days early belongs to an event that has not entered it yet.
 *
 * Postcondition: returns an empty list for an event with no reminders, which is
 * the normal case: the design does not add any by default.
 *
 * @param event Event to plan.
 * @param now Moment the plan is built; anything earlier is already past.
 * @param horizonEnd Last instant a notification may fire at.
 */
function planEvent(event: CalEvent, now: number, horizonEnd: number) {
  if (event.reminders.length === 0) return [];

  const leads = event.reminders.map(reminderLeadMs);
  const occurrences = eventOccurrences(
    event,
    now,
    horizonEnd + Math.max(...leads),
  );

  const planned: PlannedNotification[] = [];
  for (const occurrence of occurrences) {
    const instant = event.allDay
      ? atHour(new Date(occurrence), ALL_DAY_HOUR).getTime()
      : occurrence;

    for (const reminder of event.reminders) {
      const firesAt = instant - reminderLeadMs(reminder);
      if (firesAt <= now || firesAt > horizonEnd) continue;

      planned.push({
        id: `event:${event.id}:${occurrence}:${reminder.id}`,
        title: event.title,
        body: whenLabel(instant, firesAt, event.allDay),
        itemId: event.id,
        trigger: { kind: 'date', at: firesAt },
      });
    }
  }
  return planned;
}

/**
 * Reminders of one task that fall inside the window.
 *
 * Postcondition: returns an empty list for a task that is done, has no exact
 * date or has no reminders. A task with only an approximate month has nothing
 * to schedule against.
 *
 * @param task Task to plan.
 * @param now Moment the plan is built.
 * @param horizonEnd Last instant a notification may fire at.
 */
function planTask(task: Task, now: number, horizonEnd: number) {
  if (task.done || task.dueAt == null || task.reminders.length === 0) return [];

  const dueAt = task.hasTime
    ? task.dueAt
    : atHour(new Date(task.dueAt), ALL_DAY_HOUR).getTime();

  const planned: PlannedNotification[] = [];
  for (const reminder of task.reminders) {
    const firesAt = dueAt - reminderLeadMs(reminder);
    if (firesAt <= now || firesAt > horizonEnd) continue;

    planned.push({
      id: `task:${task.id}:${reminder.id}`,
      title: task.title,
      body: `Vence ${lowerFirst(whenLabel(dueAt, firesAt, !task.hasTime))}`,
      itemId: task.id,
      trigger: { kind: 'date', at: firesAt },
    });
  }
  return planned;
}

/**
 * Body of a habit reminder, which says what the habit asks for rather than when
 * it happens: a repeating reminder has no single date to name.
 *
 * @param habit Habit to describe.
 */
function habitBody(habit: Habit) {
  switch (habit.frequency) {
    case 'Diario':
      return 'Recordatorio diario';
    case 'Semanal':
      return 'Recordatorio semanal';
    case 'X por día':
      return `${habit.target} veces al día`;
    case 'X por semana':
      return `${habit.target} veces a la semana`;
  }
}

/**
 * Reads the "09:00" of a habit reminder.
 *
 * Postcondition: returns null when the text is not a time of day, so a broken
 * value is skipped instead of scheduling something at an unexpected hour.
 *
 * @param time Time of day in "HH:MM" format.
 */
function parseClock(time: string) {
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Reminders of one habit, as repeating triggers.
 *
 * A weekly habit with weekdays chosen repeats once a week per weekday; every
 * other case repeats daily, including a weekly habit with no day marked.
 *
 * Postcondition: the result does not depend on the current date, because these
 * triggers are not rescheduled as time passes.
 *
 * @param habit Habit to plan.
 */
function planHabit(habit: Habit) {
  const planned: PlannedNotification[] = [];

  for (const reminder of habit.reminders) {
    const clock = parseClock(reminder.time);
    if (!clock) continue;

    const content = {
      title: habit.name,
      body: habitBody(habit),
      itemId: habit.id,
    };

    const weekly =
      isWeeklyFrequency(habit.frequency) && habit.weekdays.length > 0;
    if (!weekly) {
      planned.push({
        ...content,
        id: `habit:${habit.id}:${reminder.id}`,
        trigger: { kind: 'daily', ...clock },
      });
      continue;
    }

    for (const weekday of habit.weekdays) {
      planned.push({
        ...content,
        id: `habit:${habit.id}:${reminder.id}:${weekday}`,
        trigger: { kind: 'weekly', weekday, ...clock },
      });
    }
  }
  return planned;
}

/**
 * When a planned notification fires, for sorting purposes.
 *
 * Postcondition: repeating triggers come out as 0, which is why only dated ones
 * are ever sorted with this.
 *
 * @param plan Notification to read.
 */
const firesAt = (plan: PlannedNotification) =>
  plan.trigger.kind === 'date' ? plan.trigger.at : 0;

/**
 * The whole set of notifications the system should be holding.
 *
 * Habits go in first because they repeat: they cost one slot each and cover the
 * entire horizon, while events and tasks cost one slot per occurrence. The rest
 * of the budget goes to whatever fires soonest, so dropping something always
 * means dropping the furthest away, which the next rebuild will pick up.
 *
 * Precondition: `events` only contains events of checked calendars.
 * Postcondition: at most `PENDING_LIMIT` notifications, none of them in the
 * past, and the ids are unique.
 *
 * @param input Events, tasks and habits to plan for.
 * @param now Moment the plan is built, in ms.
 */
export function planNotifications(
  input: NotificationPlanInput,
  now: number,
): PlannedNotification[] {
  const horizonEnd = now + HORIZON_DAYS * MS_PER_DAY;

  const repeating = input.habits.flatMap(planHabit);
  const dated = [
    ...input.events.flatMap((event) => planEvent(event, now, horizonEnd)),
    ...input.tasks.flatMap((task) => planTask(task, now, horizonEnd)),
  ].sort((first, second) => firesAt(first) - firesAt(second));

  const room = Math.max(0, PENDING_LIMIT - repeating.length);
  return [...repeating, ...dated.slice(0, room)];
}

/**
 * Signature of a plan, to tell whether the system queue is already correct.
 *
 * Rebuilding means cancelling and scheduling dozens of notifications, so it is
 * worth skipping when the store changed something the plan does not depend on.
 *
 * Postcondition: two plans share a signature only when they hold the same
 * notifications, with the same texts, in the same order.
 *
 * @param plan Plan to summarise.
 */
export function planSignature(plan: PlannedNotification[]) {
  return plan
    .map((notification) =>
      [
        notification.id,
        notification.title,
        notification.body,
        JSON.stringify(notification.trigger),
      ].join('|'),
    )
    .join(',');
}
