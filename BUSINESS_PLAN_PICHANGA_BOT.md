# Business Plan: Pichanga Bot + Contador de Cuentas

## 1. Resumen Ejecutivo
`Pichanga Bot` es un asistente por WhatsApp construido sobre Kapso para resolver la operación diaria de grupos de fútbol amateur: confirmación de asistencia, cálculo automático de deuda de cancha, registro de pagos y recordatorios.

Objetivo: transformar una coordinación caótica en un flujo automático y medible, reduciendo morosidad y carga operativa del organizador.

## 2. Problema
En grupos de pichanga amateur se repiten 5 dolores:
1. Incertidumbre de asistencia final.
2. Cobro desordenado de cancha.
3. Morosidad recurrente ("pago después").
4. Falta de historial confiable de gastos/pagos.
5. Desgaste del organizador persiguiendo respuestas manualmente.

Impacto: pérdida de tiempo, fricción social y riesgo financiero para quien organiza.

## 3. Solución
Un bot de WhatsApp con 4 comandos base:
1. `me sumo`
2. `me bajo`
3. `cuánto debo`
4. `ya pagué`

Capacidades clave:
- Cálculo dinámico del costo por asistente confirmado.
- Resumen diario (cupos, deuda total, pendientes por persona).
- Recordatorios automáticos suaves a deudores.
- Escalamiento a humano cuando exista conflicto o excepción.

## 4. Propuesta de Valor
Para organizadores:
- Menos carga operativa.
- Menos conflicto al cobrar.
- Más visibilidad financiera.

Para jugadores:
- Transparencia del saldo individual.
- Menos mensajes repetitivos en el grupo.
- Confirmación y pago con baja fricción.

Promesa central: "Más fútbol, menos administración."

## 5. Segmento de Clientes
### Cliente inicial (ICP)
- Organizadores de pichangas de 10-30 jugadores por grupo.
- Frecuencia semanal o bi-semanal.
- Alta coordinación por WhatsApp.

### Segmentos secundarios
- Ligas barriales.
- Escuelas deportivas.
- Grupos universitarios/de empresa.

## 6. Tamaño de Oportunidad (Bottom-up inicial)
Supuesto de validación:
- 1 organizador controla 1-3 grupos.
- Cada grupo tiene 15-25 jugadores activos.
- Ticket posible por grupo: USD 8-25/mes (SaaS liviano B2B2C).

Fórmula rápida:
`Ingresos mensuales = grupos activos x plan promedio`.

## 7. Modelo de Negocio
### Monetización
1. Suscripción mensual por grupo.
2. Plan anual con descuento.
3. Add-ons opcionales:
- Reportes avanzados.
- Branding de ligas.
- Integración de medios de pago.

### Propuesta de planes (referencial)
- Free: 1 grupo, comandos base, historial limitado.
- Pro: automatizaciones, reportes, recordatorios avanzados.
- Club/Liga: multi-grupo, roles, dashboard consolidado.

## 8. Go-To-Market (GTM)
### Fase 1: Validación
- Captar 5-10 organizadores piloto.
- Implementación asistida (setup guiado).
- Medir adopción semanal y reducción de morosidad.

### Fase 2: Tracción local
- Programa de referidos entre organizadores.
- Casos de éxito con métricas reales.
- Contenido corto en comunidades deportivas y WhatsApp.

### Fase 3: Escalamiento
- Onboarding self-service.
- Plantillas por tipo de torneo.
- Canal con alianzas (canchas, ligas, comunidades).

## 9. Operación y Tecnología
Plataforma base: Kapso (API, workflows, inbox, webhooks, database, broadcasts, serverless).

Arquitectura de operación:
1. Webhook de mensajes entrantes.
2. Parser de comandos.
3. Servicios de asistencia/deuda/pago.
4. Persistencia de estado.
5. Scheduler para resúmenes y recordatorios.
6. Handoff a humano ante excepción.

Principios técnicos:
- Modularidad y escalabilidad.
- Procesamiento resiliente por registro (no abortar lote).
- Retries, timeouts y logs estructurados con trazabilidad.

## 10. Roadmap (90 días)
### Día 0-14 (MVP funcional)
- Setup Kapso + número WhatsApp.
- Comandos base operativos.
- Modelo de datos mínimo (partidos, jugadores, pagos, deuda).

### Día 15-45 (Producto usable)
- Recordatorios automáticos.
- Resumen diario/semanal.
- Dashboard básico (Sheets o web simple).

### Día 46-90 (Producto vendible)
- Onboarding estandarizado.
- Planes de pago.
- Métricas de negocio y retención.
- Primer playbook comercial replicable.

## 11. Métricas Clave (KPIs)
Producto:
- % jugadores activos por semana.
- % comandos exitosos.
- Tiempo promedio de resolución.

Negocio:
- Grupos activos.
- MRR.
- Churn mensual.
- CAC por grupo.
- LTV estimado.

Impacto operacional:
- Reducción de morosidad.
- Reducción de mensajes manuales del organizador.
- Tiempo ahorrado por partido.

## 12. Proyección Financiera Simple (Escenario Base)
Supuestos:
- Mes 1: 10 grupos pagados.
- Mes 3: 30 grupos pagados.
- Mes 6: 80 grupos pagados.
- ARPU objetivo: USD 12/mes.

Proyección de MRR:
- Mes 1: USD 120.
- Mes 3: USD 360.
- Mes 6: USD 960.

Objetivo del periodo inicial: validar retención y unit economics antes de escalar adquisición.

## 13. Riesgos y Mitigaciones
1. Baja adopción de jugadores.
Mitigación: UX de comandos ultra simple + mensajes guiados.

2. Resistencia al pago.
Mitigación: plan Free útil + diferenciación clara de Pro por ahorro real.

3. Fallas por dependencias externas.
Mitigación: retries, timeouts, fallback y alertas.

4. Abandono del organizador.
Mitigación: onboarding de 15 minutos + checklist semanal + soporte temprano.

## 14. Plan de Ejecución Inmediata (2 semanas)
1. Configurar entorno Kapso y flujo inbound.
2. Implementar comandos `me sumo`, `me bajo`, `cuánto debo`, `ya pagué`.
3. Activar cálculo automático de deuda por confirmados.
4. Habilitar resumen diario y recordatorio a deudores.
5. Lanzar piloto con 1-2 grupos reales.
6. Medir adopción, morosidad y feedback para iterar.

## 15. Criterio de Éxito del MVP
Se considera validado si en 30 días se logra:
1. >70% de uso recurrente de comandos por jugadores activos.
2. Reducción de al menos 30% en deuda pendiente al cierre semanal.
3. Al menos 5 grupos usando el bot de forma continua.
