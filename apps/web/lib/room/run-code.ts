import { z } from "zod";

import { languageSchema, type LanguageId } from "./languages";

// Execução do código do editor (botão "Executar" da sala), pelo Judge0.
//
// A chave do Judge0 só existe no servidor: o navegador chama POST /api/code/run, a rota
// confere se quem pede é participante da sessão e repassa o código. O resultado volta
// num formato próprio (RunResult), para a tela não depender dos campos do Judge0.

// Limite do código enviado: uma resposta de entrevista não chega perto disso.
export const CODE_MAX_LENGTH = 20_000;
// Saída maior que isso é cortada: um laço imprimindo sem parar não pode inchar o
// documento compartilhado da sala.
export const OUTPUT_MAX_LENGTH = 8_000;
const REQUEST_TIMEOUT_MS = 20_000;
// Limites de execução pedidos ao Judge0, em segundos.
const CPU_TIME_LIMIT = 5;
const WALL_TIME_LIMIT = 10;

// Ids do Judge0 CE para as linguagens da sala (GET /languages da instância lista todos).
export const JUDGE0_LANGUAGE_IDS: Record<LanguageId, number> = {
  javascript: 63, // JavaScript (Node.js)
  python: 71, // Python 3
  java: 62, // Java (OpenJDK). A classe com o main precisa se chamar Main.
};

export const runBodySchema = z.object({
  language: languageSchema,
  code: z
    .string({ error: "Código inválido" })
    .max(CODE_MAX_LENGTH, { error: `O código passa de ${CODE_MAX_LENGTH} caracteres.` })
    .refine((value) => value.trim().length > 0, { error: "Escreva algum código antes de executar." }),
});

// Intervalo mínimo entre duas execuções da mesma sessão. O botão já trava o clique duplo,
// mas a rota pode ser chamada direto: sem isto um script gasta a cota do Judge0 de todos.
export const RUN_MIN_INTERVAL_MS = 2_000;

// shortcut: a memória é de cada instância do servidor, então com várias instâncias o
// limite real é 1 execução por intervalo por instância. Basta para segurar um laço; se a
// cota virar problema de verdade, o contador vai para o banco.
const lastRunBySession = new Map<string, number>();

// true quando a sessão pode executar agora (e já registra a execução).
export function takeRunSlot(sessionId: string, now: number = Date.now()): boolean {
  const last = lastRunBySession.get(sessionId);
  if (last !== undefined && now - last < RUN_MIN_INTERVAL_MS) return false;

  // Não deixa o mapa crescer para sempre: entradas vencidas saem quando ele enche.
  if (lastRunBySession.size >= 1000) {
    for (const [id, at] of lastRunBySession) {
      if (now - at >= RUN_MIN_INTERVAL_MS) lastRunBySession.delete(id);
    }
  }
  lastRunBySession.set(sessionId, now);
  return true;
}

export const RUN_OUTCOMES =["success", "compile_error", "runtime_error", "timeout", "failed"] as const;
export type RunOutcome = (typeof RUN_OUTCOMES)[number];

// O que a sala mostra de uma execução. `failed` é falha nossa ou do Judge0 (não do código).
export const runResultSchema = z.object({
  outcome: z.enum(RUN_OUTCOMES),
  // O que o programa imprimiu.
  output: z.string().max(OUTPUT_MAX_LENGTH + 100),
  // Erro de compilação, exceção ou a mensagem de falha.
  errorOutput: z.string().max(OUTPUT_MAX_LENGTH + 100),
  timeSeconds: z.number().nullable(),
});
export type RunResult = z.infer<typeof runResultSchema>;

export const RUN_OUTCOME_LABELS: Record<RunOutcome, string> = {
  success: "executou",
  compile_error: "erro de compilação",
  runtime_error: "erro na execução",
  timeout: "tempo esgotado",
  failed: "não executou",
};

export type Judge0Config = { url: string; apiKey: string | null };

const DEFAULT_JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";

// null quando a execução não está configurada (sem JUDGE0_API_KEY e sem JUDGE0_URL própria).
export function readJudge0Config(env: Record<string, string | undefined> = process.env): Judge0Config | null {
  const url = env.JUDGE0_URL?.trim().replace(/\/+$/, "") || null;
  const apiKey = env.JUDGE0_API_KEY?.trim() || null;
  if (!url && !apiKey) return null;
  return { url: url ?? DEFAULT_JUDGE0_URL, apiKey };
}

function judge0Headers(config: Judge0Config): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!config.apiKey) return headers;

  const host = new URL(config.url).host;
  if (host.endsWith("rapidapi.com")) {
    headers["X-RapidAPI-Key"] = config.apiKey;
    headers["X-RapidAPI-Host"] = host;
  } else {
    // Instância própria do Judge0 com autenticação ligada.
    headers["X-Auth-Token"] = config.apiKey;
  }
  return headers;
}

function toBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

function fromBase64(value: unknown): string {
  return typeof value === "string" ? Buffer.from(value, "base64").toString("utf8") : "";
}

function clip(text: string): string {
  return text.length > OUTPUT_MAX_LENGTH
    ? `${text.slice(0, OUTPUT_MAX_LENGTH)}\n… saída cortada em ${OUTPUT_MAX_LENGTH} caracteres`
    : text;
}

function failed(message: string): RunResult {
  return { outcome: "failed", output: "", errorOutput: message, timeSeconds: null };
}

const submissionSchema = z.object({
  stdout: z.string().nullish(),
  stderr: z.string().nullish(),
  compile_output: z.string().nullish(),
  message: z.string().nullish(),
  time: z.union([z.string(), z.number()]).nullish(),
  status: z.object({ id: z.number() }),
});

// Status do Judge0: 3 aceito, 5 tempo esgotado, 6 erro de compilação, 7 a 12 erros de
// execução. 1 e 2 (fila, processando) não chegam aqui porque pedimos wait=true. 13 e 14
// são falhas do próprio Judge0.
function outcomeFor(statusId: number): RunOutcome {
  if (statusId === 3 || statusId === 4) return "success";
  if (statusId === 5) return "timeout";
  if (statusId === 6) return "compile_error";
  if (statusId >= 7 && statusId <= 12) return "runtime_error";
  return "failed";
}

// Lê a resposta do Judge0 (campos em base64) e devolve o resultado no formato da sala.
export function parseSubmission(body: unknown): RunResult {
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return failed("O serviço de execução respondeu num formato inesperado.");
  }
  const submission = parsed.data;
  const outcome = outcomeFor(submission.status.id);
  const time = submission.time == null ? Number.NaN : Number(submission.time);

  const errorParts = [fromBase64(submission.compile_output), fromBase64(submission.stderr)];
  // `message` traz o motivo quando o Judge0 interrompe o programa (ex.: sinal recebido).
  if (outcome !== "success") errorParts.push(fromBase64(submission.message));
  let errorOutput = errorParts.map((part) => part.trimEnd()).filter(Boolean).join("\n");
  if (outcome === "timeout" && !errorOutput) {
    errorOutput = `O programa passou do limite de ${CPU_TIME_LIMIT} segundos.`;
  }
  if (outcome === "failed" && !errorOutput) {
    errorOutput = "O serviço de execução falhou. Tente de novo.";
  }

  return {
    outcome,
    output: clip(fromBase64(submission.stdout)),
    errorOutput: clip(errorOutput),
    timeSeconds: Number.isFinite(time) ? time : null,
  };
}

// Envia o código ao Judge0 e espera o resultado. Nunca lança: qualquer falha vira um
// RunResult `failed` com uma mensagem que dá para mostrar na sala.
export async function runOnJudge0(
  config: Judge0Config,
  input: { language: LanguageId; code: string },
  fetchImpl: typeof fetch = fetch,
): Promise<RunResult> {
  let response: Response;
  try {
    response = await fetchImpl(`${config.url}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: judge0Headers(config),
      body: JSON.stringify({
        language_id: JUDGE0_LANGUAGE_IDS[input.language],
        source_code: toBase64(input.code),
        cpu_time_limit: CPU_TIME_LIMIT,
        wall_time_limit: WALL_TIME_LIMIT,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return failed("Não deu para falar com o serviço de execução. Tente de novo em alguns segundos.");
  }

  if (response.status === 429) {
    return failed("O limite de execuções de hoje acabou. Tente de novo mais tarde.");
  }
  if (response.status === 401 || response.status === 403) {
    return failed("A chave do serviço de execução foi recusada (JUDGE0_API_KEY).");
  }
  if (!response.ok) {
    return failed("O serviço de execução falhou. Tente de novo em alguns segundos.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return failed("O serviço de execução respondeu num formato inesperado.");
  }
  return parseSubmission(body);
}
