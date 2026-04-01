import { prisma } from "../../shared/db/prisma.js";

export class PlayersService {
  normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, "").trim();
  }

  private normalizeName(name: string): string {
    return name.replace(/\s+/g, " ").trim();
  }

  async findOrCreateByPhone(phone: string, fallbackName = "Jugador"): Promise<{ id: string; name: string; phoneE164: string }> {
    const phoneE164 = this.normalizePhone(phone);
    const normalizedName = this.normalizeName(fallbackName);

    const existing = await prisma.player.findUnique({ where: { phoneE164 } });
    if (existing) {
      const isGeneric = existing.name.toLowerCase() === "jugador" || existing.name === phoneE164;
      if (normalizedName && normalizedName.toLowerCase() !== "jugador" && (isGeneric || existing.name !== normalizedName)) {
        return prisma.player.update({
          where: { id: existing.id },
          data: { name: normalizedName }
        });
      }

      return existing;
    }

    return prisma.player.create({
      data: {
        name: normalizedName || "Jugador",
        phoneE164
      }
    });
  }
}
