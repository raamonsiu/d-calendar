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

**Everything is mock and lives in memory.** The store
(`src/store/useAppStore.ts`) starts seeded with the events, tasks, habits,
accounts and calendars from the prototype, and returns to that state when the app
is closed. Creating or editing something only writes locally: there is no OAuth,
no upload to Google/iCloud and no scheduled notifications. "Añadir cuenta o
calendario" and "Añadir invitado" are sheets that add the source to local state.

The next iteration replaces that layer with the real connection; the UI should
not change.

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
