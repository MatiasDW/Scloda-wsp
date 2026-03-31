import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { logger } from "../../shared/logger.js";
import { WhatsAppService } from "./whatsapp.service.js";

const webhookBodySchema = z.object({
  event: z.string().optional(),
  data: z.unknown().optional(),
  message: z.unknown().optional(),
  from: z.string().optional(),
  body: z.string().optional()
});

type ExtractedMessage = {
  messageId: string;
  fromPhone: string;
  body: string;
  profileName?: string;
};

function extractMessage(payload: unknown): ExtractedMessage | null {
  const parsed = webhookBodySchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }

  const body = parsed.data;

  if (body.event && body.event !== "message.received") {
    return null;
  }

  const candidate: any = (body.data as any)?.message ?? body.message ?? body.data ?? body;
  const messageId = candidate?.id ?? candidate?.message_id;
  const fromPhone = candidate?.from ?? candidate?.phone ?? body.from;
  const textBody =
    candidate?.text?.body ??
    candidate?.content?.body ??
    candidate?.body ??
    body.body;

  if (!messageId || !fromPhone || !textBody) {
    return null;
  }

  return {
    messageId: String(messageId),
    fromPhone: String(fromPhone),
    body: String(textBody),
    profileName: candidate?.profile?.name ? String(candidate.profile.name) : undefined
  };
}

export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  handleWebhook = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const message = extractMessage(request.body);

    if (!message) {
      logger.warn({ body: request.body }, "Webhook ignored: missing/unsupported payload");
      reply.code(200).send({ ok: true, ignored: true });
      return;
    }

    await this.whatsappService.processIncomingMessage(message);
    reply.code(200).send({ ok: true });
  };
}
