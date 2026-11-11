import { describe, expect, it } from "vitest";

import { initials } from "./initials";

describe("initials", () => {
  it("usa o primeiro e o último nome", () => {
    expect(initials("Mariana Albuquerque")).toBe("MA");
    expect(initials("Ana Clara de Souza")).toBe("AS");
  });

  it("aceita um nome só e acentos", () => {
    expect(initials("ana")).toBe("A");
    expect(initials("  Érica   Ávila ")).toBe("ÉÁ");
  });

  it("devolve ? para nome vazio", () => {
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});
