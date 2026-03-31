import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";
import { AttendanceService } from "../attendance/attendance.service.js";
import { MatchesService } from "../matches/matches.service.js";
import { PaymentsService } from "../payments/payments.service.js";
import { PlayersService } from "../players/players.service.js";
import { parseCommand } from "./command.parser.js";
import { KapsoClient } from "./kapso.client.js";

export interface IncomingMessage {
  messageId: string;
  fromPhone: string;
  body: string;
  profileName?: string;
}

export class WhatsAppService {
  constructor(
    private readonly kapsoClient: KapsoClient,
    private readonly playersService: PlayersService,
    private readonly matchesService: MatchesService,
    private readonly attendanceService: AttendanceService,
    private readonly paymentsService: PaymentsService
  ) {}

  async processIncomingMessage(message: IncomingMessage): Promise<void> {
    const command = parseCommand(message.body);

    try {
      await prisma.inboundMessage.create({
        data: {
          messageId: message.messageId,
          phone: message.fromPhone,
          body: message.body,
          command
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return;
      }

      throw error;
    }

    const player = await this.playersService.findOrCreateByPhone(message.fromPhone, message.profileName ?? "Jugador");

    if (command === "UNKNOWN") {
      await this.kapsoClient.sendText(
        player.phoneE164,
        "Comando no reconocido. Usa: me sumo, me bajo, cuanto debo, ya pague, estado"
      );
      return;
    }

    const activeMatch = await this.matchesService.getActiveMatch();

    if (!activeMatch) {
      await this.kapsoClient.sendText(player.phoneE164, "No hay pichanga activa por ahora.");
      return;
    }

    if (command === "JOIN") {
      await this.attendanceService.setConfirmed(activeMatch.id, player.id);
      await this.paymentsService.recalculateForMatch(activeMatch.id, activeMatch.totalCost);
      const debt = await this.paymentsService.getDebt(activeMatch.id, player.id);

      await this.kapsoClient.sendText(
        player.phoneE164,
        `Listo, quedaste confirmado. Tu deuda actual es $${debt?.amountDue ?? 0}.`
      );
      return;
    }

    if (command === "LEAVE") {
      await this.attendanceService.setDropped(activeMatch.id, player.id);
      await this.paymentsService.recalculateForMatch(activeMatch.id, activeMatch.totalCost);

      await this.kapsoClient.sendText(player.phoneE164, "Listo, te bajé de la pichanga.");
      return;
    }

    if (command === "DEBT") {
      const debt = await this.paymentsService.getDebt(activeMatch.id, player.id);
      if (!debt) {
        await this.kapsoClient.sendText(player.phoneE164, "No tienes deuda activa. Si vas a jugar, responde 'me sumo'.");
        return;
      }

      const pending = Math.max(debt.amountDue - debt.amountPaid, 0);
      await this.kapsoClient.sendText(player.phoneE164, `Debes $${pending}. Total cuota: $${debt.amountDue}.`);
      return;
    }

    if (command === "PAID") {
      const payment = await this.paymentsService.markPaid(activeMatch.id, player.id);
      const pending = Math.max(payment.amountDue - payment.amountPaid, 0);

      await this.kapsoClient.sendText(
        player.phoneE164,
        pending > 0 ? `Pago registrado parcial. Te faltan $${pending}.` : "Pago registrado. Quedaste al dia."
      );
      return;
    }

    if (command === "STATUS") {
      const state = await this.matchesService.getMatchState(activeMatch.id);

      if (!state) {
        await this.kapsoClient.sendText(player.phoneE164, "No pude obtener el estado actual.");
        return;
      }

      await this.kapsoClient.sendText(
        player.phoneE164,
        `Estado pichanga: ${state.confirmedCount}/${state.slots} confirmados, ${state.openSpots} cupos libres, $${state.collected} recaudado, $${state.pending} pendiente.`
      );
    }
  }
}
