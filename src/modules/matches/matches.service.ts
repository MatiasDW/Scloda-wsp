import { MatchStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../shared/db/prisma.js";

export interface CreateMatchInput {
  startsAt: Date;
  venue: string;
  totalCost: number;
  slots: number;
  activateNow?: boolean;
}

export class MatchesService {
  async getActiveMatch() {
    return prisma.match.findFirst({
      where: { status: MatchStatus.ACTIVE },
      orderBy: { startsAt: "asc" }
    });
  }

  async createMatch(input: CreateMatchInput) {
    if (input.activateNow) {
      await prisma.match.updateMany({
        where: { status: MatchStatus.ACTIVE },
        data: { status: MatchStatus.CLOSED }
      });
    }

    return prisma.match.create({
      data: {
        startsAt: input.startsAt,
        venue: input.venue,
        totalCost: input.totalCost,
        slots: input.slots,
        status: input.activateNow ? MatchStatus.ACTIVE : MatchStatus.DRAFT
      }
    });
  }

  async updateMatchVenue(matchId: string, venue: string) {
    return prisma.match.update({
      where: { id: matchId },
      data: { venue }
    });
  }

  async getMatchState(matchId: string) {
    const [match, confirmedCount, paidPayments, pendingPayments] = await Promise.all([
      prisma.match.findUnique({ where: { id: matchId } }),
      prisma.attendance.count({ where: { matchId, status: "CONFIRMED" } }),
      prisma.payment.findMany({ where: { matchId, status: "PAID" } }),
      prisma.payment.findMany({ where: { matchId, status: "PENDING" } })
    ]);

    if (!match) {
      return null;
    }

    const collected = paidPayments.reduce((sum, row) => sum + row.amountPaid, 0);
    const pending = pendingPayments.reduce((sum, row) => sum + Math.max(row.amountDue - row.amountPaid, 0), 0);

    return {
      matchId: match.id,
      startsAt: match.startsAt,
      venue: match.venue,
      totalCost: match.totalCost,
      slots: match.slots,
      confirmedCount,
      openSpots: Math.max(match.slots - confirmedCount, 0),
      collected,
      pending
    };
  }
}
