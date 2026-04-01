import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { RestaurantBillService } from "./restaurant-bill.service.js";

const splitRestaurantBillSchema = z.object({
  subtotal: z.number().int().positive(),
  people: z.number().int().min(1).max(30),
  tipPercent: z.number().min(0).max(100).default(10),
  serviceCharge: z.number().int().min(0).default(0)
});

export class RestaurantBillController {
  constructor(private readonly restaurantBillService: RestaurantBillService) {}

  split = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = splitRestaurantBillSchema.parse(request.body);
      const split = this.restaurantBillService.splitEvenly(body);

      reply.send({ ok: true, split });
    } catch {
      reply.code(400).send({ ok: false, message: "invalid_request" });
    }
  };
}
