# Scloda: Pasos a Seguir (Local + Produccion)

Fecha: 01-04-2026

## 1) Que ya esta listo
- Backend funcionando en Docker (`app + postgres + redis`).
- Webhook entrante operativo en `POST /webhooks/kapso/messages`.
- Envio saliente operativo con Kapso API.
- Flujo de configuracion de partido con:
  - cupos
  - valor de cancha
  - hora de citacion
  - direccion (obligatoria)
- Resumen con lista de jugadores enumerada `1..N`.

## 2) Que te falta para pruebas estables
- Tener un endpoint publico estable (no solo localhost).
- Confirmar en Kapso Webhooks que el endpoint actual sea el correcto.
- Mantener activos los servicios (`docker`) y el tunel.

## 3) Opcion A: seguir en local con tunel (rapido)

### 3.1 Levantar backend local
```bash
docker compose up -d --build
docker compose ps
curl http://localhost:3000/health
```

### 3.2 Crear tunel publico
Puedes usar:
- `ngrok` (free con limites)
- `cloudflared` quick tunnel
- `localtunnel` (temporal)

Ejemplo con ngrok:
```bash
ngrok http 3000
```

### 3.3 Configurar webhook en Kapso
- Webhook URL:
  - `https://TU-URL-PUBLICA/webhooks/kapso/messages`
- Evento activo:
  - `Message received` (solo este para MVP)

### 3.4 Prueba minima
Desde WhatsApp real (no manual inbox), mandar:
```txt
partido para 12 jugadores, cancha 70 lucas, citacion 21 horas, direccion escandinavia 350
```

## 4) Opcion B: deploy en Railway (recomendado para estabilidad)

## 4.1 Servicios a crear en Railway
1. Servicio `app` (este repo con Dockerfile)
2. Servicio `Postgres`
3. Servicio `Redis`

## 4.2 Variables de entorno en `app`
Configurar:
- `NODE_ENV=production`
- `PORT=3000`
- `LOG_LEVEL=info`
- `DATABASE_URL=<la de Postgres Railway>`
- `REDIS_URL=<la de Redis Railway>`
- `ADMIN_API_KEY=<tu_valor>`
- `WHATSAPP_MOCK_MODE=false`
- `WEBHOOK_SECRET=<secret de Kapso webhook>`
- `KAPSO_API_KEY=<tu api key>`
- `KAPSO_SEND_MESSAGE_URL=https://api.kapso.ai/meta/whatsapp/v24.0/<phone_number_id>/messages`

## 4.3 Endpoint webhook en Kapso (ya estable)
Cuando Railway despliegue, usa:
```txt
https://<tu-servicio>.up.railway.app/webhooks/kapso/messages
```

## 4.4 Verificacion post-deploy
1. `GET /health` devuelve `ok: true`.
2. Kapso webhook en estado `Active`.
3. Mensaje de WhatsApp recibe respuesta del bot.

## 5) Checklist final (lo minimo para cerrar)
- [ ] Docker o Railway app arriba
- [ ] Endpoint webhook correcto en Kapso
- [ ] Solo evento `Message received` activo
- [ ] `WHATSAPP_MOCK_MODE=false`
- [ ] `KAPSO_API_KEY` y `phone_number_id` correctos
- [ ] Flujo probado de punta a punta desde WhatsApp real

## 6) Comandos utiles de soporte
```bash
# ver contenedores
docker compose ps

# logs backend
docker compose logs -f app

# health local
curl http://localhost:3000/health
```

## 7) Riesgos comunes
- El tunel cambia URL y Kapso queda apuntando al endpoint viejo.
- Pruebas hechas desde Inbox manual en vez de WhatsApp real.
- API key expuesta/rotada y no actualizada en variables.
- `phone_number_id` incorrecto en `KAPSO_SEND_MESSAGE_URL`.
