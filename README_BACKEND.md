# Backend MVP - Pichanga Bot

## Requisitos
- Node 20+
- Docker + Docker Compose

## 1) Configuracion local
```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

## 2) Ejecutar con Docker
```bash
docker compose up --build
```

Servicios:
- API: `http://localhost:3000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## 3) Endpoints base
- `GET /health`
- `POST /webhooks/kapso/messages`
- `POST /admin/matches` (header `x-admin-key`)
- `GET /admin/matches/:id/state` (header `x-admin-key`)
- `POST /admin/matches/:id/remind` (header `x-admin-key`)

## 4) Comandos WhatsApp (MVP)
- `me sumo`
- `me bajo`
- `cuanto debo`
- `ya pague`
- `estado`
- `configurar partido` (flujo guiado: cupos -> valor cancha -> hora citacion)

Ejemplo crear partido:
```bash
curl -X POST http://localhost:3000/admin/matches \\
  -H 'Content-Type: application/json' \\
  -H 'x-admin-key: dev-admin-key' \\
  -d '{
    \"startsAt\": \"2026-04-03T21:00:00.000Z\",
    \"venue\": \"Cancha 1\",
    \"totalCost\": 80000,
    \"slots\": 12,
    \"activateNow\": true
  }'
```

Ejemplo webhook entrante:
```bash
curl -X POST http://localhost:3000/webhooks/kapso/messages \\
  -H 'Content-Type: application/json' \\
  -d '{
    \"event\": \"message.received\",
    \"data\": {
      \"message\": {
        \"id\": \"msg-123\",
        \"from\": \"+56911111111\",
        \"body\": \"me sumo\"
      }
    }
  }'
```

## 5) Nota Kapso
Para desarrollo local, `WHATSAPP_MOCK_MODE=true` y las respuestas se registran en logs.
Para produccion, setear:
- `WHATSAPP_MOCK_MODE=false`
- `KAPSO_API_KEY`
- `KAPSO_SEND_MESSAGE_URL`
