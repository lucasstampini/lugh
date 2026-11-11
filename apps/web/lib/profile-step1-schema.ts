import { z } from "zod";

// Etapa 1 do perfil ("Dados pessoais", Figma node 47:2). Experiência, áreas,
// vaga alvo, LinkedIn e GitHub ficam pra quando as etapas 2 e 3 existirem.
//
// Cidade e estado saíram daqui por enquanto: dependem da migration
// 20261109200000_profile_location.sql, que ainda não foi aplicada no
// projeto Supabase. Volta a incluir depois de rodar a migration.
export const profileStep1Schema = z.object({
  name: z.string().trim().min(1, "Digite seu nome completo.").max(120),
  preferredName: z
    .string()
    .trim()
    .max(60, "Até 60 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  bio: z
    .string()
    .trim()
    .max(300, "Até 300 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
