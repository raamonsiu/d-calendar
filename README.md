# D-Calendar

Calendar, tasks and habits on a single screen. React Native app built with Expo,
from the prototype and handoff in `pre-info/`.

The interface is in Spanish, because that is what the design specifies. Code,
comments and documentation are in English.

## Getting started

```bash
npm install
```

```bash
npx expo start
```

Press `a` to open on Android (emulator or device with Expo Go). The design is
laid out for 412×892, so Android is the reference.

## What is in it

| Route | Screen |
|---|---|
| `/` | Home: calendar box (today / week / expanded day / expanded month), tasks, habits and side menu |
| `/create` | Create an event, a task or a habit |
| `/item/[id]` | Item detail: the same form in edit mode, with Delete |
| `/settings` | Settings |
| `/settings/calendars` | Connected accounts and connectors |
| `/help` | Help and feedback |
| `/help/[slug]` | Help article |
| `/about` | About the app and the developer |
| `/legal/[slug]` | Privacy policy and terms of use |
| `/legal/licenses` | Open source licences |

## Data status

**What the app makes is stored on the device.** The store
(`src/store/useAppStore.ts`) is persisted with AsyncStorage, so what you create
survives closing the app. There is no OAuth and no upload of its own: what leaves
the phone is what gets written to a calendar of the device, and from there the
account syncs it. Adding an account leads out to the system settings, which is
where accounts are actually added.

Guests are real in the one place they can be: an event created in a calendar of
the device that accepts attendees : a Google or an Outlook one, on Android : is
written with them, and the account that syncs the calendar is what mails the
invitation. In a calendar of the app the guest is still just a note, and the form
says so under the list.

One thing is still mock: exporting generates no file.

The next iteration replaces that layer with the real connection; the UI should
not change.

## Reminders

**These are real.** The reminders of an event, a task or a habit are scheduled as
local notifications on the device, with no server anywhere: the operating system
holds the queue and fires it with the app closed. The rules live in
`src/lib/notifications.ts` and the platform side in `src/services/`.

## Calendars of the device

Also real. The events of whatever calendars the phone already syncs : Google,
Outlook, iCloud : are read with `expo-calendar` and shown next to the app's own.
No OAuth and no server: the operating system already keeps those accounts in
sync, so it is enough to read its calendar database.

It is not read only. An event the user owns can be edited and deleted, and a new
one can be created in any calendar the system allows, from where the account
syncs it on its own. Their inherited reminders are off by default, because the
calendar they came from already announces them.

## Calendars by URL

Also real. A calendar published as an `.ics` : a course timetable, a holiday
calendar, the secret iCal address of a Google calendar : is downloaded and read
with `ical.js`, with its time zones and its recurrence rules. It is read only:
there is nowhere in a file served over HTTP to write.

They are downloaded when the app starts, when it returns to the foreground and
when the side menu's refresh is pulled, and what was read is stored, so the
calendar is still there with no signal.

## Tests

`npm test` (or `npx jest`) runs the test suite: 96 assertions across 6 files,
colocated as `*.test.ts` next to the module they cover.

```bash
npm test
```

They are unit tests of plain functions : no emulator, no device, nothing
rendered on a screen. Each one feeds a function a value and checks what comes
back: "if the guest list has these two people and the form now has only one of
them, which one does `guestDiff` say to remove?". They catch a wrong decision
before it reaches a real calendar; they cannot catch a button drawn in the
wrong colour or an animation that stutters : that still means opening the app.

What they cover: whose event it is and whether it can be edited
(`calendarSources.test.ts`), the read window's month boundaries
(`calendarWindow.test.ts`), where an event lands on the hour grid and how
all-day events are split out of it (`selectors.test.ts`, `AllDayChip.test.ts`),
parsing a device event's id and reconciling its guest list on a save
(`deviceCalendars.test.ts`), and whether Guardar has anything to save at all
(`useItemForm.test.ts`). Not covered yet: the `.ics` parser
(`src/lib/ics.ts`) : time zones, recurrence and its exceptions have no tests of
their own so far.

Expected outputt on a clean run:

```
PASS src/lib/calendarSources.test.ts
PASS src/lib/calendarWindow.test.ts
PASS src/store/selectors.test.ts
PASS src/features/home/AllDayChip.test.ts
PASS src/services/deviceCalendars.test.ts
PASS src/features/create/useItemForm.test.ts

Test Suites: 6 passed, 6 total
Tests:       96 passed, 96 total
```

A failure names the file, the test and the exact value it got versus the one it
expected : that is usually enough to tell whether the test was wrong or the
code was. `npm run test:watch` re-runs on every save, which is the faster loop
while changing one of the covered files.

## Commands

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

```bash
npx jest
```

```bash
npx expo export --platform android
```

## Documentation

- [AGENTS.md](AGENTS.md) : code conventions and design rules.
- [docs/CONTEXT.md](docs/CONTEXT.md) : layer map, settled decisions and known
  traps. It is the starting point for any new task.
- `pre-info/handoff.md` : the designer's specification.
