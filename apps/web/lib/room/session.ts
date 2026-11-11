import { z } from "zod";

// Regras da sala que valem no cliente e no servidor. Sem dependências de servidor:
// este arquivo pode ir para o bundle do navegador.

// Sala de teste: sem login e sem sessão no banco, para desenvolver e para os E2E.
// As salas de verdade usam o id (uuid) de uma sessão agendada.
export const TEST_SESSION_ID = "teste";

// A sala de teste não existe em produção (nem no preview da Vercel): lá toda sala
// exige login e participação na sessão.
export function isTestRoomEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const NAME_MAX_LENGTH = 40;

export const participantNameSchema = z
  .string({ error: "Informe seu nome" })
  .trim()
  .min(1, { error: "Informe seu nome" })
  .max(NAME_MAX_LENGTH, { error: `Use no máximo ${NAME_MAX_LENGTH} caracteres` });

// Body de POST /api/livekit/token e POST /api/collab/token. O nome só vale na sala de
// teste: numa sessão real ele vem do perfil, nunca do que o navegador manda.
export const tokenBodySchema = z.object({
  sessionId: z
    .string({ error: "Sala inválida" })
    .refine((value) => value === TEST_SESSION_ID || UUID_RE.test(value), { error: "Sala inválida" }),
  name: participantNameSchema.optional(),
});

export type TokenBody = z.infer<typeof tokenBodySchema>;

export type SessionType = "coding" | "system_design" | "behavioral";

// Rótulo mono do tipo da entrevista (cabeçalho da sala).
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  coding: "código ao vivo",
  system_design: "system design",
  behavioral: "comportamental",
};

export type SessionRole = "candidate" | "interviewer";

// O que a sala precisa saber de uma sessão real. Vem de getSessionForUser (lib/sessions.ts).
export type RoomSession = {
  id: string;
  type: SessionType;
  role: SessionRole;
  userName: string;
  otherParticipantName: string;
  startsAt: string;
  endsAt: string;
};

// Nome da sala no LiveKit e do documento no Hocuspocus seguem o mesmo padrão.
export function roomNameFor(sessionId: string): string {
  return `session-${sessionId}`;
}

// A sala abre um pouco antes do horário e fecha quando a sessão termina.
export const ROOM_OPENS_BEFORE_MINUTES = 10;

export type RoomAccess = "early" | "open" | "ended";

export function roomAccess(startsAt: string, endsAt: string, now: Date = new Date()): RoomAccess {
  const current = now.getTime();
  if (current < new Date(startsAt).getTime() - ROOM_OPENS_BEFORE_MINUTES * 60 * 1000) {
    return "early";
  }
  return current < new Date(endsAt).getTime() ? "open" : "ended";
}

// Dá para entrar na sala? Junta o status da sessão com a janela de horário.
// "unavailable": a sessão não chegou a valer (sem pagamento, expirada, cancelada, falta).
export type RoomEntry = RoomAccess | "unavailable";

const ENTERABLE_STATUSES = new Set(["scheduled", "in_progress"]);
const FINISHED_STATUSES = new Set(["awaiting_feedback", "completed"]);

export function roomEntry(
  status: string,
  startsAt: string,
  endsAt: string,
  now: Date = new Date(),
): RoomEntry {
  if (FINISHED_STATUSES.has(status)) return "ended";
  if (!ENTERABLE_STATUSES.has(status)) return "unavailable";
  return roomAccess(startsAt, endsAt, now);
}

// Mensagem para quem tenta entrar fora de hora (telas da sala e rotas de token).
export const ROOM_ENTRY_MESSAGES: Record<Exclude<RoomEntry, "open">, string> = {
  early: `A sala abre ${ROOM_OPENS_BEFORE_MINUTES} minutos antes do horário da sessão.`,
  ended: "Esta sessão já foi encerrada.",
  unavailable: "Esta sessão não está confirmada.",
};
