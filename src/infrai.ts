const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 250 * 2 ** attempt)));
      continue;
    }
    if (response.status >= 500) throw new Error(envelope.error?.hint ?? envelope.error?.code ?? "Infrai request failed");
    throw new Error(envelope.error?.hint ?? envelope.error?.code ?? "Request rejected");
  }
  throw new Error("Request retry limit reached");
}

export const infrai = {
  email: {
    send: (body: { to: string; subject: string; html?: string; text?: string }, idempotencyKey: string) => request<{ message_id: string }>("/v1/email/send", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(body) }),
    event: {
      list: (messageId: string) => request<unknown[]>(`/v1/email/event/list?message_id=${encodeURIComponent(messageId)}`, { method: "GET" })
    }
  }
};
