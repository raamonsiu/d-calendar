# D-Calendar

Calendario, tareas y hábitos en una sola pantalla. App en React Native con
Expo, construida a partir del prototipo y el handoff que hay en `pre-info/`.

## Arrancar

```bash
npm install
```

```bash
npx expo start
```

Pulsa `a` para abrir en Android (emulador o dispositivo con Expo Go). El diseño
está pensado a 412×892, así que Android es la referencia.

## Qué hay

| Ruta | Pantalla |
|---|---|
| `/` | Home: caja de calendario (hoy / semana / día expandido / mes expandido), tareas, hábitos y menú lateral |
| `/create` | Crear evento, tarea o hábito |
| `/item/[id]` | Ficha del elemento: el mismo formulario en modo edición, con Eliminar |
| `/settings` | Ajustes |
| `/settings/calendars` | Cuentas conectadas y conectores |
| `/help` | Ayuda y comentarios |
| `/help/[slug]` | Artículo de ayuda |
| `/about` | Acerca de la app y el desarrollador |

## Estado de los datos

**Todo es mock y vive en memoria.** El store (`src/store/useAppStore.ts`)
arranca sembrado con los eventos, tareas, hábitos, cuentas y calendarios del
prototipo, y vuelve a ese estado al cerrar la app. Crear o editar algo escribe
solo en local: no hay OAuth, ni subida a Google/iCloud, ni notificaciones
programadas. «Añadir cuenta o calendario» y «Añadir invitado» son sheets que
añaden la fuente al estado local.

La siguiente iteración sustituye esa capa por la conexión real; la UI no
debería cambiar.

## Comandos

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

Convenciones de código y reglas del diseño: [AGENTS.md](AGENTS.md).
