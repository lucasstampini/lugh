// Só servidor: usa a chave da Resend. Nunca importar em componente "use client".
// Cliente da API de e-mails (https://resend.com/docs/api-reference/emails/send-email).

const API_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 5_000;

// Remetente de teste da Resend: sem domínio verificado, ela só entrega para o e-mail
// dono da conta. Com domínio próprio, basta definir EMAIL_FROM.
const DEFAULT_FROM = "Lugh <onboarding@resend.dev>";

// Erro devolvido pela Resend (ou falha de rede, com status 0).
export class ResendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ResendError";
  }
}

type Env = Record<string, string | undefined>;

export type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  // Repetir o envio com a mesma chave em até 24h não gera outro e-mail.
  idempotencyKey: string;
  // Envio agendado (até 30 dias à frente). Sem isto, o e-mail sai na hora.
  scheduledAt?: Date;
};

// Envia (ou agenda) um e-mail e devolve o id dele na Resend. Lança ResendError quando a
// chave falta, a rede falha ou a Resend recusa.
export async function sendEmail(input: EmailInput, env: Env = process.env): Promise<{ id: string }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new ResendError("Resend não configurada", 0);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.scheduledAt ? { scheduled_at: input.scheduledAt.toISOString() } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new ResendError("Sem resposta da Resend", 0);
  }

  let body: { id?: unknown; message?: unknown } | null = null;
  try {
    body = (await response.json()) as { id?: unknown; message?: unknown };
  } catch {
    // Corpo vazio ou que não é JSON: cai no erro genérico abaixo.
  }

  if (!response.ok || typeof body?.id !== "string") {
    const message =
      typeof body?.message === "string" && body.message
        ? body.message
        : `Resposta inesperada da Resend (${response.status})`;
    throw new ResendError(message, response.status);
  }

  return { id: body.id };
}
