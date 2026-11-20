/**
 * Testes de lib/room/run-code.ts
 *
 * O que cobre: a conversa com o Judge0 para o botão "Executar" da sala: configuração
 * por variável de ambiente, o pedido enviado (linguagem, código em base64, cabeçalhos de
 * autenticação) e a tradução da resposta para o resultado que a sala mostra.
 *
 * Por que importa: a saída aparece para os dois participantes no meio da entrevista.
 * Erro de compilação, exceção, tempo esgotado e falha do serviço precisam virar
 * mensagens claras, e nenhuma falha de rede pode derrubar a rota.
 *
 * Rodar só este arquivo: npx vitest run lib/room/run-code.test.ts
 */
import { describe, expect, it, vi } from "vitest";

import {
  CODE_MAX_LENGTH,
  OUTPUT_MAX_LENGTH,
  parseSubmission,
  readJudge0Config,
  runBodySchema,
  runOnJudge0,
} from "./run-code";

const b64 = (text: string) => Buffer.from(text, "utf8").toString("base64");

function okResponse(body: unknown, status = 201) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("readJudge0Config", () => {
  it("sem chave e sem URL a execução não está configurada", () => {
    expect(readJudge0Config({})).toBeNull();
    expect(readJudge0Config({ JUDGE0_API_KEY: "  ", JUDGE0_URL: "" })).toBeNull();
  });

  it("só com a chave usa o Judge0 do RapidAPI", () => {
    expect(readJudge0Config({ JUDGE0_API_KEY: "chave" })).toEqual({
      url: "https://judge0-ce.p.rapidapi.com",
      apiKey: "chave",
    });
  });

  it("aceita instância própria e tira a barra do fim da URL", () => {
    expect(readJudge0Config({ JUDGE0_URL: "https://judge.exemplo.dev/" })).toEqual({
      url: "https://judge.exemplo.dev",
      apiKey: null,
    });
  });
});

describe("runBodySchema", () => {
  it("aceita linguagem da sala e código", () => {
    expect(runBodySchema.safeParse({ language: "python", code: "print(1)" }).success).toBe(true);
  });

  it("recusa linguagem desconhecida, código vazio e código grande demais", () => {
    expect(runBodySchema.safeParse({ language: "ruby", code: "puts 1" }).success).toBe(false);
    expect(runBodySchema.safeParse({ language: "python", code: "   \n" }).success).toBe(false);
    expect(
      runBodySchema.safeParse({ language: "python", code: "x".repeat(CODE_MAX_LENGTH + 1) }).success,
    ).toBe(false);
  });
});

describe("parseSubmission", () => {
  it("execução aceita devolve a saída e o tempo", () => {
    expect(parseSubmission({ stdout: b64("[0, 1]\n"), stderr: null, time: "0.021", status: { id: 3 } })).toEqual({
      outcome: "success",
      output: "[0, 1]\n",
      errorOutput: "",
      timeSeconds: 0.021,
    });
  });

  it("decodifica acentos da saída", () => {
    expect(parseSubmission({ stdout: b64("olá, sessão"), status: { id: 3 } }).output).toBe("olá, sessão");
  });

  it("erro de compilação traz a mensagem do compilador", () => {
    const result = parseSubmission({ compile_output: b64("Main.java:3: error: ';' expected"), status: { id: 6 } });

    expect(result.outcome).toBe("compile_error");
    expect(result.errorOutput).toContain("';' expected");
  });

  it("exceção mantém o que foi impresso antes e mostra o erro", () => {
    const result = parseSubmission({
      stdout: b64("antes\n"),
      stderr: b64("ZeroDivisionError: division by zero\n"),
      message: b64("Exited with error status 1"),
      status: { id: 11 },
    });

    expect(result.outcome).toBe("runtime_error");
    expect(result.output).toBe("antes\n");
    expect(result.errorOutput).toBe("ZeroDivisionError: division by zero\nExited with error status 1");
  });

  it("tempo esgotado explica o limite mesmo sem mensagem do Judge0", () => {
    const result = parseSubmission({ status: { id: 5 } });

    expect(result.outcome).toBe("timeout");
    expect(result.errorOutput).toContain("limite de 5 segundos");
  });

  it("erro interno do Judge0 vira falha do serviço, não do código", () => {
    expect(parseSubmission({ status: { id: 13 } }).outcome).toBe("failed");
  });

  it("corta saída gigante", () => {
    const result = parseSubmission({ stdout: b64("a".repeat(OUTPUT_MAX_LENGTH * 2)), status: { id: 3 } });

    expect(result.output.length).toBeLessThan(OUTPUT_MAX_LENGTH + 100);
    expect(result.output).toContain("saída cortada");
  });

  it("resposta fora do formato vira falha", () => {
    expect(parseSubmission({ erro: "x" }).outcome).toBe("failed");
    expect(parseSubmission(null).outcome).toBe("failed");
  });
});

describe("runOnJudge0", () => {
  const rapid = { url: "https://judge0-ce.p.rapidapi.com", apiKey: "chave" };

  it("envia linguagem, código em base64 e os cabeçalhos do RapidAPI", async () => {
    const fetchMock = vi.fn(async () => okResponse({ stdout: b64("ok"), status: { id: 3 } }));

    const result = await runOnJudge0(rapid, { language: "python", code: "print('olá')" }, fetchMock);

    expect(result.outcome).toBe("success");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true");
    expect(init.headers).toMatchObject({
      "X-RapidAPI-Key": "chave",
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    });
    const sent = JSON.parse(String(init.body));
    expect(sent.language_id).toBe(71);
    expect(Buffer.from(sent.source_code, "base64").toString("utf8")).toBe("print('olá')");
  });

  it("instância própria usa X-Auth-Token, e sem chave não manda autenticação", async () => {
    const fetchMock = vi.fn(async () => okResponse({ status: { id: 3 } }));

    await runOnJudge0({ url: "https://judge.exemplo.dev", apiKey: "t" }, { language: "java", code: "x" }, fetchMock);
    await runOnJudge0({ url: "https://judge.exemplo.dev", apiKey: null }, { language: "java", code: "x" }, fetchMock);

    const headers = fetchMock.mock.calls.map((call) => (call as unknown as [string, RequestInit])[1].headers);
    expect(headers[0]).toMatchObject({ "X-Auth-Token": "t" });
    expect(headers[1]).not.toHaveProperty("X-Auth-Token");
    expect(headers[1]).not.toHaveProperty("X-RapidAPI-Key");
  });

  it("limite do plano (429) e chave recusada viram mensagens próprias", async () => {
    const limit = await runOnJudge0(rapid, { language: "python", code: "x" }, async () => okResponse({}, 429));
    const denied = await runOnJudge0(rapid, { language: "python", code: "x" }, async () => okResponse({}, 403));

    expect(limit).toMatchObject({ outcome: "failed" });
    expect(limit.errorOutput).toContain("limite de execuções");
    expect(denied.errorOutput).toContain("JUDGE0_API_KEY");
  });

  it("falha de rede não lança: vira resultado de falha", async () => {
    const result = await runOnJudge0(rapid, { language: "python", code: "x" }, async () => {
      throw new TypeError("fetch failed");
    });

    expect(result.outcome).toBe("failed");
  });
});
