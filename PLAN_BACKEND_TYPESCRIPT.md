# Plan Backend (TypeScript) - Pichanga Bot

Fecha: 31 Mar 2026  
Objetivo: construir un backend robusto para operar una pichanga por WhatsApp (asistencia + cuentas + pagos) con Kapso.

## 1) Alcance MVP
- Un solo grupo de pichanga.
- Un organizador admin.
- Comandos por WhatsApp: `me sumo`, `me bajo`, `cuanto debo`, `ya pague`, `estado`.
- Recordatorios automaticos a pendientes.

## 2) Stack tecnico (TypeScript)
- Runtime: `Node.js 20+`
- Lenguaje: `TypeScript`
- Framework API: `Fastify` (rapido y simple)
- DB: `PostgreSQL` + `Prisma`
- Scheduler: `BullMQ` + `Redis` (o `pg_cron` si quieres menos infraestructura)
- Validacion: `zod`
- Logs: `pino`
- Testing: `vitest` + `supertest`
- Deploy: Railway / Fly / Render (cualquiera con Postgres + Redis)

## 3) Arquitectura backend
- `Webhook Ingress`: recibe eventos de Kapso/WhatsApp.
- `Command Parser`: interpreta texto y enruta a casos de uso.
- `Domain Services`: reglas de negocio (asistencia, deuda, pagos).
- `Persistence`: repositorios Prisma.
- `Notification Service`: envios salientes por Kapso API.
- `Jobs`: recordatorios, cierres y resumenes automaticos.

Flujo base:
1. Llega mensaje por webhook.
2. Se valida firma y normaliza payload.
3. Se parsea comando.
4. Se ejecuta caso de uso.
5. Se guarda estado.
6. Se responde por WhatsApp.

## 4) Estructura de proyecto sugerida
```txt
src/
  app.ts
  server.ts
  config/
    env.ts
  modules/
    whatsapp/
      whatsapp.controller.ts
      whatsapp.service.ts
      kapso.client.ts
      command.parser.ts
    matches/
      matches.service.ts
      matches.repository.ts
    attendance/
      attendance.service.ts
    payments/
      payments.service.ts
    reminders/
      reminders.jobs.ts
  shared/
    db/prisma.ts
    logger.ts
    errors.ts
    types.ts
prisma/
  schema.prisma
```

## 5) Modelo de datos (MVP)
Tablas:
- `players`
- `matches`
- `attendance`
- `payments`
- `inbound_messages` (idempotencia y auditoria)

Campos minimos:
- `players`: `id`, `name`, `phone_e164`, `is_active`
- `matches`: `id`, `starts_at`, `venue`, `total_cost`, `slots`, `status`
- `attendance`: `id`, `match_id`, `player_id`, `status` (`confirmed|dropped`)
- `payments`: `id`, `match_id`, `player_id`, `amount_due`, `amount_paid`, `status`
- `inbound_messages`: `message_id`, `phone`, `body`, `received_at`

Reglas:
- Un jugador solo puede tener un estado de asistencia por partido.
- `amount_due` se recalcula cuando cambia el numero de confirmados.
- `message_id` unico para evitar procesar duplicados.

## 6) API interna y endpoints
Publicos (Kapso):
- `POST /webhooks/kapso/messages` -> recibe mensajes entrantes.
- `GET /health` -> health check.

Privados (admin basico):
- `POST /admin/matches` -> crea partido.
- `GET /admin/matches/:id/state` -> estado de cupos y pagos.
- `POST /admin/matches/:id/remind` -> fuerza recordatorio.

## 7) Comandos y respuestas MVP
1. `me sumo`
- Accion: confirma asistencia.
- Respuesta: cupo confirmado + deuda actual.
2. `me bajo`
- Accion: baja asistencia.
- Respuesta: cupo liberado + nuevo estado.
3. `cuanto debo`
- Accion: consulta deuda del proximo partido activo.
- Respuesta: monto pendiente/pagado.
4. `ya pague`
- Accion: marca pago (estado manual en MVP).
- Respuesta: confirmacion.
5. `estado`
- Accion: resumen general.
- Respuesta: confirmados, cupos libres, total recaudado, pendiente.

## 8) Algoritmo de deuda (simple y claro)
1. Obtener `total_cost` del partido activo.
2. Contar confirmados.
3. Si confirmados = 0, deuda = 0.
4. Si confirmados > 0, deuda individual = `total_cost / confirmados`.
5. Redondear a peso y ajustar diferencia al ultimo jugador.

## 9) Jobs automaticos
- `T-24h`: recordatorio de asistencia a no confirmados.
- `T-8h`: recordatorio de pago a pendientes.
- `T+2h`: cierre partido y snapshot final.

## 10) Seguridad y calidad
- Verificar firma de webhook Kapso.
- Rate limit en endpoint de webhook.
- Idempotencia por `message_id`.
- Sanitizar texto entrante.
- Manejo estricto de errores con codigos y logs.
- Feature flag para modo `sandbox` vs `production`.

## 11) Observabilidad
- Logs estructurados por request (`request_id`, `message_id`, `player_id`).
- Metricas minimas: comandos recibidos/dia, errores por comando, latencia webhook->respuesta, porcentaje pagos al dia.

## 12) Plan de implementacion (sprints)
### Sprint 1 (base operativa)
1. Boot del proyecto TS + Fastify + Prisma.
2. Esquema DB y migraciones.
3. Endpoint webhook + parser de comandos.
4. Comandos `me sumo`, `me bajo`, `estado`.

### Sprint 2 (cuentas y pagos)
1. Motor de deuda y recalculo automatico.
2. Comandos `cuanto debo`, `ya pague`.
3. Endpoints admin minimos.
4. Pruebas de integracion del flujo completo.

### Sprint 3 (automatizacion y hardening)
1. Jobs de recordatorio.
2. Idempotencia completa.
3. Logs y metricas.
4. Deploy y smoke tests en entorno real.

## 13) Definition of Done (MVP)
- Un usuario escribe comandos en WhatsApp y recibe respuesta correcta.
- Asistencia se guarda y actualiza sin duplicados.
- Deuda se recalcula al cambiar confirmados.
- Pagos pueden marcarse y consultarse.
- Recordatorios salen automaticamente.
- Sistema estable 2 semanas con 1 grupo real.

## 14) Siguientes mejoras (post-MVP)
- Multi-grupo y multi-organizador.
- Confirmacion de pago con comprobante (imagen + validacion).
- Panel web de administracion.
- Ranking de asistencia y morosidad.
- Integracion con transferencias/pagos reales.
