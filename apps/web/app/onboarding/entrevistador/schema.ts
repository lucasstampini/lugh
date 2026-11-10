import { z } from "zod";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";
import { optionalSocialUrl, requiredSocialUrl } from "@/lib/social-url";

export { AREA_OPTIONS, SENIORITY_OPTIONS };

const areaValues = AREA_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];
const seniorityValues = SENIORITY_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

export const interviewerFormSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(1, "Digite uma headline.")
    .max(80, "Até 80 caracteres."),
  company: z
    .string()
    .trim()
    .min(1, "Digite a empresa.")
    .max(60, "Até 60 caracteres."),
  seniority: z.enum(seniorityValues, {
    message: "Escolha uma senioridade.",
  }),
  areas: z
    .array(z.enum(areaValues))
    .min(1, "Escolha pelo menos uma área."),
  price: z
    .string()
    .trim()
    .min(1, "Digite um preço.")
    .transform((value, ctx) => {
      const normalized = value.replace(/\./g, "").replace(",", ".");
      const amount = Number(normalized);
      if (Number.isNaN(amount)) {
        ctx.addIssue({ code: "custom", message: "Preço inválido." });
        return z.NEVER;
      }
      const cents = Math.round(amount * 100);
      if (cents < 3000 || cents > 50000) {
        ctx.addIssue({
          code: "custom",
          message: "Preço entre R$ 30 e R$ 500.",
        });
        return z.NEVER;
      }
      return cents;
    }),
  bio: z
    .string()
    .trim()
    .max(500, "Até 500 caracteres.")
    .optional()
    .or(z.literal("")),
  linkedin: requiredSocialUrl(
    "linkedin.com",
    "LinkedIn é obrigatório pra quem entrevista.",
    "Precisa ser uma URL do linkedin.com.",
  ),
  github: optionalSocialUrl("github.com", "Precisa ser uma URL do github.com."),
});
