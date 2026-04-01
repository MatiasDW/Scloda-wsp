export interface SplitRestaurantBillInput {
  subtotal: number;
  people: number;
  tipPercent: number;
  serviceCharge: number;
}

export interface SplitRestaurantBillResult {
  subtotal: number;
  people: number;
  tipPercent: number;
  tipAmount: number;
  serviceCharge: number;
  total: number;
  averagePerPerson: number;
  splits: Array<{
    person: number;
    amount: number;
  }>;
}

export class RestaurantBillService {
  splitEvenly(input: SplitRestaurantBillInput): SplitRestaurantBillResult {
    const tipAmount = Math.round((input.subtotal * input.tipPercent) / 100);
    const total = input.subtotal + tipAmount + input.serviceCharge;

    const baseAmount = Math.floor(total / input.people);
    const remainder = total - baseAmount * input.people;

    const splits = Array.from({ length: input.people }, (_, idx) => ({
      person: idx + 1,
      amount: baseAmount + (idx < remainder ? 1 : 0)
    }));

    return {
      subtotal: input.subtotal,
      people: input.people,
      tipPercent: input.tipPercent,
      tipAmount,
      serviceCharge: input.serviceCharge,
      total,
      averagePerPerson: total / input.people,
      splits
    };
  }
}
