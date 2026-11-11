import { z } from "zod";
import { AREA_OPTIONS } from "@/lib/interviewer-options";
import { optionalSocialUrl } from "@/lib/social-url";

const areaValues = AREA_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

export const candidateProfileSchema = z.object({
  name: z.string().trim().min(1, "Digite seu nome.").max(120),
  preferredName: z
    .string()
    .trim()
    .max(60, "Até 60 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  experienceYears: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine(
      (value) =>
        value === null || (Number.isInteger(value) && value >= 0 && value <= 60),
      { message: "Experiência entre 0 e 60 anos." },
    ),
  areas: z.array(z.enum(areaValues)),
  targetRole: z
    .string()
    .trim()
    .max(80, "Até 80 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  bio: z
    .string()
    .trim()
    .max(500, "Até 500 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  linkedin: optionalSocialUrl("linkedin.com", "Precisa ser uma URL do linkedin.com."),
  github: optionalSocialUrl("github.com", "Precisa ser uma URL do github.com."),
});
