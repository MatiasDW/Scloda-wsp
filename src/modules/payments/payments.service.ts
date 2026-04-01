import { PaymentStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../shared/db/prisma.js";
import { AttendanceService } from "../attendance/attendance.service.js";

export class PaymentsService {
  constructor(private readonly attendanceService: AttendanceService) {}

  async recalculateForMatch(matchId: string, totalCost: number): Promise<void> {
    const confirmedPlayerIds = await this.attendanceService.listConfirmedPlayerIds(matchId);

    if (confirmedPlayerIds.length === 0) {
      await prisma.payment.deleteMany({ where: { matchId } });
      return;
    }

    const base = Math.floor(totalCost / confirmedPlayerIds.length);
    const remainder = totalCost - base * confirmedPlayerIds.length;

    const existing = await prisma.payment.findMany({ where: { matchId } });
    const existingByPlayer = new Map(existing.map((row) => [row.playerId, row]));

    await Promise.all(
      confirmedPlayerIds.map(async (playerId, idx) => {
        const due = base + (idx === confirmedPlayerIds.length - 1 ? remainder : 0);
        const old = existingByPlayer.get(playerId);
        const amountPaid = old?.amountPaid ?? 0;
        const status = amountPaid >= due ? PaymentStatus.PAID : PaymentStatus.PENDING;

        await prisma.payment.upsert({
          where: {
            matchId_playerId: {
              matchId,
              playerId
            }
          },
          update: {
            amountDue: due,
            amountPaid,
            status
          },
          create: {
            matchId,
            playerId,
            amountDue: due,
            amountPaid,
            status
          }
        });
      })
    );

    await prisma.payment.deleteMany({
      where: {
        matchId,
        playerId: { notIn: confirmedPlayerIds }
      }
    });
  }

  async getDebt(matchId: string, playerId: string) {
    return prisma.payment.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId
        }
      }
    });
  }

  async markPaid(matchId: string, playerId: string, amount?: number) {
    const current = await prisma.payment.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId
        }
      }
    });

    const amountDue = current?.amountDue ?? 0;
    const updatedAmountPaid = amount !== undefined ? (current?.amountPaid ?? 0) + Math.max(amount, 0) : amountDue;
    const status = updatedAmountPaid >= amountDue ? PaymentStatus.PAID : PaymentStatus.PENDING;

    return prisma.payment.upsert({
      where: {
        matchId_playerId: {
          matchId,
          playerId
        }
      },
      update: {
        amountPaid: updatedAmountPaid,
        status
      },
      create: {
        matchId,
        playerId,
        amountDue,
        amountPaid: updatedAmountPaid,
        status
      }
    });
  }

  async listPendingForMatch(matchId: string) {
    return prisma.payment.findMany({
      where: {
        matchId,
        status: PaymentStatus.PENDING
      },
      include: {
        player: true
      }
    });
  }
}
