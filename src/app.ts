import Fastify from "fastify";
import { env } from "./config/env.js";
import { AdminController } from "./modules/admin/admin.controller.js";
import { AttendanceService } from "./modules/attendance/attendance.service.js";
import { MatchesService } from "./modules/matches/matches.service.js";
import { PaymentsService } from "./modules/payments/payments.service.js";
import { PlayersService } from "./modules/players/players.service.js";
import { RestaurantExpensesService } from "./modules/restaurant/restaurant-expenses.service.js";
import { RemindersJobs } from "./modules/reminders/reminders.jobs.js";
import { RestaurantBillController } from "./modules/tools/restaurant-bill.controller.js";
import { RestaurantBillService } from "./modules/tools/restaurant-bill.service.js";
import { KapsoClient } from "./modules/whatsapp/kapso.client.js";
import { WhatsAppController } from "./modules/whatsapp/whatsapp.controller.js";
import { WhatsAppService } from "./modules/whatsapp/whatsapp.service.js";

export function buildApp() {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL }
  });

  const kapsoClient = new KapsoClient();
  const playersService = new PlayersService();
  const attendanceService = new AttendanceService();
  const matchesService = new MatchesService();
  const paymentsService = new PaymentsService(attendanceService);
  const restaurantExpensesService = new RestaurantExpensesService();
  const remindersJobs = new RemindersJobs(paymentsService, kapsoClient);
  const restaurantBillService = new RestaurantBillService();
  const whatsappService = new WhatsAppService(
    kapsoClient,
    playersService,
    matchesService,
    attendanceService,
    paymentsService,
    restaurantExpensesService
  );

  const whatsappController = new WhatsAppController(whatsappService);
  const adminController = new AdminController(matchesService, remindersJobs);
  const restaurantBillController = new RestaurantBillController(restaurantBillService);

  app.get("/health", async () => ({ ok: true, env: env.NODE_ENV }));
  app.post("/webhooks/kapso/messages", whatsappController.handleWebhook);

  app.post("/admin/matches", adminController.createMatch);
  app.get("/admin/matches/:id/state", adminController.getMatchState);
  app.post("/admin/matches/:id/remind", adminController.remindPending);
  app.post("/tools/restaurant/split", restaurantBillController.split);

  if (env.NODE_ENV !== "test") {
    remindersJobs.startWorker();
  }

  return app;
}
