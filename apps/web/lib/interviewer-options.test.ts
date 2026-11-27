import { describe, expect, it } from "vitest";

import { AREA_OPTIONS, currentAreaSlug } from "./interviewer-options";

describe("currentAreaSlug", () => {
  it("troca os slugs antigos pelos novos", () => {
    expect(currentAreaSlug("backend")).toBe("software_engineer");
    expect(currentAreaSlug("frontend")).toBe("ai_engineer");
  });

  it("os slugs antigos apontam para áreas que existem", () => {
    const values: readonly string[] = AREA_OPTIONS.map((option) => option.value);

    expect(values).toContain(currentAreaSlug("backend"));
    expect(values).toContain(currentAreaSlug("frontend"));
  });

  it("devolve o que não é slug antigo como veio", () => {
    expect(currentAreaSlug("mobile")).toBe("mobile");
    expect(currentAreaSlug("qualquer")).toBe("qualquer");
  });
});
