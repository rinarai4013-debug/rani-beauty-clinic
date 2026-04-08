declare class Stripe {
  constructor(apiKey: string);
  webhooks: {
    constructEvent(body: string, signature: string, secret: string): Stripe.Event;
  };
}

declare namespace Stripe {
  interface Event {
    id: string;
    type: string;
    data: {
      object: unknown;
    };
  }

  namespace Checkout {
    interface Session {
      id: string;
      metadata?: Record<string, string> | null;
      customer_details?: {
        name?: string | null;
      } | null;
      amount_total?: number | null;
    }
  }

  interface PaymentIntent {
    id: string;
    last_payment_error?: {
      code?: string;
      message?: string;
    } | null;
  }

  interface Charge {
    id: string;
    amount_refunded?: number | null;
    payment_intent?: string | null;
  }
}

export default Stripe;
