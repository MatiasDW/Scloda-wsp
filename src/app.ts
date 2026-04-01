import Fastify from "fastify";
import { env } from "./config/env.js";
import { AdminController } from "./modules/admin/admin.controller.js";
import { AttendanceService } from "./modules/attendance/attendance.service.js";
import { MatchesService } from "./modules/matches/matches.service.js";
import { PaymentsService } from "./modules/payments/payments.service.js";
import { PlayersService } from "./modules/players/players.service.js";
import { RemindersJobs } from "./modules/reminders/reminders.jobs.js";
import { KapsoClient } from "./modules/whatsapp/kapso.client.js";
import { WhatsAppController } from "./modules/whatsapp/whatsapp.controller.js";
import { WhatsAppService } from "./modules/whatsapp/whatsapp.service.js";

export function buildApp() {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL }
  });

  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "string" }, (request, body, done) => {
    try {
      const rawBody = typeof body === "string" ? body : body.toString("utf8");
      (request as any).rawBody = rawBody;
      done(null, rawBody.length > 0 ? JSON.parse(rawBody) : {});
    } catch (error) {
      done(error as Error, undefined);
    }
  });

  const kapsoClient = new KapsoClient();
  const playersService = new PlayersService();
  const attendanceService = new AttendanceService();
  const matchesService = new MatchesService();
  const paymentsService = new PaymentsService(attendanceService);
  const remindersJobs = new RemindersJobs(paymentsService, kapsoClient);
  const whatsappService = new WhatsAppService(
    kapsoClient,
    playersService,
    matchesService,
    attendanceService,
    paymentsService
  );

  const whatsappController = new WhatsAppController(whatsappService);
  const adminController = new AdminController(matchesService, remindersJobs);

  app.get("/health", async () => ({ ok: true, env: env.NODE_ENV }));
  app.post("/webhooks/kapso/messages", whatsappController.handleWebhook);

  app.post("/admin/matches", adminController.createMatch);
  app.get("/admin/matches/:id/state", adminController.getMatchState);
  app.post("/admin/matches/:id/remind", adminController.remindPending);

  if (env.NODE_ENV !== "test") {
    remindersJobs.startWorker();
  }

  return app;
}
