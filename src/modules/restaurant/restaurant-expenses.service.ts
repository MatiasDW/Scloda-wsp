import {
  RestaurantEventStatus,
  RestaurantItemScope,
  RestaurantParticipantStatus
} from "../../generated/prisma/index.js";
import { prisma } from "../../shared/db/prisma.js";

export type ConsumptionTarget =
  | { kind: "SELF" }
  | { kind: "ALL" }
  | { kind: "INDEXES"; indexes: number[] };

export interface StartRestaurantEventInput {
  title: string;
  venue?: string;
  startsAt?: Date;
  tipPercent?: number;
  serviceCharge?: number;
}

export interface AddConsumptionInput {
  description: string;
  quantity: number;
  totalAmount: number;
  target: ConsumptionTarget;
}

export interface RestaurantSummary {
  eventId: string;
  title: string;
  venue?: string;
  status: RestaurantEventStatus;
  itemsCount: number;
  subtotal: number;
  tipPercent: number;
  tipAmount: number;
  serviceCharge: number;
  total: number;
  participants: Array<{
    index: number;
    playerId: string;
    name: string;
    itemSubtotal: number;
    extras: number;
    amountDue: number;
  }>;
}

type JoinedParticipant = {
  index: number;
  playerId: string;
  name: string;
  phoneE164: string;
};

export class RestaurantExpensesService {
  async getActiveEvent() {
    return prisma.restaurantEvent.findFirst({
      where: { status: RestaurantEventStatus.ACTIVE },
      orderBy: { createdAt: "desc" }
    });
  }

  async startEvent(createdByPlayerId: string, input: StartRestaurantEventInput) {
    await prisma.restaurantEvent.updateMany({
      where: { status: RestaurantEventStatus.ACTIVE },
      data: { status: RestaurantEventStatus.CLOSED }
    });

    const event = await prisma.restaurantEvent.create({
      data: {
        title: input.title,
        venue: input.venue,
        startsAt: input.startsAt,
        tipPercent: input.tipPercent ?? 10,
        serviceCharge: input.serviceCharge ?? 0,
        status: RestaurantEventStatus.ACTIVE,
        createdByPlayerId
      }
    });

    await prisma.restaurantParticipant.upsert({
      where: {
        eventId_playerId: {
          eventId: event.id,
          playerId: createdByPlayerId
        }
      },
      update: { status: RestaurantParticipantStatus.JOINED },
      create: {
        eventId: event.id,
        playerId: createdByPlayerId,
        status: RestaurantParticipantStatus.JOINED
      }
    });

    return event;
  }

  async joinActiveEvent(playerId: string) {
    const active = await this.getActiveEvent();
    if (!active) {
      return null;
    }

    await prisma.restaurantParticipant.upsert({
      where: {
        eventId_playerId: {
          eventId: active.id,
          playerId
        }
      },
      update: { status: RestaurantParticipantStatus.JOINED },
      create: {
        eventId: active.id,
        playerId,
        status: RestaurantParticipantStatus.JOINED
      }
    });

    return active;
  }

  async leaveActiveEvent(playerId: string) {
    const active = await this.getActiveEvent();
    if (!active) {
      return null;
    }

    await prisma.restaurantParticipant.upsert({
      where: {
        eventId_playerId: {
          eventId: active.id,
          playerId
        }
      },
      update: { status: RestaurantParticipantStatus.LEFT },
      create: {
        eventId: active.id,
        playerId,
        status: RestaurantParticipantStatus.LEFT
      }
    });

    return active;
  }

  async closeActiveEvent() {
    const active = await this.getActiveEvent();
    if (!active) {
      return null;
    }

    return prisma.restaurantEvent.update({
      where: { id: active.id },
      data: { status: RestaurantEventStatus.CLOSED }
    });
  }

  async listJoinedParticipants(eventId: string): Promise<JoinedParticipant[]> {
    const rows = await prisma.restaurantParticipant.findMany({
      where: {
        eventId,
        status: RestaurantParticipantStatus.JOINED
      },
      include: {
        player: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return rows.map((row, idx) => ({
      index: idx + 1,
      playerId: row.playerId,
      name: row.player.name,
      phoneE164: row.player.phoneE164
    }));
  }

  async addConsumption(eventId: string, actorPlayerId: string, input: AddConsumptionInput) {
    const participants = await this.listJoinedParticipants(eventId);
    if (participants.length === 0) {
      throw new Error("no_joined_participants");
    }

    const consumerIds = this.resolveConsumerIds(participants, actorPlayerId, input.target);
    if (consumerIds.length === 0) {
      throw new Error("no_valid_consumers");
    }

    const scope =
      input.target.kind === "ALL"
        ? RestaurantItemScope.ALL
        : input.target.kind === "INDEXES"
          ? RestaurantItemScope.SELECTED
          : RestaurantItemScope.SELF;

    const item = await prisma.restaurantItem.create({
      data: {
        eventId,
        createdByPlayerId: actorPlayerId,
        description: input.description,
        quantity: Math.max(input.quantity, 1),
        totalAmount: Math.max(input.totalAmount, 0),
        scope,
        consumers: {
          createMany: {
            data: consumerIds.map((playerId) => ({ playerId }))
          }
        }
      },
      include: {
        consumers: true
      }
    });

    return item;
  }

  async getSummary(eventId: string): Promise<RestaurantSummary | null> {
    const event = await prisma.restaurantEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return null;
    }

    const participants = await this.listJoinedParticipants(eventId);
    const items = await prisma.restaurantItem.findMany({
      where: { eventId },
      include: {
        consumers: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    const subtotalByPlayer = new Map<string, number>();
    for (const participant of participants) {
      subtotalByPlayer.set(participant.playerId, 0);
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.totalAmount;
      const consumers = [...item.consumers].sort((a, b) => a.playerId.localeCompare(b.playerId));
      if (consumers.length === 0) {
        continue;
      }

      const base = Math.floor(item.totalAmount / consumers.length);
      const remainder = item.totalAmount - base * consumers.length;

      for (let idx = 0; idx < consumers.length; idx += 1) {
        const consumer = consumers[idx];
        if (!consumer) {
          continue;
        }
        const current = subtotalByPlayer.get(consumer.playerId) ?? 0;
        subtotalByPlayer.set(consumer.playerId, current + base + (idx < remainder ? 1 : 0));
      }
    }

    const tipAmount = Math.round((subtotal * event.tipPercent) / 100);
    const extraAmount = tipAmount + event.serviceCharge;
    const extrasByPlayer = this.distributeExtras(participants, subtotalByPlayer, extraAmount);
    const total = subtotal + extraAmount;

    const participantsSummary = participants.map((participant) => {
      const itemSubtotal = subtotalByPlayer.get(participant.playerId) ?? 0;
      const extras = extrasByPlayer.get(participant.playerId) ?? 0;

      return {
        index: participant.index,
        playerId: participant.playerId,
        name: participant.name,
        itemSubtotal,
        extras,
        amountDue: itemSubtotal + extras
      };
    });

    return {
      eventId: event.id,
      title: event.title,
      venue: event.venue ?? undefined,
      status: event.status,
      itemsCount: items.length,
      subtotal,
      tipPercent: event.tipPercent,
      tipAmount,
      serviceCharge: event.serviceCharge,
      total,
      participants: participantsSummary
    };
  }

  private resolveConsumerIds(
    participants: JoinedParticipant[],
    actorPlayerId: string,
    target: ConsumptionTarget
  ): string[] {
    if (target.kind === "ALL") {
      return participants.map((participant) => participant.playerId);
    }

    if (target.kind === "SELF") {
      const isJoined = participants.some((participant) => participant.playerId === actorPlayerId);
      return isJoined ? [actorPlayerId] : [];
    }

    const byIndex = new Map(participants.map((participant) => [participant.index, participant.playerId]));
    const ids = target.indexes
      .map((index) => byIndex.get(index))
      .filter((playerId): playerId is string => Boolean(playerId));

    return [...new Set(ids)];
  }

  private distributeExtras(
    participants: JoinedParticipant[],
    subtotalByPlayer: Map<string, number>,
    extraAmount: number
  ): Map<string, number> {
    const result = new Map<string, number>();
    for (const participant of participants) {
      result.set(participant.playerId, 0);
    }

    if (participants.length === 0 || extraAmount <= 0) {
      return result;
    }

    const totalBase = participants.reduce((sum, participant) => sum + (subtotalByPlayer.get(participant.playerId) ?? 0), 0);
    if (totalBase === 0) {
      const base = Math.floor(extraAmount / participants.length);
      const remainder = extraAmount - base * participants.length;
      for (let idx = 0; idx < participants.length; idx += 1) {
        const participant = participants[idx];
        if (!participant) {
          continue;
        }
        result.set(participant.playerId, base + (idx < remainder ? 1 : 0));
      }
      return result;
    }

    const provisional = participants.map((participant) => {
      const base = subtotalByPlayer.get(participant.playerId) ?? 0;
      const raw = (extraAmount * base) / totalBase;
      const floor = Math.floor(raw);
      return {
        playerId: participant.playerId,
        floor,
        fractional: raw - floor
      };
    });

    const distributed = provisional.reduce((sum, row) => sum + row.floor, 0);
    let remainder = extraAmount - distributed;

    provisional.sort((a, b) => {
      if (b.fractional !== a.fractional) {
        return b.fractional - a.fractional;
      }
      return a.playerId.localeCompare(b.playerId);
    });

    for (let idx = 0; idx < provisional.length; idx += 1) {
      const row = provisional[idx];
      if (!row) {
        continue;
      }
      const bump = remainder > 0 ? 1 : 0;
      result.set(row.playerId, row.floor + bump);
      if (remainder > 0) {
        remainder -= 1;
      }
    }

    return result;
  }
}
