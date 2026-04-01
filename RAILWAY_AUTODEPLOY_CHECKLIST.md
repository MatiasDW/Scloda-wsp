# Railway Autodeploy Checklist (Scloda)

## 1) Servicios requeridos
- `app` (este repositorio, usando `Dockerfile`)
- `Postgres`
- `Redis`

## 2) Variables obligatorias en `app`
- `NODE_ENV=production`
- `PORT=3000`
- `LOG_LEVEL=info`
- `DATABASE_URL` (provista por Railway Postgres)
- `REDIS_URL` (provista por Railway Redis)
- `ADMIN_API_KEY`
- `WHATSAPP_MOCK_MODE=false`
- `WEBHOOK_SECRET`
- `KAPSO_API_KEY`
- `KAPSO_SEND_MESSAGE_URL=https://api.kapso.ai/meta/whatsapp/v24.0/<phone_number_id>/messages`

## 3) Comprobaciones post deploy
- `GET /health` responde `{"ok":true}`
- Kapso webhook apunta a:
  - `https://<tu-app>.up.railway.app/webhooks/kapso/messages`
- Evento activo en Kapso: `Message received`

## 4) Flujo minimo de smoke test
Enviar por WhatsApp:
```txt
partido para 10 jugadores, cancha 60 lucas, citacion 21 horas, direccion escandinavia 350
```

Luego enviar:
```txt
me sumo
estado
```

## 5) Si no responde
- Ver logs en Railway (`app`) y confirmar que llegan POST a `/webhooks/kapso/messages`.
- Verificar que `WEBHOOK_SECRET` en Railway coincide con el de Kapso.
- Confirmar que `KAPSO_API_KEY` no fue rotada.
- Confirmar que `phone_number_id` en `KAPSO_SEND_MESSAGE_URL` es correcto.
