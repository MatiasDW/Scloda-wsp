# Plan Frontend React - Estilo Formal y Minimalista (Negro Mate)

## 1) Objetivo
Disenar y construir un frontend en React con estetica formal/minimalista, priorizando legibilidad, consistencia visual, rendimiento y accesibilidad desde el inicio.

## 2) Como trabaja un disenador (investigado)
Base metodologica: **Double Diamond** (Discover, Define, Develop, Deliver) y enfoque **human-centered** durante todo el ciclo de vida.

### Fase A - Discover (entender problema y usuarios)
- Levantar objetivos de negocio, usuarios y contexto de uso.
- Auditar referencias visuales y competidores.
- Detectar restricciones tecnicas (SEO, rendimiento, i18n, accesibilidad, CMS).
- Entregables: brief, mapa de actores, benchmark, requerimientos.

### Fase B - Define (acotar el problema)
- Definir alcance, user journeys y arquitectura de informacion.
- Priorizar funcionalidades por valor/impacto.
- Definir KPIs: conversion, tasa de exito de tareas, Core Web Vitals.
- Entregables: user flows, sitemap, backlog priorizado, criterios de exito.

### Fase C - Develop (explorar y prototipar)
- Wireframes low-fi (estructura).
- UI kit + design tokens (color, tipografia, espaciado, radios, sombras).
- Prototipo hi-fi interactivo y test rapido con usuarios.
- Iterar en ciclos cortos con feedback de producto/tecnica.
- Entregables: prototipo validado, especificaciones visuales y de interaccion.

### Fase D - Deliver (implementar y validar)
- Handoff a desarrollo con componentes y estados definidos.
- Implementacion en React con QA visual, funcional y accesibilidad.
- Monitoreo post-release y mejoras iterativas.
- Entregables: frontend productivo, tablero de metricas, plan de mejora continua.

## 3) Direccion visual: formal + minimalista + negro mate

### Principios
- Mucho espacio en blanco (o negro en este caso), pocos acentos.
- Jerarquia tipografica marcada, sin ruido decorativo.
- Superficies por capas sutiles (no negro puro absoluto en todo).
- Microinteracciones discretas (120-180ms), sin animaciones cargadas.

### Paleta sugerida (tokens)
```css
:root {
  --bg-canvas: #0F0F10;      /* negro mate base */
  --bg-surface: #151618;     /* tarjetas/paneles */
  --bg-elevated: #1D1F22;    /* modales/menus */
  --text-primary: #F2F2F3;
  --text-secondary: #B6B8BD;
  --border-subtle: #2A2D31;
  --accent: #D9DCE1;         /* acento sobrio */
  --success: #6FAF8F;
  --warning: #C6A96A;
  --danger: #B86E6E;
}
```

### Tipografia recomendada
- Titulos: `Manrope` (600/700).
- Texto base: `Source Sans 3` (400/500).
- Numeros/codigo: `IBM Plex Mono`.

## 4) Stack React recomendado (2026)
- Framework: **Next.js (App Router)** para escalar SSR/SSG/RSC por ruta.
- UI: React + TypeScript + CSS variables + tokens.
- Componentes: biblioteca propia (Button, Input, Modal, Table, etc.).
- Datos: TanStack Query (si hay consumo API en cliente).
- Formularios: React Hook Form + Zod.
- Testing: Vitest + React Testing Library + Playwright.
- Calidad: ESLint + Prettier + Husky + lint-staged.

## 5) Arquitectura frontend sugerida

```text
src/
  app/                 # rutas/layouts
  features/            # modulos por dominio
    auth/
    dashboard/
    billing/
  components/
    ui/                # componentes base reutilizables
    patterns/          # composiciones de UI
  lib/
    api/
    analytics/
    logger/
    monitoring/
  styles/
    tokens.css
    globals.css
  tests/
```

Reglas:
- Componentes pequenos y cohesionados.
- Logica de negocio fuera de componentes visuales.
- Server state separado de UI state.
- No acoplar componentes a endpoints concretos.

## 6) Plan de ejecucion por sprints

### Sprint 0 (3-5 dias): Descubrimiento y definicion
- Workshop de objetivos y alcance.
- Auditoria de referencias.
- Sitemap + journeys + backlog v1.
- KPI baseline.

### Sprint 1 (1 semana): Fundaciones de diseno
- Tokens (color, tipografia, spacing, radius, shadow, motion).
- Wireframes de pantallas core.
- Prototipo navegable inicial.

### Sprint 2 (1 semana): Sistema de componentes
- Construir componentes base con estados (default/hover/focus/disabled/error/loading).
- Documentar API de componentes.
- Pruebas unitarias iniciales.

### Sprint 3 (1-2 semanas): Pantallas y flujos principales
- Implementar layout + navegacion + vistas principales.
- Integrar datos y estados de carga/error vacio.
- Instrumentar analitica de eventos clave.

### Sprint 4 (1 semana): Hardening y release
- Accesibilidad (teclado, foco visible, contraste, semantica).
- Performance (code splitting por ruta, imagenes, caching).
- QA final, correcciones y release gradual.

## 7) Checklist de calidad obligatoria
- Accesibilidad: WCAG 2.2 AA (contraste, foco, navegacion teclado, labels).
- Performance: LCP, INP, CLS dentro de objetivos.
- Seguridad frontend: sanitizacion de contenido, CSP, manejo seguro de tokens.
- Observabilidad: logs estructurados en cliente + errores a Sentry/Datadog.
- Resiliencia: estados de timeout/retry/fallback por integracion externa.

## 8) Riesgos comunes y mitigacion
- Riesgo: sobrecargar negro puro y perder jerarquia.
- Mitigacion: usar capas de superficie y contraste tipografico graduado.

- Riesgo: sistema visual inconsistente al crecer.
- Mitigacion: tokens + libreria de componentes + revisiones de diseno.

- Riesgo: deuda de performance en SPA grande.
- Mitigacion: framework con routing/data/code-splitting integrado y budgets.

## 9) Resultado esperado
En 4-6 semanas deberias tener:
- UI formal/minimalista consistente en negro mate.
- Base React escalable con arquitectura limpia.
- Sistema de componentes reutilizable.
- Frontend listo para evolucionar sin reescrituras grandes.

## Fuentes consultadas
- Design Council - Double Diamond y Framework for Innovation:
  - https://www.designcouncil.org.uk/our-resources/the-double-diamond/
  - https://www.designcouncil.org.uk/our-resources/framework-for-innovation/
- React docs (arquitectura y recomendacion de frameworks):
  - https://react.dev/learn/creating-a-react-app
  - https://react.dev/learn/build-a-react-app-from-scratch
  - https://react.dev/blog/2025/02/14/sunsetting-create-react-app
  - https://react.dev/reference/react/useId
  - https://react.dev/warnings/invalid-aria-prop
- Accesibilidad (estandar y contraste):
  - https://www.w3.org/TR/WCAG22/
  - https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- Referencia de sistema de color y contraste en escalas:
  - https://designsystem.digital.gov/design-tokens/color/overview/
- Human-centered design a nivel estandar:
  - https://www.iso.org/standard/77520.html
