import { afterEach, describe, expect, it, vi } from "vitest";

import { AbacatePayError, createSubAccount } from "./abacatepay";

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
