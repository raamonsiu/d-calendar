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

## Data status

**Everything is mock, but it is stored on the device.** On a fresh install the
store (`src/store/useAppStore.ts`) is seeded with the events, tasks, habits,
accounts and calendars from the prototype; from there on it is persisted with
AsyncStorage, so what you create survives closing the app. Creating or editing
something only writes locally: there is no OAuth and no upload to Google/iCloud.
"Añadir cuenta o calendario" and "Añadir invitado" are sheets that add the source
to local state.

The next iteration replaces that layer with the real connection; the UI should
not change.

## Reminders

**These are real.** The reminders of an event, a task or a habit are scheduled as
local notifications on the device, with no server anywhere: the operating system
holds the queue and fires it with the app closed. The rules live in
`src/lib/notifications.ts` and the platform side in `src/services/`.

## Calendars of the device

Also real. The events of whatever calendars the phone already syncs — Google,
Outlook, iCloud — are read with `expo-calendar` and shown next to the app's own.
No OAuth and no server: the operating system already keeps those accounts in
sync, so it is enough to read its calendar database.

It is not read only. An event the user owns can be edited and deleted, and a new
one can be created in any calendar the system allows, from where the account
syncs it on its own. Their inherited reminders are off by default, because the
calendar they came from already announces them.

## Commands

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

```bash
npx expo export --platform android
```

## Documentation

- [AGENTS.md](AGENTS.md) — code conventions and design rules.
- [docs/CONTEXT.md](docs/CONTEXT.md) — layer map, settled decisions and known
  traps. It is the starting point for any new task.
- `pre-info/handoff.md` — the designer's specification.
