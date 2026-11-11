import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("aceita caminho interno, com query", () => {
    expect(safeNextPath("/painel")).toBe("/painel");
    expect(safeNextPath("/entrevistadores?area=backend")).toBe(
      "/entrevistadores?area=backend",
    );
  });

  it("recusa URL externa e protocolo relativo", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("evil.example")).toBe("/");
  });

  it("usa o fallback quando não há next", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined, "/entrevistadores")).toBe("/entrevistadores");
    expect(safeNextPath("", "/entrevistadores")).toBe("/entrevistadores");
  });
});
