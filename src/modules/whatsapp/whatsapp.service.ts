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

type MatchSetupStep = "AWAITING_SLOTS" | "AWAITING_TOTAL_COST" | "AWAITING_CITATION_TIME" | "AWAITING_VENUE";

type MatchSetupSession = {
  step: MatchSetupStep;
  slots?: number;
  totalCost?: number;
  citationHour?: number;
  citationMinute?: number;
  venue?: string;
};

function stripAccents(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseSlotsFromText(input: string): number | null {
  const normalized = stripAccents(input.toLowerCase());
  const labeledMatch = normalized.match(/(\d{1,2})\s*(jugadores?|personas?|cupos?)/);
  if (labeledMatch?.[1]) {
    const slots = Number.parseInt(labeledMatch[1], 10);
    return slots >= 6 && slots <= 40 ? slots : null;
  }

  const numericMatches = [...normalized.matchAll(/\d{1,2}/g)];
  for (const candidate of numericMatches) {
    const value = Number.parseInt(candidate[0], 10);
    if (value >= 6 && value <= 40) {
      return value;
    }
  }

  return null;
}

function parseCostFromText(input: string): number | null {
  const normalized = stripAccents(input.toLowerCase());

  const lucasMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(lucas|luca|k)\b/);
  if (lucasMatch?.[1]) {
    const base = Number.parseFloat(lucasMatch[1].replace(",", "."));
    if (Number.isFinite(base) && base > 0) {
      return Math.round(base * 1000);
    }
  }

  const groupedAmountMatch = normalized.match(/(\$?\s*\d{1,3}(?:[.\s]\d{3})+)/);
  if (groupedAmountMatch?.[1]) {
    const digits = groupedAmountMatch[1].replace(/[^\d]/g, "");
    const amount = Number.parseInt(digits, 10);
    if (Number.isFinite(amount) && amount >= 1000) {
      return amount;
    }
  }

  const plainAmountMatches = [...normalized.matchAll(/\b\d{4,8}\b/g)];
  for (const candidate of plainAmountMatches) {
    const amount = Number.parseInt(candidate[0], 10);
    if (amount >= 1000) {
      return amount;
    }
  }

  return null;
}

function parseTimeExpression(input: string): { hour: number; minute: number } | null {
  const normalized = stripAccents(input.trim().toLowerCase());

  const ampm = normalized.match(/(?:a\s*las\s*)?(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/);
  if (ampm?.[1]) {
    const rawHour = Number.parseInt(ampm[1], 10);
    const minute = ampm[2] ? Number.parseInt(ampm[2], 10) : 0;
    if (rawHour < 1 || rawHour > 12) {
      return null;
    }

    const meridiem = ampm[3];
    let hour = rawHour % 12;
    if (meridiem === "pm") {
      hour += 12;
    }
    return { hour, minute };
  }

  const hhmm = normalized.match(/\b([01]?\d|2[0-3])[:h]([0-5]\d)\b/);
  if (hhmm?.[1] && hhmm[2]) {
    return {
      hour: Number.parseInt(hhmm[1], 10),
      minute: Number.parseInt(hhmm[2], 10)
    };
  }

  const hourOnly = normalized.match(/\b([01]?\d|2[0-3])\s*(hrs?|horas?)?\b/);
  if (!hourOnly?.[1]) {
    return null;
  }

  return {
    hour: Number.parseInt(hourOnly[1], 10),
    minute: 0
  };
}

function parseCitationTime(input: string): { hour: number; minute: number } | null {
  const normalized = stripAccents(input.trim().toLowerCase());
  const keywordSegment = normalized.match(/(?:citacion|cita|hora)\s*(?:de|a\s*las|:)?\s*([^,.;\n]+)/);
  if (keywordSegment?.[1]) {
    return parseTimeExpression(keywordSegment[1]);
  }

  // Only parse standalone time expressions when the whole message is short.
  const isStandalone = /^(\d{1,2}(:\d{2})?\s*(am|pm|hrs?|horas?)?|\s*a\s*las\s*\d{1,2}(:\d{2})?\s*(am|pm|hrs?|horas?)?)$/i.test(
    normalized
  );
  if (!isStandalone) {
    return null;
  }

  return parseTimeExpression(normalized);
}

function sanitizeVenue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseVenueFromText(input: string): string | null {
  const compact = sanitizeVenue(input);
  if (compact.length < 4) {
    return null;
  }

  const explicit = compact.match(
    /(?:direccion|dirección|ubicacion|ubicación|lugar)\s*[:\-]?\s*(.+)$/i
  );
  if (explicit?.[1]) {
    const candidate = sanitizeVenue(explicit[1]);
    if (
      candidate.length >= 4 &&
      !/(?:lucas|luca|\$\s*\d+|\bcitacion\b|\bcitación\b)/i.test(candidate)
    ) {
      return candidate.slice(0, 80);
    }
  }

  if (/[a-zA-Z]/.test(compact) && !/(?:lucas|luca|\$\s*\d+|\b\d{4,}\b)/i.test(compact)) {
    return compact.slice(0, 80);
  }

  return null;
}

function buildNextStartsAt(hour: number, minute: number): Date {
  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setHours(hour, minute, 0, 0);

  if (startsAt.getTime() <= now.getTime()) {
    startsAt.setDate(startsAt.getDate() + 1);
  }

  return startsAt;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CL").format(amount);
}

function formatStartsAt(startsAt: Date): { date: string; time: string } {
  return {
    date: startsAt.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }),
    time: startsAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
  };
}

function buildSlotsList(slots: number, confirmedNames: string[]): string {
  const lines: string[] = [];
  for (let idx = 0; idx < slots; idx += 1) {
    const slotNumber = idx + 1;
    const name = confirmedNames[idx];
    lines.push(`${slotNumber}. ${name ? name : "[pendiente]"}`);
  }

  return lines.join("\n");
}

function isGreetingOrHelp(normalizedBody: string): boolean {
  return ["hola", "buenas", "inicio", "menu", "menú", "ayuda", "help", "scloda"].includes(normalizedBody);
}

function buildSclodaIntro(): string {
  return [
    "Hola, soy Scloda 👋",
    "Te ayudo a organizar pichangas y ordenar las cuentas por WhatsApp.",
    "",
    "Comandos:",
    "- configurar partido",
    "- me sumo",
    "- me bajo",
    "- cuanto debo",
    "- ya pague",
    "- estado"
  ].join("\n");
}

function looksLikeSetupIntent(rawBody: string): boolean {
  const normalized = stripAccents(rawBody.toLowerCase());
  const hasKeyword = /(partido|pichanga|cancha|citacion|cita|jugadores|cupos|direccion|ubicacion|lugar)/.test(normalized);
  if (!hasKeyword) {
    return false;
  }

  return (
    parseSlotsFromText(rawBody) !== null ||
    parseCostFromText(rawBody) !== null ||
    parseCitationTime(rawBody) !== null ||
    parseVenueFromText(rawBody) !== null
  );
}

export class WhatsAppService {
  private readonly setupSessions = new Map<string, MatchSetupSession>();

  constructor(
    private readonly kapsoClient: KapsoClient,
    private readonly playersService: PlayersService,
    private readonly matchesService: MatchesService,
    private readonly attendanceService: AttendanceService,
    private readonly paymentsService: PaymentsService
  ) {}

  async processIncomingMessage(message: IncomingMessage): Promise<void> {
    const normalizedBody = message.body.trim().toLowerCase();

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

    const existingSession = this.setupSessions.get(player.phoneE164);
    if (existingSession) {
      if (normalizedBody === "cancelar") {
        this.setupSessions.delete(player.phoneE164);
        await this.kapsoClient.sendText(player.phoneE164, "Configuracion cancelada.");
        return;
      }

      await this.handleSetupSession(player.phoneE164, existingSession, message.body);
      return;
    }

    if (command === "UNKNOWN") {
      const inferredVenue = parseVenueFromText(message.body);
      if (inferredVenue) {
        const activeMatch = await this.matchesService.getActiveMatch();
        if (activeMatch) {
          await this.matchesService.updateMatchVenue(activeMatch.id, inferredVenue);
          const state = await this.matchesService.getMatchState(activeMatch.id);
          const confirmedPlayers = await this.attendanceService.listConfirmedPlayers(activeMatch.id);
          const updatedMatch = await this.matchesService.getActiveMatch();

          if (state && updatedMatch) {
            const { date, time } = formatStartsAt(updatedMatch.startsAt);
            const slotsList = buildSlotsList(updatedMatch.slots, confirmedPlayers.map((row) => row.name));

            await this.kapsoClient.sendText(
              player.phoneE164,
              [
                "Direccion actualizada.",
                `- Fecha: ${date}`,
                `- Hora citacion: ${time}`,
                `- Direccion: ${updatedMatch.venue}`,
                `- Cupos: ${state.confirmedCount}/${state.slots} confirmados`,
                "",
                "Lista de jugadores:",
                slotsList
              ].join("\n")
            );
            return;
          }
        }
      }
    }

    if (command === "UNKNOWN" && looksLikeSetupIntent(message.body)) {
      this.setupSessions.set(player.phoneE164, { step: "AWAITING_SLOTS" });
      await this.handleSetupSession(player.phoneE164, { step: "AWAITING_SLOTS" }, message.body);
      return;
    }

    if (command === "SETUP_MATCH") {
      this.setupSessions.set(player.phoneE164, { step: "AWAITING_SLOTS" });
      await this.kapsoClient.sendText(
        player.phoneE164,
        "Soy Scloda, tu agente para organizar la pichanga.\n\nVamos a configurarla:\n1) Cuantos jugadores (cupos) tendra? Ejemplo: 12\n(Escribe 'cancelar' para salir)."
      );
      return;
    }

    if (isGreetingOrHelp(normalizedBody)) {
      await this.kapsoClient.sendText(player.phoneE164, buildSclodaIntro());
      return;
    }

    if (command === "UNKNOWN") {
      await this.kapsoClient.sendText(
        player.phoneE164,
        `${buildSclodaIntro()}\n\nNo entendi ese mensaje.`
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

      const confirmedPlayers = await this.attendanceService.listConfirmedPlayers(activeMatch.id);
      const { date, time } = formatStartsAt(activeMatch.startsAt);
      const slotsList = buildSlotsList(activeMatch.slots, confirmedPlayers.map((row) => row.name));

      await this.kapsoClient.sendText(
        player.phoneE164,
        [
          "Resumen Scloda",
          `- Fecha: ${date}`,
          `- Hora citacion: ${time}`,
          `- Direccion: ${activeMatch.venue}`,
          `- Cupos: ${state.confirmedCount}/${state.slots} confirmados`,
          `- Caja: $${formatCurrency(state.collected)} recaudado | $${formatCurrency(state.pending)} pendiente`,
          "",
          "Lista de jugadores:",
          slotsList
        ].join("\n")
      );
    }
  }

  private async handleSetupSession(phoneE164: string, session: MatchSetupSession, messageBody: string): Promise<void> {
    const inferredSlots = parseSlotsFromText(messageBody);
    const inferredCost = parseCostFromText(messageBody);
    const inferredTime = parseCitationTime(messageBody);
    const inferredVenue = parseVenueFromText(messageBody);

    const merged: MatchSetupSession = {
      step: session.step,
      slots: session.slots ?? inferredSlots ?? undefined,
      totalCost: session.totalCost ?? inferredCost ?? undefined,
      citationHour: session.citationHour ?? inferredTime?.hour ?? undefined,
      citationMinute: session.citationMinute ?? inferredTime?.minute ?? undefined,
      venue: session.venue ?? inferredVenue ?? undefined
    };

    if (merged.slots && merged.totalCost && merged.citationHour !== undefined && merged.citationMinute !== undefined && merged.venue) {
      await this.completeMatchSetup(
        phoneE164,
        merged.slots,
        merged.totalCost,
        merged.citationHour,
        merged.citationMinute,
        merged.venue
      );
      return;
    }

    if (!merged.slots) {
      this.setupSessions.set(phoneE164, { step: "AWAITING_SLOTS" });
      await this.kapsoClient.sendText(
        phoneE164,
        "No capte la cantidad de jugadores. Dime algo como: '12 jugadores' o solo '12'."
      );
      return;
    }

    if (!merged.totalCost) {
      this.setupSessions.set(phoneE164, {
        step: "AWAITING_TOTAL_COST",
        slots: merged.slots
      });
      await this.kapsoClient.sendText(
        phoneE164,
        "Perfecto. Ahora el valor de cancha. Ejemplos: '80000', '$80.000' o '80 lucas'."
      );
      return;
    }

    if (merged.citationHour === undefined || merged.citationMinute === undefined) {
      this.setupSessions.set(phoneE164, {
        step: "AWAITING_CITATION_TIME",
        slots: merged.slots,
        totalCost: merged.totalCost
      });
      await this.kapsoClient.sendText(
        phoneE164,
        "Listo. Solo falta la hora de citacion. Ejemplos: '21:00', '21', '9pm' o 'a las 21:30'."
      );
      return;
    }

    this.setupSessions.set(phoneE164, {
      step: "AWAITING_VENUE",
      slots: merged.slots,
      totalCost: merged.totalCost,
      citationHour: merged.citationHour,
      citationMinute: merged.citationMinute
    });

    await this.kapsoClient.sendText(
      phoneE164,
      "Perfecto. Falta la direccion/cancha. Ejemplos: 'Escandinavia 350' o 'Cancha Las Condes'."
    );
  }

  private async completeMatchSetup(
    phoneE164: string,
    slots: number,
    totalCost: number,
    hour: number,
    minute: number,
    venue: string
  ): Promise<void> {
    const startsAt = buildNextStartsAt(hour, minute);
    const createdMatch = await this.matchesService.createMatch({
      startsAt,
      venue,
      totalCost,
      slots,
      activateNow: true
    });

    await this.paymentsService.recalculateForMatch(createdMatch.id, createdMatch.totalCost);
    this.setupSessions.delete(phoneE164);

    const { date, time } = formatStartsAt(startsAt);
    const slotsList = buildSlotsList(slots, []);

    await this.kapsoClient.sendText(
      phoneE164,
      [
        "Listo, partido configurado.",
        `- Fecha: ${date}`,
        `- Hora citacion: ${time}`,
        `- Direccion: ${venue}`,
        `- Valor cancha: $${formatCurrency(totalCost)}`,
        `- Cupos: ${slots}`,
        "",
        "Lista de jugadores:",
        slotsList,
        "",
        "Para confirmar, respondan: me sumo"
      ].join("\n")
    );
  }
}
