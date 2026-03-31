import { Queue, Worker } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../shared/logger.js";
import { redisConnection } from "../../shared/redis-connection.js";
import { KapsoClient } from "../whatsapp/kapso.client.js";
import { PaymentsService } from "../payments/payments.service.js";

type ReminderJob = {
  matchId: string;
};

export class RemindersJobs {
  private readonly queue = new Queue<ReminderJob>("pichanga-reminders", {
    connection: redisConnection
  });

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly kapsoClient: KapsoClient
  ) {}

  startWorker() {
    const worker = new Worker<ReminderJob>(
      "pichanga-reminders",
      async (job) => {
        const pendingRows = await this.paymentsService.listPendingForMatch(job.data.matchId);

        await Promise.all(
          pendingRows.map((row) =>
            this.kapsoClient.sendText(
              row.player.phoneE164,
              `Recordatorio pichanga: tienes $${row.amountDue - row.amountPaid} pendiente. Responde \"ya pague\" al completar.`
            )
          )
        );

        logger.info({ matchId: job.data.matchId, reminders: pendingRows.length }, "Pending reminders sent");
      },
      { connection: redisConnection }
    );

    worker.on("failed", (job, error) => {
      logger.error({ jobId: job?.id, error }, "Reminder job failed");
    });

    logger.info({ remindersEnabled: env.NODE_ENV !== "test" }, "Reminder worker started");
  }

  async enqueuePendingPaymentsReminder(matchId: string): Promise<void> {
    await this.queue.add("pending-payment-reminder", { matchId });
  }
}
