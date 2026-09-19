# webapp-ligaventureros

Aplicación web de la Liga de Aventureros de Vigo, una asociación de rol y juegos de mesa. Permite a los jugadores iniciar sesión, gestionar su perfil y consultar sus partidas, y a los administradores gestionar usuarios, sistemas de juego y la configuración del servidor.

## Funcionalidades

- **Cuentas múltiples**: es posible tener varias sesiones activas a la vez y cambiar entre ellas desde el menú lateral.
- **Inicio de sesión** con email/contraseña o con Google.
- **Perfil de usuario**: avatar, nombre, contraseña y eliminación de cuenta.
- **Roles**: usuario normal, VIP, master y administrador, con acceso condicionado a distintas secciones.
- **Panel de administración**:
  - Gestión de usuarios (roles, bloqueos temporales/permanentes, suplantación de usuario).
  - Configuración de ajustes del servidor.
  - Registro de subidas de ficheros.
  - Gestión de sistemas de juego: tipos de partida, tiers por nivel, especies y clases.
- **Tema claro/oscuro** configurable, con opción de seguir el del sistema.
- Enlaces a las redes sociales y a la página de apoyo en Ko-fi de la asociación.

## Stack técnico

- React 19 + React Router 7
- Vite 8 + TypeScript 5
- lucide-react + ionicons (logos de marca oficiales)
- Oxlint

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Scripts

- `npm run dev`: servidor de desarrollo (Vite).
- `npm run build`: build de producción (`tsc -b && vite build`).
- `npm run preview`: sirve el build de producción localmente.
- `npm run lint`: lint con Oxlint.

## Build

```bash
npm run build
```

Salida en `dist/`.

## Configuración de entorno

Archivo: `src/config/environment.ts`

Variables principales:

- `appName`
- `version`
- `api`

## Estructura relevante

```text
src/
  components/
    admin/
      EntityCrudList.tsx
      EntityFormModal.tsx
    AppMenu.tsx
    LoginModal.tsx
    SettingsModal.tsx
    WhatsappQrModal.tsx
    FileUploadModal.tsx
  context/
    UserContext.tsx
    ThemeContext.tsx
    PageHeaderContext.tsx
    ToastContext.tsx
    ConfirmContext.tsx
  routes/
    guards.tsx
  layouts/
    TabsLayout.tsx
  pages/
    admin/
    master/
    users/
    HomePage.tsx
  services/
    apiService.ts
    storageService.ts
  styles/
    global.css
  config/
    environment.ts
```

## Licencia

Este software se distribuye bajo licencia GNU GPL v3.0.

Consulta:

- `LICENSE`
- `ThirdPartyNotices`
