import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { MatchesService } from "../matches/matches.service.js";
import { RemindersJobs } from "../reminders/reminders.jobs.js";

const createMatchSchema = z.object({
  startsAt: z.string().datetime(),
  venue: z.string().min(2),
  totalCost: z.number().int().positive(),
  slots: z.number().int().positive(),
  activateNow: z.boolean().default(true)
});

export class AdminController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly remindersJobs: RemindersJobs
  ) {}

  private assertAdmin(request: FastifyRequest): void {
    const provided = request.headers["x-admin-key"];
    if (provided !== env.ADMIN_API_KEY) {
      throw new Error("unauthorized");
    }
  }

  createMatch = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      this.assertAdmin(request);
      const body = createMatchSchema.parse(request.body);

      const created = await this.matchesService.createMatch({
        startsAt: new Date(body.startsAt),
        venue: body.venue,
        totalCost: body.totalCost,
        slots: body.slots,
        activateNow: body.activateNow
      });

      reply.code(201).send({ ok: true, match: created });
    } catch (error) {
      if (error instanceof Error && error.message === "unauthorized") {
        reply.code(401).send({ ok: false, message: "unauthorized" });
        return;
      }

      reply.code(400).send({ ok: false, message: "invalid_request" });
    }
  };

  getMatchState = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    try {
      this.assertAdmin(request);
      const state = await this.matchesService.getMatchState(request.params.id);

      if (!state) {
        reply.code(404).send({ ok: false, message: "match_not_found" });
        return;
      }

      reply.send({ ok: true, state });
    } catch (error) {
      if (error instanceof Error && error.message === "unauthorized") {
        reply.code(401).send({ ok: false, message: "unauthorized" });
        return;
      }

      reply.code(400).send({ ok: false, message: "bad_request" });
    }
  };

  remindPending = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    try {
      this.assertAdmin(request);
      await this.remindersJobs.enqueuePendingPaymentsReminder(request.params.id);
      reply.send({ ok: true, enqueued: true });
    } catch (error) {
      if (error instanceof Error && error.message === "unauthorized") {
        reply.code(401).send({ ok: false, message: "unauthorized" });
        return;
      }

      reply.code(400).send({ ok: false, message: "bad_request" });
    }
  };
}
