import { AbacatePayError, checkPixCharge } from "@/lib/abacatepay";
import {
  isWebhookSecretValid,
  isWebhookSignatureValid,
  paidChargeId,
} from "@/lib/abacatepay-webhook";
import { confirmPayment } from "@/lib/payments";

// POST /api/webhooks/abacatepay
// A AbacatePay avisa que um PIX foi pago (transparent.completed): o pagamento vira paid e
// a sessão, scheduled. Sem login: quem prova a origem é o secret, e a assinatura prova
// que o corpo não foi alterado.
//
// O que cada resposta faz do lado deles: 2xx encerra a entrega, 401 não é reenviado e
// 5xx é reenviado (até 7 tentativas em ~18h). Por isso falha nossa responde 5xx e evento
// que não nos interessa responde 200.
export async function POST(request: Request) {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook não configurado" }, { status: 503 });
  }

  // O corpo cru, antes de qualquer parse: é sobre ele que a assinatura é calculada.
  const rawBody = await request.text();

  // O secret chega no header e também na query (webhookSecret). O header não aparece em
  // log de URL, então é o preferido.
  const receivedSecret =
    request.headers.get("x-webhook-secret") ??
    new URL(request.url).searchParams.get("webhookSecret");

  if (!isWebhookSecretValid(receivedSecret, secret)) {
    return Response.json({ error: "Secret inválido" }, { status: 401 });
  }
  if (!isWebhookSignatureValid(rawBody, request.headers.get("x-webhook-signature"))) {
    return Response.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const chargeId = paidChargeId(rawBody);
  if (!chargeId) {
    // Estorno, contestação, outro produto: ainda não tratamos. Recebido e ignorado.
    return Response.json({ received: true });
  }

  // Não confia só no corpo: confere na AbacatePay, com a nossa chave, que essa cobrança
  // existe e está paga antes de confirmar a sessão.
  let chargeStatus: string;
  try {
    chargeStatus = await checkPixCharge(chargeId);
  } catch (error) {
    // Rede ou AbacatePay fora do ar: pede o reenvio. Cobrança que a API diz não existir
    // (de outro ambiente, por exemplo) não melhora com reenvio.
    const retryable = !(error instanceof AbacatePayError) || error.status === 0 || error.status >= 500;
    return retryable
      ? Response.json({ error: "Não deu para conferir a cobrança" }, { status: 503 })
      : Response.json({ received: true });
  }
  if (chargeStatus !== "PAID") {
    return Response.json({ received: true });
  }

  try {
    // Idempotente: o mesmo evento duas vezes (reenvio automático ou manual) não muda nada.
    // Cobrança que não é de nenhuma sessão nossa também só é ignorada.
    await confirmPayment(chargeId);
  } catch {
    return Response.json({ error: "Não deu para confirmar o pagamento" }, { status: 500 });
  }

  return Response.json({ received: true });
}
