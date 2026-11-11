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
