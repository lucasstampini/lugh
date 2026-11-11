import { describe, expect, it } from "vitest";

import { interviewerFormSchema } from "./schema";

const base = {
  headline: "Engenheira de Software Sênior",
  company: "Fintech de grande porte",
  seniority: "senior",
  areas: ["backend"],
  bio: "",
  linkedin: "linkedin.com/in/fulana",
  github: "",
};

function parsePrice(price: string) {
  return interviewerFormSchema.safeParse({ ...base, price });
}

describe("interviewerFormSchema: preço", () => {
  it.each([
    ["100", 10000],
    ["100,50", 10050],
    ["100.50", 10050],
    ["100,5", 10050],
    ["30", 3000],
    ["500", 50000],
    [" 250 ", 25000],
  ])("aceita %s e salva em centavos", (input, cents) => {
    const result = parsePrice(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(cents);
  });

  it.each(["0", "-10", "abc", "1000", "1.000", "1.234,50", "29,99", "500,01", "1e2", ""])(
    "recusa %s",
    (input) => {
      expect(parsePrice(input).success).toBe(false);
    },
  );
});

describe("interviewerFormSchema: LinkedIn", () => {
  it("é opcional e vira null quando vazio", () => {
    const result = interviewerFormSchema.safeParse({ ...base, price: "100", linkedin: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.linkedin).toBeNull();
  });

  it("completa o https e recusa outro domínio", () => {
    const ok = interviewerFormSchema.safeParse({ ...base, price: "100" });
    expect(ok.success && ok.data.linkedin).toBe("https://linkedin.com/in/fulana");
    expect(
      interviewerFormSchema.safeParse({ ...base, price: "100", linkedin: "google.com" }).success,
    ).toBe(false);
  });
});
