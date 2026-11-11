import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// Só servidor. As duas checagens que a AbacatePay pede antes de processar um webhook
// (https://docs.abacatepay.com/pages/notificacoes/seguranca):
//   1. o secret, que só nós e a AbacatePay conhecemos, prova de onde veio a entrega;
//   2. a assinatura HMAC do corpo cru prova que ele não foi alterado no caminho.

// Chave que a AbacatePay usa para assinar o corpo. É pública e igual para todas as contas
// (está na documentação): não é o nosso secret e sozinha não autentica ninguém.
const ABACATEPAY_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

// Comparação em tempo constante: o tempo de resposta não revela quantos caracteres batem.
function safeEqual(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isWebhookSecretValid(received: string | null, expected: string): boolean {
  return Boolean(received) && Boolean(expected) && safeEqual(received!, expected);
}

export function signWebhookBody(rawBody: string): string {
  return createHmac("sha256", ABACATEPAY_PUBLIC_KEY).update(rawBody).digest("base64");
}

export function isWebhookSignatureValid(rawBody: string, signature: string | null): boolean {
  return Boolean(signature) && safeEqual(signature!, signWebhookBody(rawBody));
}

// Só o que usamos do evento. O schema é frouxo de propósito: a AbacatePay avisa que pode
// acrescentar campos, e um campo novo não pode derrubar o webhook.
const eventSchema = z.object({
  event: z.string(),
  data: z
    .object({
      transparent: z.object({ id: z.string().min(1) }).optional(),
    })
    .optional(),
});

// Id da cobrança quando o evento é um PIX pago (transparent.completed). null para
// qualquer outro evento ou corpo que não dá para ler.
export function paidChargeId(rawBody: string): string | null {
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const parsed = eventSchema.safeParse(json);
  if (!parsed.success || parsed.data.event !== "transparent.completed") return null;
  return parsed.data.data?.transparent?.id ?? null;
}
