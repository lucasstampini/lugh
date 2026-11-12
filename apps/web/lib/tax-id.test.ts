import { describe, expect, it } from "vitest";

import { isValidCnpj, isValidCpf, taxIdSchema } from "./tax-id";

describe("isValidCpf", () => {
  it.each(["111.444.777-35", "11144477735", "529.982.247-25"])("aceita %s", (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it.each([
    "111.444.777-36", // dígito verificador errado
    "111.111.111-11", // todos iguais passam na conta, mas não existem
    "000.000.000-00",
    "1114447773", // 10 dígitos
    "111444777350", // 12 dígitos
    "",
  ])("recusa %j", (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });
});

describe("isValidCnpj", () => {
  it.each(["11.222.333/0001-81", "11222333000181"])("aceita %s", (cnpj) => {
    expect(isValidCnpj(cnpj)).toBe(true);
  });

  it.each(["11.222.333/0001-82", "00.000.000/0000-00", "1122233300018", ""])(
    "recusa %j",
    (cnpj) => {
      expect(isValidCnpj(cnpj)).toBe(false);
    },
  );
});

describe("taxIdSchema", () => {
  it("devolve só os dígitos, com ou sem máscara", () => {
    expect(taxIdSchema.parse(" 111.444.777-35 ")).toBe("11144477735");
    expect(taxIdSchema.parse("11222333000181")).toBe("11222333000181");
  });

  it.each(["", "   ", "abc", "111.444.777-36", "111444777ab", "111.444.777-35x"])(
    "recusa %j",
    (value) => {
      expect(taxIdSchema.safeParse(value).success).toBe(false);
    },
  );

  it("recusa valor que não é texto", () => {
    expect(taxIdSchema.safeParse(null).success).toBe(false);
  });
});
