/**
 * Faux payment gateway for demo/development.
 * Simulates card processing with deterministic outcomes based on amount.
 *
 * Test amounts:
 *   - Any amount ending in 00 (e.g. 10000 = $100.00) → succeeds
 *   - Amount ending in 99 → fails (declined)
 *   - Amount ending in 50 → pending (timeout simulation)
 */

export interface ChargeRequest {
  amountCents: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ChargeResult {
  success: boolean;
  gatewayRef: string;
  status: "succeeded" | "failed" | "pending";
  message: string;
}

export async function charge(req: ChargeRequest): Promise<ChargeResult> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

  const ref = `faux_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const lastTwo = req.amountCents % 100;

  if (lastTwo === 99) {
    return { success: false, gatewayRef: ref, status: "failed", message: "Card declined" };
  }
  if (lastTwo === 50) {
    return { success: false, gatewayRef: ref, status: "pending", message: "Payment pending — gateway timeout" };
  }

  return { success: true, gatewayRef: ref, status: "succeeded", message: "Payment approved" };
}

export async function refund(gatewayRef: string): Promise<ChargeResult> {
  await new Promise((r) => setTimeout(r, 150));
  return { success: true, gatewayRef, status: "succeeded", message: "Refund processed" };
}
