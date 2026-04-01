import { createHmac } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { env } from "../../config/env.js";
import { prisma } from "../../shared/db/prisma.js";

async function resetDb() {
  await prisma.payment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.inboundMessage.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
}

describe("whatsapp webhook integration", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    await resetDb();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("configures a match from one natural-language message", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/webhooks/kapso/messages",
      payload: {
        event: "message.received",
        data: {
          message: {
            id: "it-setup-1",
            from: "+56970000001",
            body: "partido para 12 jugadores, cancha 70 lucas, citacion 21 horas, direccion escandinavia 350",
            profile: { name: "Matias Davila" }
          }
        }
      }
    });

    expect(response.statusCode).toBe(200);

    const activeMatch = await prisma.match.findFirst({
      where: { status: "ACTIVE" }
    });

    expect(activeMatch).not.toBeNull();
    expect(activeMatch?.slots).toBe(12);
    expect(activeMatch?.totalCost).toBe(70000);
    expect(activeMatch?.venue).toBe("Escandinavia 350");
    expect(activeMatch?.startsAt.getHours()).toBe(21);
  });

  it("updates active match venue with explicit command", async () => {
    await app.inject({
      method: "POST",
      url: "/webhooks/kapso/messages",
      payload: {
        event: "message.received",
        data: {
          message: {
            id: "it-setup-2",
            from: "+56970000001",
            body: "partido para 10 jugadores, cancha 60 lucas, citacion 20:30, direccion escandinavia 350"
          }
        }
      }
    });

    const updateResponse = await app.inject({
      method: "POST",
      url: "/webhooks/kapso/messages",
      payload: {
        event: "message.received",
        data: {
          message: {
            id: "it-update-venue-1",
            from: "+56970000001",
            body: "actualizar direccion es alcantara 432"
          }
        }
      }
    });

    expect(updateResponse.statusCode).toBe(200);

    const activeMatch = await prisma.match.findFirst({
      where: { status: "ACTIVE" }
    });

    expect(activeMatch?.venue).toBe("Alcantara 432");
  });

  it("rejects invalid webhook signature and accepts valid signature", async () => {
    const payload = JSON.stringify({
      event: "message.received",
      data: {
        message: {
          id: "it-sign-1",
          from: "+56970000001",
          body: "hola"
        }
      }
    });

    const invalid = await app.inject({
      method: "POST",
      url: "/webhooks/kapso/messages",
      headers: {
        "content-type": "application/json",
        "x-webhook-signature": "invalid-signature"
      },
      payload
    });

    expect(invalid.statusCode).toBe(401);

    const signature = createHmac("sha256", env.WEBHOOK_SECRET).update(payload).digest("hex");
    const valid = await app.inject({
      method: "POST",
      url: "/webhooks/kapso/messages",
      headers: {
        "content-type": "application/json",
        "x-webhook-signature": signature
      },
      payload
    });

    expect(valid.statusCode).toBe(200);
  });
});
