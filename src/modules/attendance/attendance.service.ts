import { AttendanceStatus } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";

export class AttendanceService {
  async setConfirmed(matchId: string, playerId: string): Promise<void> {
    await prisma.attendance.upsert({
      where: {
        matchId_playerId: {
          matchId,
          playerId
        }
      },
      update: {
        status: AttendanceStatus.CONFIRMED
      },
      create: {
        matchId,
        playerId,
        status: AttendanceStatus.CONFIRMED
      }
    });
  }

  async setDropped(matchId: string, playerId: string): Promise<void> {
    await prisma.attendance.upsert({
      where: {
        matchId_playerId: {
          matchId,
          playerId
        }
      },
      update: {
        status: AttendanceStatus.DROPPED
      },
      create: {
        matchId,
        playerId,
        status: AttendanceStatus.DROPPED
      }
    });
  }

  async countConfirmed(matchId: string): Promise<number> {
    return prisma.attendance.count({
      where: {
        matchId,
        status: AttendanceStatus.CONFIRMED
      }
    });
  }

  async listConfirmedPlayerIds(matchId: string): Promise<string[]> {
    const rows = await prisma.attendance.findMany({
      where: {
        matchId,
        status: AttendanceStatus.CONFIRMED
      },
      select: {
        playerId: true
      },
      orderBy: {
        playerId: "asc"
      }
    });

    return rows.map((row) => row.playerId);
  }
}
