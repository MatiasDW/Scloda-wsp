import { env } from "../../config/env.js";
import { logger } from "../../shared/logger.js";

export class KapsoClient {
  async sendText(toPhoneE164: string, message: string): Promise<void> {
    if (env.WHATSAPP_MOCK_MODE) {
      logger.info({ toPhoneE164, message }, "Mock WhatsApp send");
      return;
    }

    if (!env.KAPSO_SEND_MESSAGE_URL || !env.KAPSO_API_KEY) {
      throw new Error("KAPSO_SEND_MESSAGE_URL y KAPSO_API_KEY son requeridos cuando WHATSAPP_MOCK_MODE=false");
    }

    const response = await fetch(env.KAPSO_SEND_MESSAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.KAPSO_API_KEY
      },
      body: JSON.stringify({
        to: toPhoneE164,
        type: "text",
        text: { body: message }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Kapso send failed (${response.status}): ${detail}`);
    }
  }
}
