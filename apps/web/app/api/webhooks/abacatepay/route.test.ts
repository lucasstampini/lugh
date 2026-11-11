/**
 * Testes de POST /api/webhooks/abacatepay
 *
 * O que cobre: a validação do secret e da assinatura, quais eventos confirmam uma sessão
 * e o código de resposta em cada caso, chamando o handler direto. A AbacatePay e a
 * confirmação no banco são simuladas; a assinatura é calculada de verdade.
 *
 * Por que importa: a rota é pública e confirma pagamento. Um corpo forjado não pode
 * liberar uma sessão sem PIX, e o mesmo evento duas vezes não pode ter efeito em dobro.
 * O código de resposta decide se a AbacatePay reenvia: 5xx reenvia, 401 e 2xx não.
 *
 * Rodar só este arquivo: npx vitest run app/api/webhooks/abacatepay/route.test.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AbacatePayError } from "@/lib/abacatepay";
import { signWebhookBody } from "@/lib/abacatepay-webhook";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  checkPixCharge: vi.fn(),
  confirmPayment: vi.fn(),
}));

vi.mock("@/lib/abacatepay", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/abacatepay")>()),
  checkPixCharge: mocks.checkPixCharge,
}));

vi.mock("@/lib/payments", () => ({ confirmPayment: mocks.confirmPayment }));

const SECRET = "segredo-do-webhook-com-mais-de-32-caracteres";

function event(name = "transparent.completed") {
  return JSON.stringify({
    id: "log_1",
    event: name,
    apiVersion: 2,
    devMode: true,
    data: { transparent: { id: "pix_char_1", amount: 10000, status: "PAID" } },
  });
}

function deliver(
  body: string,
  {
    secret = SECRET,
    signature = signWebhookBody(body),
    secretInQuery = false,
  }: { secret?: string | null; signature?: string | null; secretInQuery?: boolean } = {},
) {
  const headers = new Headers();
  if (secret && !secretInQuery) headers.set("X-Webhook-Secret", secret);
  if (signature) headers.set("X-Webhook-Signature", signature);
  const query = secret && secretInQuery ? `?webhookSecret=${secret}` : "";

  return POST(
    new Request(`https://lugh.test/api/webhooks/abacatepay${query}`, {
      method: "POST",
      headers,
      body,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ABACATEPAY_WEBHOOK_SECRET", SECRET);
  mocks.checkPixCharge.mockResolvedValue("PAID");
  mocks.confirmPayment.mockResolvedValue("confirmed");
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/webhooks/abacatepay", () => {
  it("confirma o pagamento de um PIX pago", async () => {
    const response = await deliver(event());

    expect(response.status).toBe(200);
    expect(mocks.checkPixCharge).toHaveBeenCalledWith("pix_char_1");
    expect(mocks.confirmPayment).toHaveBeenCalledWith("pix_char_1");
  });

  it("aceita o secret pela query quando o header não vem", async () => {
    const response = await deliver(event(), { secretInQuery: true });

    expect(response.status).toBe(200);
    expect(mocks.confirmPayment).toHaveBeenCalled();
  });

  it("responde 200 de novo quando o mesmo evento é reenviado", async () => {
    await deliver(event());
    const again = await deliver(event());

    expect(again.status).toBe(200);
  });

  it.each([
    ["secret errado", { secret: "outro-segredo-qualquer-com-o-mesmo-tamanho!!" }],
    ["sem secret", { secret: null }],
    ["assinatura errada", { signature: signWebhookBody("outro corpo") }],
    ["sem assinatura", { signature: null }],
  ])("recusa com 401 e não processa: %s", async (_name, options) => {
    const response = await deliver(event(), options);

    expect(response.status).toBe(401);
    expect(mocks.checkPixCharge).not.toHaveBeenCalled();
    expect(mocks.confirmPayment).not.toHaveBeenCalled();
  });

  it("recusa corpo alterado depois de assinado", async () => {
    const signature = signWebhookBody(event());
    const tampered = event().replace("pix_char_1", "pix_char_2");

    const response = await deliver(tampered, { signature });

    expect(response.status).toBe(401);
    expect(mocks.confirmPayment).not.toHaveBeenCalled();
  });

  it("responde 503 sem processar quando o secret não está configurado", async () => {
    vi.stubEnv("ABACATEPAY_WEBHOOK_SECRET", "");

    const response = await deliver(event(), { secret: "" });

    expect(response.status).toBe(503);
    expect(mocks.confirmPayment).not.toHaveBeenCalled();
  });

  it.each(["transparent.refunded", "transparent.disputed", "checkout.completed"])(
    "recebe e ignora o evento %s",
    async (name) => {
      const response = await deliver(event(name));

      expect(response.status).toBe(200);
      expect(mocks.confirmPayment).not.toHaveBeenCalled();
    },
  );

  it.each(["não é json", "{}", JSON.stringify({ event: "transparent.completed", data: {} })])(
    "recebe e ignora corpo sem cobrança: %s",
    async (body) => {
      const response = await deliver(body);

      expect(response.status).toBe(200);
      expect(mocks.confirmPayment).not.toHaveBeenCalled();
    },
  );

  it("não confirma quando a AbacatePay diz que a cobrança não está paga", async () => {
    mocks.checkPixCharge.mockResolvedValue("PENDING");

    const response = await deliver(event());

    expect(response.status).toBe(200);
    expect(mocks.confirmPayment).not.toHaveBeenCalled();
  });

  it("pede reenvio (503) quando não dá para conferir a cobrança", async () => {
    mocks.checkPixCharge.mockRejectedValue(new AbacatePayError("Sem resposta da AbacatePay", 0));

    const response = await deliver(event());

    expect(response.status).toBe(503);
    expect(mocks.confirmPayment).not.toHaveBeenCalled();
  });

  it("ignora sem pedir reenvio a cobrança que a AbacatePay não reconhece", async () => {
    mocks.checkPixCharge.mockRejectedValue(new AbacatePayError("Pix QR Code not found", 200));

    const response = await deliver(event());

    expect(response.status).toBe(200);
    expect(mocks.confirmPayment).not.toHaveBeenCalled();
  });

  it("pede reenvio (500) quando o banco falha ao confirmar", async () => {
    mocks.confirmPayment.mockRejectedValue(new Error("timeout"));

    const response = await deliver(event());

    expect(response.status).toBe(500);
  });
});
