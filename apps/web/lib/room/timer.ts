// Cronômetro da sala. Sem dependências: roda no navegador e nos testes.

export type SessionClock = {
  // Segundos desde o início marcado da sessão. Zero enquanto ela não começou.
  elapsedSeconds: number;
  // Duração marcada da sessão, em segundos.
  totalSeconds: number;
  // Passou do horário de término.
  overtime: boolean;
};

// O relógio parte do horário marcado (starts_at), não de quando cada um entrou: os dois
// participantes veem o mesmo tempo, mesmo que um recarregue a página.
export function sessionClock(startsAt: string, endsAt: string, now: Date = new Date()): SessionClock {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - start) / 1000));
  const totalSeconds = Math.max(0, Math.round((end - start) / 1000));

  return { elapsedSeconds, totalSeconds, overtime: now.getTime() >= end };
}

// "07:05", "60:00", "125:30": minutos corridos (sem virar horas) e segundos.
export function formatClock(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
