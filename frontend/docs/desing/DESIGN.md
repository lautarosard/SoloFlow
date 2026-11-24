---
name: Sincronía Minimal
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#8ed5ff'
  on-tertiary: '#00354a'
  tertiary-container: '#38bdf8'
  on-tertiary-container: '#004965'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-ui:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-tablet: 1rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

Este sistema de diseño está concebido para profesionales técnicos de alto rendimiento, ingenieros de software independientes y consultores que operan bajo modalidades por objetivos y horas facturables. El diseño articula un minimalismo técnico y táctil: depurado, sin ornamentos superfluos, enfocado en reducir la fatiga cognitiva durante jornadas extensas frente a múltiples pantallas.

La dirección estética combina una base monocromática de grafito y carbón profundo con micro-contrastes luminosos de alta precisión. La respuesta emocional debe ser de control quirúrgico, calma analítica y certeza operativa: cada interacción transmite ligereza, velocidad de respuesta instantánea y solidez estructural. No se emplean gradientes decorativos ni efectos difusos invasivos; la sofisticación se alcanza mediante la precisión métrica en el espaciado, la nitidez tipográfica y la jerarquía por luminancia.

## Colors

El sistema opera primordialmente en modo oscuro profundo con una jerarquía estricta basada en luminancia para cumplir con WCAG AAA en textos críticos y WCAG AA en controles secundarios:

- **Neutral Base (Fondo y Estructura)**:
  - `canvas-default`: `#0B0F19` (negro carbón con matiz pizarra profunda).
  - `surface-subtle`: `#111827` (elevación 1 para micro-tarjetas y contenedores de listas).
  - `surface-raised`: `#1E293B` (elevación 2 para módulos interactivos, modales y chips inactivos).
  - `border-hairline`: `rgba(255, 255, 255, 0.08)` (delimitación sin peso visual).
  - `border-focus`: `rgba(255, 255, 255, 0.20)` (bordes activos).

- **Texto y Contrastes**:
  - `text-primary`: `#F8FAFC` (contraste superior a 14:1 contra el canvas).
  - `text-secondary`: `#94A3B8` (información contextual, metadatos y etiquetas secundarias).
  - `text-muted`: `#64748B` (placeholders y estados desactivados).

- **Acentos Funcionales**:
  - **Primario (Ámbar Cálido / Cobre)**: `#F59E0B` (con variante `#D97706` para presionado y `#FEF3C7` para texto sobre acento). Utilizado exclusivamente para cronómetros activos, balance financiero facturable y acciones primarias de confirmación.
  - **Secundario (Esmeralda Menta)**: `#10B981` (con variante `#059669`). Empleado para hitos completados, estado 'facturado/aprobado' e indicadores de productividad positiva.
  - **Terciario (Cian Técnico)**: `#38BDF8`. Reservado para telemetría secundaria, clientes activos y sincronizaciones de repositorios/commits.
  - **Alerta / Riesgo**: `#EF4444`. Indicador de horas extraordinarias sin presupuesto o solapamiento de tareas.

## Typography

La selección tipográfica responde a una dualidad funcional clara:
1. **Geist**: Para la narrativa estructural, títulos y lecturas de interfaz. Su geometría neutral y balance horizontal optimizan el escaneo rápido en dispositivos móviles bajo condiciones variables de luz.
2. **JetBrains Mono**: Para todos los componentes numéricos, contadores en tiempo real (timers), montos de facturación, timestamps y códigos de proyecto. La naturaleza monoespaciada garantiza que los números no generen desplazamientos ópticos durante la ejecución de cronómetros en vivo.

Todas las etiquetas técnicas y métricas monetarias o temporales deben renderizarse utilizando variantes monoespaciadas (`label-mono-*`) con alineación tabular activada.

## Layout & Spacing

El ritmo espacial está formulado bajo una cuadrícula base de 4px, optimizada para la interacción táctil con una sola mano (ergonomía de pulgar):

- **Retícula Móvil**: 4 columnas fluidas con canaletas de 12px (`0.75rem`) y márgenes exteriores de 16px (`1rem`).
- **Zona Segura y Ergonomía Inferior**: Todas las acciones primarias (iniciar timer, registrar bloqueo, alternar cliente) se sitúan dentro del tercio inferior de la pantalla (área de alcance natural del pulgar). El espaciado de seguridad inferior contempla 34px adicionales para dispositivos gestuales.
- **Reflujo y Tablet**: En anchos superiores a 600px, el diseño migra a un formato de 8 columnas con margen de 24px (`1.5rem`), disponiendo el cronómetro y el desglose analítico en paneles contiguos sin perder la densidad visual de las micro-tarjetas.

## Elevation & Depth

La profundidad se modela exclusivamente a través de capas tonales y delimitaciones lineales atenuadas, evitando sombras pesadas que oscurezcan el contraste en pantallas OLED:

- **Nivel 0 (Base)**: Fondo de pantalla `#0B0F19`. Sin bordes ni elevación.
- **Nivel 1 (Superficie / Tarjetas)**: Superficie `#111827` con borde de trazo fino `1px solid rgba(255, 255, 255, 0.07)`. Sin sombra difusa.
- **Nivel 2 (Superficie Elevada / Acciones)**: Superficie `#1E293B` con borde `1px solid rgba(255, 255, 255, 0.12)` y una sombra de oclusión ambiental extremadamente suave: `0 4px 16px -2px rgba(0, 0, 0, 0.5)`.
- **Nivel 3 (Overlays y Menús Flotantes)**: Fondo `#1E293B` al 95% con `backdrop-filter: blur(12px)` y borde sutil `rgba(255, 255, 255, 0.16)`.
- **Modo Enfoque Activo (Timer Run)**: Cuando una sesión está activa, la tarjeta correspondiente adquiere un resplandor perimetral fino utilizando el color primario: `box-shadow: 0 0 0 1px #F59E0B, 0 8px 24px -4px rgba(245, 158, 11, 0.15)`.

## Shapes

El sistema implementa una morfología sobria de radio moderado (`roundedness: 1`), transmitiendo precisión ingenieril en lugar de un estilo lúdico:

- **Micro-tarjetas y Módulos de Lista**: Radio de 8px (`0.5rem`). Conserva esquinas nítidas que maximizan el área útil interna del contenido tabular.
- **Inputs y Controles de Formulario**: Radio de 6px (`0.375rem`) para conservar la alineación visual con el texto técnico.
- **Chips de Filtro y Selectores de Proyecto**: Radio de 6px (`0.375rem`) en versión rectangular compacta, o 9999px (píldora estricta) únicamente en etiquetas de estado binario (ej. "En curso", "Facturado").
- **Botón Primario de Disparo (Play/Stop)**: Radio de 10px (`0.625rem`) para otorgar protagonismo ergonómico discreto.

## Components

### Botones (Buttons)
- **Primario**: Fondo `#F59E0B`, texto `#0F172A` con peso semi-bold (`Geist`), altura compacta de 44px (touch-target accesible mediante padding transparente exterior si es necesario), borde nulo. Al presionar: fondo `#D97706`.
- **Secundario / Espectral**: Fondo `#1E293B`, texto `#F8FAFC`, borde `1px solid rgba(255, 255, 255, 0.1)`. Al presionar: fondo `#334155`.
- **Destructivo (Detener / Descartar)**: Fondo `rgba(239, 68, 68, 0.12)`, texto `#EF4444`, borde `1px solid rgba(239, 68, 68, 0.25)`.

### Chips Selectores (Táctiles)
- Controles de selección mono-toque para etiquetas de clientes (ej. `[CLI-01]`, `[CORE]`, `[SYNC]`).
- Estado inactivo: Fondo `#111827`, texto `#94A3B8`, borde `1px solid rgba(255, 255, 255, 0.08)`, tipografía `JetBrains Mono` 12px.
- Estado activo: Fondo `rgba(245, 158, 11, 0.15)`, texto `#F59E0B`, borde `1px solid #F59E0B`.

### Micro-Tarjetas de Entrada de Tiempo (Time-Log Cards)
- Estructura horizontal compacta: Indicador cromático vertical a la izquierda (3px de ancho) que denota el cliente o proyecto.
- Bloque central: Título de tarea en `Geist` 14px (`text-primary`), subtítulo con metadata de commits o hitos en `text-secondary` 12px.
- Bloque derecho: Duración total formateada en `JetBrains Mono` 14px (`text-primary`) y monto monetario acumulado calculado en tiempo real en `text-muted` 11px.

### Campos de Entrada (Input Fields)
- Altura fija de 42px. Fondo `#0F172A`, borde perimetral `1px solid rgba(255, 255, 255, 0.1)`.
- Tipografía interna `Geist` 14px en español neutro, placeholder en `#64748B`.
- Estado de foco: Borde `#F59E0B` sin halo externo invasivo.

### Listas y Separadores
- Filas de registros separadas por espacio vacío de 8px (`space-sm`) sin divisores continuos de borde completo, permitiendo que la micro-tarjeta funcione como unidad de información atómica y modular.
- Deslizamiento lateral (swipe) configurado con respuesta háptica para dos acciones inmediatas: duplicar registro previo (hacia la derecha) o archivar (hacia la izquierda).