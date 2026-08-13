# Contributing to D-Calendar

Thanks for taking the time. This is a small project, so the process is short.

## Before you open a pull request

Run these locally. All three must pass, with no failures and no new warnings:

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run lint
```

A pull request that does not build or whose tests fail will not be reviewed
until it does - the same workflow runs on every PR anyway, so you save a round
trip by catching it first.

If your change is large enough to be worth a look before you write it, open an
issue and describe it. That is cheaper for both of us than a rejected PR.

## Keep it reviewable

**Small pull requests.** One change per PR. A PR that renames things, fixes a
bug and adds a feature is three PRs wearing a coat, and it will be sent back to
be split. If a diff cannot be reviewed in one sitting, it is too big.

**No drive-by reformatting.** Do not reformat code you are not otherwise
touching: it buries the real change in noise. If a file genuinely needs
reformatting, that is its own PR.

## Code conventions

The codebase follows a few rules consistently. New code is expected to match
what is already around it.

### Structure

```
src/app/          expo-router routes (composition only)
src/features/     per-screen blocks (home, create, calendars, settings, onboarding)
src/ui/           reusable primitives, no domain logic
src/theme/        tokens, preferences and typography
src/lib/          pure helpers: dates, habits, notifications, text
src/store/        state (zustand), seed data and selectors
src/services/     platform side effects (notifications, device calendars)
src/data/         static content (help, changelog, translations)
```

Dependencies point inwards: `app` → `features` → `ui` → `theme` and `lib`.
Neither `lib`, nor `theme`, nor `ui` knows about the store or any particular
screen. `services` is the exception: it is where the app talks to the operating
system, so it may read `store` and `lib`, and it is imported by `app` and by
the `features` blocks that need the system. What may never import it is `ui`,
`theme` or `lib` - a primitive that reaches for the OS stops being reusable.

### Naming

- `camelCase` for variables and functions, `PascalCase` for components and
  types, `SCREAMING_SNAKE_CASE` for module constants.
- Descriptive, complete names, including in loops and callbacks: `index`,
  `event`, `calendar`, `rowIndex`. Not `i`, `e`, `c`. The only accepted
  abbreviation is `id`.
- No abbreviating in constants either: `HOUR_WIDTH`, not `HOUR_W`.

### Comments

- **No inline comments.** Anything that needs explaining goes in a JSDoc block
  right before the function, component, type or constant.
- Logic functions: JSDoc saying what they do, the **precondition**, the
  **postcondition** and one `@param` per parameter. When there is nothing to
  precondition that line is dropped, but the postcondition almost always says
  something useful: what it returns in the empty case, whether it mutates its
  input, what range the result has.
- UI components: a short JSDoc with what they draw and what is drawn
  conditionally.
- Every file in `src/app/` opens with a block stating what the screen is for,
  how you get there and where it leads.

### Values

- Colours, radii, durations and repeated measurements come from
  `src/theme/tokens.ts`. **A hex literal outside that file is a bug.**
- The accent is not in the tokens: it is a user preference, read with
  `useAccent()`.
- Font sizes are the documented exception - they are written literally in each
  component, because the design specifies them element by element. The global
  adjustment is the `TYPE_SCALE` token.

### React

- Every animation goes through `useDuration()`, which returns 0 when the user
  turns on "reduce animations" or when the system asks for it.
- Text goes through `<AppText>` / `<Label>` from `src/theme/Text.tsx`, never
  React Native's `Text`.
- No components defined inside another component - they remount on every
  render. They go at module level.
- State derived from props is adjusted during render, not in a `useEffect`.
- Icons are imported from `src/ui/icons.ts`. The deep paths in that file are
  deliberate: importing from the package index pulls ~1500 icons into the
  bundle.

### Store

- No screen reads or writes data on its own: everything goes through
  `useAppStore` actions.
- Every action makes **exactly one** `set` call, so no intermediate state is
  ever visible.
- Domain rules live in `src/lib` or `src/store/selectors.ts` as pure functions,
  not inside the component that draws them.

### Translations

User-facing strings live in `src/data/translations/<area>.ts` and are read with
`useTranslation()`'s `t('area.key')`. Every language must be filled in for any
new key.

What never changes is the union values the store persists (`'Diario'`,
`'Lunes'`, `'Ocupado'`…): those stay their original Spanish literal regardless
of the active language, because they are data, not copy. Only their *displayed*
label depends on the language, through the `*Label` helpers in
`src/data/translations/domain.ts`.

## Tests

Tests are Jest, colocated as `*.test.ts` next to the module they cover, and
they import the real exports rather than a copy of the logic.

They are unit tests of plain functions - no emulator, no device, nothing
rendered. If you add domain logic, add a test for it. If the logic is trapped
inside a rendering hook, it is worth exporting or extracting it purely so a
test can reach it.

## Pull request template

Every PR must fill in the template. A workflow checks that each section exists
and is not empty - it is a plain text check, and it only looks at whether you
filled the sections in, not at what you wrote.

The sections are:

- **TYPE** - one of `FEATURE`, `FIX`, `DOCS`, `REFACTOR`, `TEST`, `CHORE`.
- **WHY** - why this change is needed or wanted. The problem, not the solution.
- **SHORT DESCRIPTION** - one or two lines. What a reviewer reads first.
- **LONG DESCRIPTION** - what you actually did, and anything a reviewer needs
  to know: decisions taken, trade-offs, what you deliberately left out.

## Reporting bugs

[Open an issue](https://github.com/raamonsiu/d-calendar/issues/new) with:

- What you did, what you expected, what happened instead.
- Your Android version and the app version (Settings › About).
- Whether it reproduces every time or only sometimes.

## Licence

By contributing you agree that your contribution is licensed under the
[MIT Licence](LICENSE), the same as the rest of the project.
