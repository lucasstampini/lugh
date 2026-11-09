import { z } from "zod";

// Regras da sala que valem no cliente e no servidor. Sem dependências de servidor:
// este arquivo pode ir para o bundle do navegador.

// Fase 1: a única sala que existe é a de teste. Na fase 5 isso vira o id de uma sessão real.
export const TEST_SESSION_ID = "teste";

export const NAME_MAX_LENGTH = 40;

export const participantNameSchema = z
  .string({ error: "Informe seu nome" })
  .trim()
  .min(1, { error: "Informe seu nome" })
  .max(NAME_MAX_LENGTH, { error: `Use no máximo ${NAME_MAX_LENGTH} caracteres` });

// Query de GET /api/livekit/token.
export const tokenQuerySchema = z.object({
  room: z.literal(TEST_SESSION_ID, { error: "Sala inválida" }),
  name: participantNameSchema,
});

export type TokenQuery = z.infer<typeof tokenQuerySchema>;

// Nome da sala no LiveKit e do documento no Hocuspocus seguem o mesmo padrão.
export function roomNameFor(sessionId: string): string {
  return `session-${sessionId}`;
}
