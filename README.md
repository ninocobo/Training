# Rutina Glúteo

App móvil para tu rutina de glúteo y pierna: lista de ejercicios por día, enlace a un vídeo de referencia, registro de series (kg y reps) con historial de la última vez, y un cronómetro de descanso.

Todo el stack es gratuito: **GitHub** (código), **Neon** (Postgres gratis) y **Render** (hosting gratis).

## Stack técnico

- **Backend**: Node.js + Express (`server.js`) — API REST para leer/guardar sesiones de entrenamiento en Postgres.
- **Frontend**: Angular 22 (standalone components, signals, `OnPush`) + Tailwind CSS 4, en `frontend/`.
- **Base de datos**: PostgreSQL en Neon.

El servidor Express sirve tanto la API (`/api/...`) como los archivos ya compilados de Angular (`frontend/dist/frontend/browser`). Por eso el paso de build (`npm run build`) es imprescindible antes de arrancar en producción.

## 1. Base de datos gratuita en Neon

1. Crea una cuenta en https://neon.tech (gratis, no pide tarjeta).
2. Crea un proyecto nuevo, por ejemplo `rutina`.
3. En el panel del proyecto copia el **connection string** (botón "Connect"). Tiene esta forma:
   `postgres://usuario:password@ep-xxxxx.eu-central-1.aws.neon.tech/rutina?sslmode=require`
4. Guárdalo, lo necesitarás en el paso 3.

No hace falta crear tablas a mano: el servidor las crea solo la primera vez que arranca.

## 2. Subir el proyecto a GitHub

Desde esta carpeta:

```bash
git init
git add .
git commit -m "Rutina gluteo: app inicial"
```

Crea un repositorio vacío en https://github.com/new (por ejemplo `rutina-gluteo`, puede ser privado) y luego:

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/rutina-gluteo.git
git push -u origin main
```

## 3. Desplegar en Render (gratis)

1. Crea una cuenta en https://render.com (puedes entrar con tu cuenta de GitHub).
2. "New +" → "Web Service" → conecta el repositorio `rutina-gluteo`.
3. Configuración:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. En "Environment Variables" añade:
   - `DATABASE_URL` = el connection string de Neon del paso 1.
   - `NODE_VERSION` = `24` (Angular 22 necesita Node 22.22+, 24.15+ o 26+; el free tier de Render usa por defecto una versión más antigua si no se lo indicas).
5. Crea el servicio. Render instala dependencias, compila el frontend de Angular, arranca la app y te da una URL tipo `https://rutina-gluteo.onrender.com`.

`npm run build` instala las dependencias de `frontend/` y ejecuta `ng build`, dejando los archivos listos en `frontend/dist/frontend/browser`, que es justo lo que `server.js` sirve. Cada vez que hagas `git push` a `main`, Render repite este proceso automáticamente — no hace falta configurar nada más para el despliegue continuo. El workflow en `.github/workflows/ci.yml` comprueba que el proyecto instala, que `server.js` no tiene errores de sintaxis y que el build de Angular termina correctamente, antes de que Render lo despliegue.

**Nota sobre el plan gratuito de Render**: si la app está varios minutos sin recibir visitas, "se duerme" y la primera petición tarda 30-60 segundos en responder mientras se despierta. Es normal, en el móvil solo notarás una carga inicial algo lenta.

## 4. Usarla en el móvil

1. Abre la URL de Render en el navegador del móvil.
2. Menú del navegador → "Añadir a pantalla de inicio" (o "Instalar app"). Queda como un icono normal, a pantalla completa.

## Desarrollo local

Backend + build de producción de Angular:

```bash
npm install
cp .env.example .env   # y pon tu DATABASE_URL de Neon
npm run build           # compila el frontend de Angular
npm start
```

Abre http://localhost:3000

Para trabajar en el frontend con recarga en caliente (llamando igualmente a la API en `http://localhost:3000`):

```bash
npm run dev:frontend    # arranca `ng serve` en http://localhost:4200
```
