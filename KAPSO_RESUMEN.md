# Kapso: resumen clave y plan inicial

Fecha: 31 Mar 2026

## 1) Que es Kapso (en simple)
Kapso es una plataforma para construir operaciones en WhatsApp con:
- API de mensajes y conversaciones
- Workflows visuales
- Agentes AI
- Inbox para handoff humano
- Webhooks
- Funciones serverless e integraciones

Sirve tanto para:
- tu propio uso (grupos, soporte, ventas, ops)
- modelo multi-tenant (que otros conecten sus numeros)

## 2) Posibilidades reales para ti (ahora)
- Crear un agente por WhatsApp en minutos (`@kapso/cli` + `kapso setup`).
- Automatizar respuestas y guardar estado (asistencia, deudas, pagos).
- Enviar recordatorios o avisos masivos (Broadcasts API).
- Escalar a humano cuando el bot no debe resolver.
- Armar mini dashboards dentro de Kapso (Project Pages).

## 3) Dolor de tus amigos (pichangas)
Problemas frecuentes:
- Nadie confirma a tiempo.
- El cobro de cancha siempre queda desordenado.
- Falta registro de quien pago y quien no.
- El organizador termina persiguiendo gente por DM.

## 4) MVP recomendado: Pichanga Bot + Contador de Cuentas
Objetivo: resolver confirmacion + cobro sin app nueva (solo WhatsApp).

### Funciones MVP
- `me sumo` -> confirma asistencia
- `me bajo` -> libera cupo
- `cuanto debo` -> muestra deuda
- `ya pague` -> marca pago (o deja evidencia)
- `estado pichanga` -> resumen de cupos y caja

### Logica minima
- Crear partido (fecha, costo total, cupos).
- Dividir costo entre confirmados.
- Guardar pagos por persona.
- Avisar faltantes automatico (recordatorio suave).

### Estructura de datos minima
- `players`: id, nombre, telefono
- `matches`: id, fecha, lugar, costo_total, cupos
- `attendance`: match_id, player_id, estado(confirmado/baja)
- `payments`: match_id, player_id, monto, estado(pendiente/pagado)

## 5) Plan de ejecucion (2 semanas)
### Semana 1
- Conectar numero y dejar webhook activo.
- Crear flujo de comandos base.
- Guardar datos en DB (Kapso DB o Google Sheets via integracion).

### Semana 2
- Activar recordatorios automaticos.
- Agregar resumen diario/semanal.
- Probar con 1-2 grupos reales y ajustar lenguaje del bot.

## 6) Costo/limites a vigilar
- Kapso cobra plataforma.
- Meta cobra templates segun categoria/pais.
- En plan Free hay 1 numero y limite de mensajes mensual.
- Todas las interacciones del grupo cuentan para el limite (entrantes y salientes).

## 7) Como arrancar hoy (checklist rapido)
1. Instalar CLI y login.
2. Ejecutar `kapso setup` para numero/proyecto.
3. Definir comandos del bot (5 comandos MVP).
4. Crear tabla de partidos/pagos.
5. Activar recordatorios y probar en un grupo.

## 8) Proximo paso recomendado
Construir version v0 para un solo caso: "organizar pichanga del viernes y cobrar cancha".
Si eso funciona 2-3 semanas seguidas, recien ahi ampliar a nuevas ideas.

## Fuentes consultadas
- https://docs.kapso.ai/docs/introduction
- https://docs.kapso.ai/docs/platform/getting-started
- https://docs.kapso.ai/docs/platform/broadcasts-api
- https://docs.kapso.ai/docs/platform/setup-links
- https://docs.kapso.ai/docs/platform/detecting-whatsapp-connection
- https://docs.kapso.ai/docs/whatsapp/pricing-faq
- https://docs.kapso.ai/changelog
- https://status.kapso.ai/
- https://www.npmjs.com/package/@kapso/cli
