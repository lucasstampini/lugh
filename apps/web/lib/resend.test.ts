/**
 * Testes de lib/resend.ts
 *
 * O que cobre: a chamada à API de e-mails da Resend (URL, chave, remetente, chave de
 * idempotência, envio agendado) e a tradução das falhas em ResendError. A rede é simulada.
 *
 * Por que importa: quem chama trata todo erro como "o e-mail não saiu, segue o fluxo".
 * Para isso valer, toda falha (chave ausente, rede, recusa) precisa virar ResendError.
 *
 * Rodar só este arquivo: npx vitest run lib/resend.test.ts
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResendError, sendEmail } from "./resend";

const env = { RESEND_API_KEY: "re_test" };
const input = {
  to: "pedro@exemplo.com",
  subject: "Sessão confirmada",
  html: "<p>Olá</p>",
  text: "Olá",
  idempotencyKey: "confirmacao-sessao-1-candidato",
};

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentRequest(fetchMock: ReturnType<typeof mockFetch>) {
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return { url, init, body: JSON.parse(String(init.body)) as Record<string, unknown> };
}

afterEach(() => vi.unstubAllGlobals());

describe("sendEmail", () => {
  it("envia com a chave, a idempotência e o remetente padrão, e devolve o id", async () => {
    const fetchMock = mockFetch(200, { id: "email-1" });

    await expect(sendEmail(input, env)).resolves.toEqual({ id: "email-1" });

    const { url, init, body } = sentRequest(fetchMock);
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer re_test",
      "Idempotency-Key": "confirmacao-sessao-1-candidato",
    });
    expect(body).toEqual({
      from: "Lugh <onboarding@resend.dev>",
      to: "pedro@exemplo.com",
      subject: "Sessão confirmada",
      html: "<p>Olá</p>",
      text: "Olá",
    });
  });

  it("usa o remetente de EMAIL_FROM quando definido", async () => {
    const fetchMock = mockFetch(200, { id: "email-1" });

    await sendEmail(input, { ...env, EMAIL_FROM: "Lugh <sessoes@lugh.example>" });

    expect(sentRequest(fetchMock).body.from).toBe("Lugh <sessoes@lugh.example>");
  });

  it("manda scheduled_at em ISO quando o envio é agendado", async () => {
    const fetchMock = mockFetch(200, { id: "email-1" });

    await sendEmail({ ...input, scheduledAt: new Date("2026-11-18T21:00:00.000Z") }, env);

    expect(sentRequest(fetchMock).body.scheduled_at).toBe("2026-11-18T21:00:00.000Z");
  });

  it("falha sem chamar a rede quando a chave não está configurada", async () => {
    const fetchMock = mockFetch(200, { id: "email-1" });

    await expect(sendEmail(input, {})).rejects.toBeInstanceOf(ResendError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve a mensagem e o status da Resend quando ela recusa", async () => {
    mockFetch(403, {
      statusCode: 403,
      name: "validation_error",
      message: "You can only send testing emails to your own email address",
    });

    await expect(sendEmail(input, env)).rejects.toMatchObject({
      name: "ResendError",
      status: 403,
      message: "You can only send testing emails to your own email address",
    });
  });

  it("trata resposta sem id como erro", async () => {
    mockFetch(200, {});

    await expect(sendEmail(input, env)).rejects.toMatchObject({ name: "ResendError", status: 200 });
  });

  it("trata falha de rede ou timeout como erro com status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("timeout");
      }),
    );

    await expect(sendEmail(input, env)).rejects.toMatchObject({ name: "ResendError", status: 0 });
  });
});
