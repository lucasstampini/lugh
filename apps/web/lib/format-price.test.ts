import { describe, expect, it } from "vitest";
import { formatPrice } from "./format-price";

// O Intl separa "R$" do número com espaço não separável.
const normalize = (value: string) => value.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("omite os centavos em valor redondo", () => {
    expect(normalize(formatPrice(10000))).toBe("R$ 100");
  });

  it("mostra os centavos quando existem", () => {
    expect(normalize(formatPrice(10050))).toBe("R$ 100,50");
  });

  it("formata zero e milhar", () => {
    expect(normalize(formatPrice(0))).toBe("R$ 0");
    expect(normalize(formatPrice(123400))).toBe("R$ 1.234");
  });
});
