# Resumen de Arquitectura e Implementación del Frontend - SoloFlow

Este documento recopila la evolución, decisiones técnicas y el estado actual de la implementación del módulo `frontend/` de **SoloFlow**.

---

## 1. Visión General del Proyecto

SoloFlow es una plataforma de productividad para desarrolladores independientes y contractors que transforma micro-tareas dispersas en narrativas ejecutivas de valor para sus clientes. 

El repositorio organiza el proyecto en dos áreas desacopladas:
- `backend/`: API REST en Node.js + Express (corriendo en `localhost:3000`).
- `frontend/`: Aplicación SPA moderna desarrollada con React, TypeScript, Vite y TanStack Query.

---

## 2. Línea de Tiempo y Fases de Desarrollo

### 🔹 Fase 1: Scaffold Inicial y Capa HTTP Base
- **Configuración de Vite**: Generación de la estructura base del frontend con Vite, React y configuración de proxy inverso en `vite.config.ts` (`/api` redirigido a `http://localhost:3000`).
- **Servicios API**:
  - `draft-log.service`: 5 métodos CRUD (`getAll`, `getById`, `create`, `update`, `remove`) consumiendo `/api/draft-logs`.
  - `client.service`: 5 métodos CRUD (`getAll`, `getById`, `create`, `update`, `remove`) consumiendo `/api/clients`.
  - **Contrato de API respetado**: Operaciones de actualización implementadas estrictamente con `PATCH` (nunca `PUT`) y gestión de respuestas envueltas en el formato estándar `{ status, data }`.

### 🔹 Fase 2: Componentes Core y Prototipo Funcional
- **`DraftLogForm`**:
  - Selector dinámico de clientes poblado mediante `clientService.getAll()`.
  - Campos validados: `description` (requerido), `duration_minutes` (número entero > 0), `status` (`pending`, `grouped`, `discarded`) y `tags` (separados por coma).
  - Captura y muestra de errores del backend (`err.response?.data?.data?.message || err.response?.data?.message`).
  - Emisión del evento `onCreated` para coordinar el refresco reactivo.
- **`DraftLogList`**:
  - Consumo reactivo de `draftLogService.getAll()`.
  - Visualización completa de cada registro: descripción, duración en minutos, chips de estado y tags formateados.
  - Gestión explícita de estados de carga (`loading`), error y lista vacía.
- **Integración en `App`**:
  - Primera pantalla unificada conectando formulario y listado en tiempo real.

### 🔹 Fase 3: Migración a TypeScript y Sistema de Diseño
- **Tipado estricto**: Migración de todo el código a TypeScript (`.ts` / `.tsx`) con configuración en `tsconfig.json`.
- **Modelos de datos (`src/types/`)**:
  - `api.ts`: Envelope estándar `{ status, data }` y tipos de respuesta HTTP.
  - `client.ts`: Interfaces para clientes y tarifas.
  - `draft-log.ts`: Entidad de registros borrador y estados válidos.
  - `milestone.ts`, `report.ts`, `user.ts`: Tipos adicionales para hitos, reportes y sesión.
- **Sistema de diseño (*Sincronía Minimal*)**:
  - Incorporación de tokens semánticos (paleta de superficies oscuras, acentos ámbar/turquesa y escalas de grises) documentados en `frontend/docs/desing/DESIGN.md`.

### 🔹 Fase 4: Arquitectura Empresarial, Capa de Datos Dual y UI Kit
- **Patrón Repositorio y Fuente de Datos Conmutable (`src/data/`)**:
  - Interfaz unificada de repositorios para clientes, logs, hitos, reportes y preferencias.
  - **Dual Source**: Selección mediante la variable de entorno `VITE_DATA_SOURCE`:
    - `mock`: Base de datos en memoria sincronizada con `localStorage` (`db.ts`, `seed.ts`, `repositories.mock.ts`), ideal para desarrollo offline y tests.
    - `http`: Implementación real contra los endpoints Express (`repositories.http.ts`).
- **Lógica de Dominio y Utilidades (`src/domain/`)**:
  - Funciones puras para cálculo y formateo: `duration.ts`, `money.ts`, `week.ts`, `milestone-stats.ts`, `client-color.ts`.
  - Cobertura de pruebas unitarias automatizadas con Vitest (`domain.test.ts` y `repositories.mock.test.ts`).
- **Capa Asíncrona con TanStack Query (`src/hooks/`)**:
  - Centralización de query keys en `query-keys.ts`.
  - Hooks especializados: `useDraftLogs`, `useClients`, `useMilestones`, `useReports`, `usePreferences`, `useUser`.
- **Navegación y Shell de la Aplicación (`src/app/`)**:
  - Enrutador modular con `react-router-dom` (`router.tsx`).
  - Contenedor responsivo `AppShell.tsx` con navegación lateral y cabecera de página contextual (`PageHeader.tsx`).
- **Kit de Primitivas UI Propias (`src/components/ui/`)**:
  - Componentes reutilizables sin dependencias externas pesadas: `Button`, `Chip`, `Display`, `Field`, `SegmentedControl`, `Sheet`, `States`, `Toast`.
- **Estructura por Vistas (`src/features/`)**:
  - Páginas preparadas para cada flujo de trabajo:
    - `capture`: Captura rápida de actividad y micro-tareas.
    - `triage`: Clasificación y asignación de borradores a hitos/clientes.
    - `composer`: Ensamblado de reportes y narrativas de valor.
    - `dispatch`: Despacho y entrega hacia canales externos.
    - `clients`: Gestión de clientes, tarifas y configuración.
    - `reports`: Historial de entregables generados.
    - `settings`: Configuración general y preferencias de usuario.

---

## 3. Estructura de Directorios Actual

```text
frontend/
├── docs/
│   ├── desing/               # Mockups HTML y especificación de tokens de diseño
│   └── resumen.md            # Este documento
├── public/                   # Recursos estáticos
├── src/
│   ├── app/                  # Enrutamiento, Shell y Providers globales
│   │   ├── layout/           # AppShell y PageHeader
│   │   ├── nav.ts            # Configuración de ítems de navegación
│   │   ├── providers.tsx     # TanStack Query Client y providers
│   │   └── router.tsx        # Definición de rutas principales
│   ├── components/
│   │   └── ui/               # Primitivas visuales (Button, Chip, Sheet, Field, etc.)
│   ├── config/               # Variables de entorno tipadas (env.ts)
│   ├── data/                 # Repositorios, Mock DB con seed y cliente HTTP
│   │   ├── http/             # Implementación HTTP de repositorios
│   │   └── mock/             # Mock DB con localStorage y seeds
│   ├── domain/               # Lógica de dominio pura y tests unitarios
│   ├── features/             # Páginas y módulos por funcionalidad (capture, triage, etc.)
│   ├── hooks/                # Custom hooks con TanStack Query
│   ├── services/             # Clientes y adaptadores HTTP base
│   ├── types/                # Definiciones de TypeScript para dominio y API
│   ├── index.css             # Directivas de diseño y variables CSS
│   ├── main.tsx              # Punto de entrada de React
│   └── vite-env.d.ts         # Referencias de tipos de Vite
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Comandos de Trabajo

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Vite (proxy activo hacia `:3000`) |
| `npm run build` | Compila TypeScript y genera el bundle de producción en `dist/` |
| `npm test` | Ejecuta las suites de pruebas unitarias con Vitest |
| `npm run preview` | Previsualiza el build de producción localmente |
