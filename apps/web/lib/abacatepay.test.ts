import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AbacatePayError,
  checkPixCharge,
  createPixCharge,
  createSubAccount,
  isSplitUnavailable,
} from "./abacatepay";

const env = { ABACATEPAY_API_KEY: "abc_dev_test" };
const input = { name: "Camila Souza", taxId: "11144477735", profileId: "profile-1" };

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("createSubAccount", () => {
  it("envia nome e documento com a chave no header e devolve o id", async () => {
    const fetchMock = mockFetch(200, {
      data: { id: "sacc_123", name: "Camila Souza" },
      error: null,
      success: true,
    });

    await expect(createSubAccount(input, env)).resolves.toEqual({ id: "sacc_123" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("https://api.abacatepay.com/v2/sub-accounts/create");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer abc_dev_test" });
    expect(JSON.parse(String(init.body))).toEqual({
      name: "Camila Souza",
      taxId: "11144477735",
      metadata: { profileId: "profile-1" },
    });
  });

  it("vira erro quando a API responde 200 com erro de negócio", async () => {
    mockFetch(200, { data: null, error: "CPF ou CNPJ inválido", success: false });

    await expect(createSubAccount(input, env)).rejects.toMatchObject({
      name: "AbacatePayError",
      message: "CPF ou CNPJ inválido",
      status: 200,
    });
  });

  it("vira erro com o status quando a chave é recusada", async () => {
    mockFetch(401, { error: "Token de autenticação inválido ou ausente." });

    await expect(createSubAccount(input, env)).rejects.toMatchObject({ status: 401 });
  });

  it("vira erro quando a resposta não traz um id de subconta", async () => {
    mockFetch(200, { data: { id: "outro_123" }, error: null, success: true });

    await expect(createSubAccount(input, env)).rejects.toBeInstanceOf(AbacatePayError);
  });

  it("vira erro quando a rede falha ou a resposta não é JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    await expect(createSubAccount(input, env)).rejects.toMatchObject({ status: 0 });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>", { status: 502 })),
    );
    await expect(createSubAccount(input, env)).rejects.toMatchObject({ status: 502 });
  });

  it("não chama a API sem a chave configurada", async () => {
    const fetchMock = mockFetch(200, {});

    await expect(createSubAccount(input, {})).rejects.toBeInstanceOf(AbacatePayError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("createPixCharge", () => {
  const charge = {
    id: "pix_char_1",
    status: "PENDING",
    brCode: "000201...",
    brCodeBase64: "data:image/png;base64,AAAA",
    expiresAt: "2026-11-12T12:30:00.000Z",
  };
  const chargeInput = {
    amountCents: 10000,
    description: "Mock interview no Lugh",
    expiresInSeconds: 1800,
    externalId: "session-1",
  };

  it("cria a cobrança PIX com o split da subconta", async () => {
    const fetchMock = mockFetch(200, { data: { ...charge, platformFee: 80 }, success: true });

    await expect(
      createPixCharge({ ...chargeInput, split: { subAccountId: "sacc_1", amountCents: 8000 } }, env),
    ).resolves.toEqual(charge);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("https://api.abacatepay.com/v2/transparents/create");
    expect(JSON.parse(String(init.body))).toEqual({
      method: "PIX",
      data: {
        amount: 10000,
        description: "Mock interview no Lugh",
        expiresIn: 1800,
        externalId: "session-1",
        metadata: { sessionId: "session-1" },
        splits: [{ subAccountId: "sacc_1", amount: 8000 }],
      },
    });
  });

  it("não manda splits quando a cobrança é sem split", async () => {
    const fetchMock = mockFetch(200, { data: charge, success: true });

    await createPixCharge(chargeInput, env);

    const [, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(JSON.parse(String(init.body)).data).not.toHaveProperty("splits");
  });

  it("vira erro quando a resposta vem sem o código do PIX", async () => {
    mockFetch(200, { data: { id: "pix_char_1", status: "PENDING" }, success: true });

    await expect(createPixCharge(chargeInput, env)).rejects.toBeInstanceOf(AbacatePayError);
  });
});

describe("isSplitUnavailable", () => {
  it("reconhece só os erros de split não liberado na loja", () => {
    const error = (message: string) => new AbacatePayError(message, 200);

    expect(isSplitUnavailable(error("Split para subcontas não está habilitado para esta loja"))).toBe(true);
    expect(isSplitUnavailable(error("Split para subcontas não está disponível para esta loja"))).toBe(true);
    expect(isSplitUnavailable(error("A soma dos splits passa do valor líquido da cobrança"))).toBe(false);
    expect(isSplitUnavailable(new Error("Split para subcontas não está habilitado"))).toBe(false);
  });
});

describe("checkPixCharge", () => {
  it("consulta a cobrança pelo id e devolve o status", async () => {
    const fetchMock = mockFetch(200, { data: { id: "pix_char_1", status: "PAID" }, success: true });

    await expect(checkPixCharge("pix_char_1", env)).resolves.toBe("PAID");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("https://api.abacatepay.com/v2/transparents/check?id=pix_char_1");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });
});
