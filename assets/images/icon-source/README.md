# Icono D-Calendar — 2a·2

Marca: marco de calendario con anillas, trazo de 72/1024, punto del día en lila.
Fondo `#4E1F6E` · tinta `#f4f1f7` · acento `#c4a8e0`.
Rejilla de 1024×1024. Los SVG son la fuente; los PNG están rasterizados desde ellos.

| Archivo | Uso |
|---|---|
| `icon.svg` / `icon.png` | Icono principal (iOS y web). A sangre, sin transparencia — iOS aplica su propia máscara. |
| `adaptive-icon-foreground.svg` / `adaptive-icon.png` | Capa de primer plano de Android. Transparente, arte al 75% para respetar la zona segura circular. |
| `adaptive-icon-background.svg` | Capa de fondo de Android. Es solo el morado plano: en `app.json` basta con `backgroundColor`. |
| `monochrome-icon.svg` / `.png` | Icono temático de Android 13+. Blanco sobre transparente; el sistema lo tiñe. |
| `splash-icon.svg` / `.png` | Pantalla de carga. Arte al 62% sobre el morado que pone el splash. |
| `notification-icon.svg` / `.png` | Notificaciones de Android. Blanco puro sobre transparente, 96px. |
| `favicon.png` | Web, 48px. |

## app.json

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "monochromeImage": "./assets/monochrome-icon.png",
        "backgroundColor": "#4E1F6E"
      }
    },
    "ios": { "icon": "./assets/icon.png" },
    "web": { "favicon": "./assets/favicon.png" },
    "plugins": [
      ["expo-splash-screen", {
        "image": "./assets/splash-icon.png",
        "backgroundColor": "#4E1F6E",
        "imageWidth": 200
      }],
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#4E1F6E"
      }]
    ]
  }
}
```

## Notas

- El morado de marca (`#4E1F6E`) es solo del icono y del splash. Dentro de la app manda el acento configurable en Ajustes (rojo `#e5252f` por defecto).
- Si hace falta el icono sobre fondo claro, usa la tinta `#4E1F6E` sobre transparente en lugar del blanco roto.
- Para regenerar los PNG basta rasterizar los SVG a 1024 (96 en notificación, 48 en favicon); son la única fuente de verdad.
