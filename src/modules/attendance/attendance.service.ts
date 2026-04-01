import { AttendanceStatus } from "../../generated/prisma/index.js";
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

  async listConfirmedPlayers(matchId: string): Promise<Array<{ id: string; name: string; phoneE164: string }>> {
    const rows = await prisma.attendance.findMany({
      where: {
        matchId,
        status: AttendanceStatus.CONFIRMED
      },
      include: {
        player: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return rows.map((row) => ({
      id: row.player.id,
      name: row.player.name,
      phoneE164: row.player.phoneE164
    }));
  }
}
