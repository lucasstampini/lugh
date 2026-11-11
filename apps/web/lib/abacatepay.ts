// Só servidor: usa a chave da AbacatePay. Nunca importar em componente "use client".
// Cliente da API v2 (https://docs.abacatepay.com). A mesma URL atende produção e modo
// teste: quem decide o ambiente é a chave.

const API_URL = "https://api.abacatepay.com/v2";
const TIMEOUT_MS = 10_000;

// Erro devolvido pela AbacatePay (ou falha de rede, com status 0). A mensagem é a da
// API, em português, e serve para decidir o que dizer ao usuário. Nunca mostrar crua.
export class AbacatePayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AbacatePayError";
  }
}

type Env = Record<string, string | undefined>;

type Envelope<T> = { data?: T | null; error?: unknown; success?: boolean };

type RequestOptions = {
  method: "GET" | "POST";
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  env?: Env;
};

async function request<T>({ method, path, query, body, env = process.env }: RequestOptions): Promise<T> {
  const apiKey = env.ABACATEPAY_API_KEY;
  if (!apiKey) throw new AbacatePayError("AbacatePay não configurada", 0);

  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new AbacatePayError("Sem resposta da AbacatePay", 0);
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    // Corpo vazio ou que não é JSON: cai no erro genérico abaixo.
  }

  // Erro de negócio chega com HTTP 200 e success = false: os dois sinais contam.
  const failed = !response.ok || !envelope || envelope.success === false || !envelope.data;
  if (failed) {
    const message =
      typeof envelope?.error === "string" && envelope.error
        ? envelope.error
        : `Resposta inesperada da AbacatePay (${response.status})`;
    throw new AbacatePayError(message, response.status);
  }

  return envelope!.data as T;
}

export type SubAccount = { id: string };

// Cria a subconta de quem vai receber o split. Repetir com o mesmo CPF ou CNPJ devolve
// a subconta que já existe, então a chamada é segura para reenvio.
export async function createSubAccount(
  input: { name: string; taxId: string; profileId: string },
  env?: Env,
): Promise<SubAccount> {
  const data = await request<{ id?: unknown }>({
    method: "POST",
    path: "/sub-accounts/create",
    body: {
      name: input.name,
      taxId: input.taxId,
      metadata: { profileId: input.profileId },
    },
    env,
  });

  if (typeof data.id !== "string" || !data.id.startsWith("sacc_")) {
    throw new AbacatePayError("Subconta sem id na resposta da AbacatePay", 200);
  }
  return { id: data.id };
}

export type PixCharge = {
  id: string;
  status: string;
  // PIX copia e cola.
  brCode: string;
  // QR code em PNG, já como data URI ("data:image/png;base64,...").
  brCodeBase64: string;
  expiresAt: string;
};

export type PixChargeInput = {
  amountCents: number;
  description: string;
  // Validade em segundos. A AbacatePay recusa menos de 300.
  expiresInSeconds: number;
  // Id da sessão: identifica a cobrança no nosso lado e serve de idempotência.
  externalId: string;
  // Parte que vai para a subconta do entrevistador. Sem split, o valor fica com o Lugh.
  split?: { subAccountId: string; amountCents: number };
};

// Cria a cobrança PIX do checkout transparente (QR code na nossa tela).
export async function createPixCharge(input: PixChargeInput, env?: Env): Promise<PixCharge> {
  const data = await request<Record<string, unknown>>({
    method: "POST",
    path: "/transparents/create",
    body: {
      method: "PIX",
      data: {
        amount: input.amountCents,
        description: input.description,
        expiresIn: input.expiresInSeconds,
        externalId: input.externalId,
        metadata: { sessionId: input.externalId },
        ...(input.split
          ? { splits: [{ subAccountId: input.split.subAccountId, amount: input.split.amountCents }] }
          : {}),
      },
    },
    env,
  });

  const { id, status, brCode, brCodeBase64, expiresAt } = data;
  if (
    typeof id !== "string" ||
    typeof status !== "string" ||
    typeof brCode !== "string" ||
    typeof brCodeBase64 !== "string" ||
    typeof expiresAt !== "string"
  ) {
    throw new AbacatePayError("Cobrança incompleta na resposta da AbacatePay", 200);
  }
  return { id, status, brCode, brCodeBase64, expiresAt };
}

// A loja não tem split liberado (a liberação é feita conta a conta pelo suporte da
// AbacatePay). Quem chama decide se cobra sem split.
export function isSplitUnavailable(error: unknown): boolean {
  return (
    error instanceof AbacatePayError &&
    /Split para subcontas não está (habilitado|disponível)/.test(error.message)
  );
}

// Consulta o status atual de uma cobrança PIX direto na AbacatePay. PIX pago vem "PAID";
// os outros valores (PENDING, EXPIRED, CANCELLED, REFUNDED...) não confirmam nada.
export async function checkPixCharge(chargeId: string, env?: Env): Promise<string> {
  const data = await request<{ status?: unknown }>({
    method: "GET",
    path: "/transparents/check",
    query: { id: chargeId },
    env,
  });

  if (typeof data.status !== "string") {
    throw new AbacatePayError("Cobrança sem status na resposta da AbacatePay", 200);
  }
  return data.status;
}

// Chave do Modo Teste da AbacatePay. Nele não existe saque: as cobranças e o split
// funcionam, mas o dinheiro da subconta não sai.
export function isTestMode(env: Env = process.env): boolean {
  return (env.ABACATEPAY_API_KEY ?? "").startsWith("abc_dev_");
}

// Saca da subconta por PIX para a chave do CPF ou CNPJ do titular (não há como escolher
// outra chave). A taxa do saque sai do próprio valor. externalId é a idempotência:
// repetir com o mesmo id e o mesmo valor devolve o saque que já existe, sem outro PIX.
// Devolve o status do saque: "COMPLETE" quando o PIX saiu.
export async function withdrawFromSubAccount(
  input: { subAccountId: string; amountCents: number; externalId: string; description: string },
  env?: Env,
): Promise<string> {
  const data = await request<{ status?: unknown }>({
    method: "POST",
    path: "/sub-accounts/withdraw",
    body: {
      id: input.subAccountId,
      amount: input.amountCents,
      externalId: input.externalId,
      description: input.description,
    },
    env,
  });

  if (typeof data.status !== "string") {
    throw new AbacatePayError("Saque sem status na resposta da AbacatePay", 200);
  }
  return data.status;
}
