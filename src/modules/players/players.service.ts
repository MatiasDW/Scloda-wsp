import { prisma } from "../../shared/db/prisma.js";

export class PlayersService {
  normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, "").trim();
  }

  async findOrCreateByPhone(phone: string, fallbackName = "Jugador"): Promise<{ id: string; name: string; phoneE164: string }> {
    const phoneE164 = this.normalizePhone(phone);

    const existing = await prisma.player.findUnique({ where: { phoneE164 } });
    if (existing) {
      return existing;
    }

    return prisma.player.create({
      data: {
        name: fallbackName,
        phoneE164
      }
    });
  }
}
