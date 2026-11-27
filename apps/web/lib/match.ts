import type { CandidatePreferences } from "@/lib/candidate-preferences";
import { AREA_OPTIONS } from "@/lib/interviewer-options";
import type { ListedInterviewer } from "@/lib/interviewers";

// Match do onboarding: ordena os entrevistadores pelas respostas do candidato e diz por
// que cada um apareceu. É uma conta simples e de verdade (área, tipo de entrevista e
// horário livre), sem peso escondido: o motivo mostrado na tela é o que pontuou.

export const MATCH_COUNT = 3;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const AREA_POINTS = 3;
const TYPE_POINTS = 2;
const URGENCY_POINTS = 2;

const areaLabels: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);

// System design e comportamental existem como área do entrevistador. Código ao vivo não
// tem área própria: quem cobre é a área de função escolhida.
const TYPE_AREAS: Record<string, { area: string; reason: string }> = {
  system_design: { area: "system_design", reason: "Faz system design" },
  behavioral: { area: "behavioral", reason: "Faz entrevista comportamental" },
};

const SENIORITY_RANK: Record<string, number> = { junior: 0, mid: 1, senior: 2, staff: 3 };

export type Match = ListedInterviewer & { reasons: string[] };

type Scored = { item: ListedInterviewer; score: number; reasons: string[] };

function score(preferences: CandidatePreferences, item: ListedInterviewer, now: Date): Scored {
  const reasons: string[] = [];
  let points = 0;

  for (const area of preferences.areas) {
    if (item.interviewer.areas.includes(area)) {
      points += AREA_POINTS;
      reasons.push(`Atende ${areaLabels[area] ?? area}`);
    }
  }

  for (const type of preferences.interviewTypes) {
    const match = TYPE_AREAS[type];
    if (match && item.interviewer.areas.includes(match.area)) {
      points += TYPE_POINTS;
      reasons.push(match.reason);
    }
  }

  // Urgência só pontua para quem pediu pressa e tem horário dentro do prazo. "Este mês"
  // vale qualquer horário livre: a janela de agendamento é menor que um mês.
  if (item.nextSlotAt) {
    const inAWeek = new Date(item.nextSlotAt).getTime() - now.getTime() <= WEEK_MS;
    if (preferences.urgency === "this_week" && inAWeek) {
      points += URGENCY_POINTS;
      reasons.push("Tem horário esta semana");
    } else if (preferences.urgency === "this_month") {
      points += URGENCY_POINTS;
      reasons.push("Tem horário nos próximos dias");
    }
  }

  return { item, score: points, reasons };
}

// Os `MATCH_COUNT` entrevistadores com melhor match, do melhor para o pior. Quem não tem
// horário livre só entra se faltar gente (não dá para agendar com ele agora).
export function rankInterviewers(
  preferences: CandidatePreferences,
  interviewers: ListedInterviewer[],
  now: Date = new Date(),
): Match[] {
  // Momento de carreira só desempata: quem busca estágio ou a primeira vaga vê primeiro
  // o mais barato; quem já trabalha na área vê primeiro o mais sênior.
  const prefersSenior = preferences.careerStage === "working";
  const prefersCheaper = preferences.careerStage === "internship" || preferences.careerStage === "first_job";

  const ranked = interviewers
    .map((item) => score(preferences, item, now))
    .sort((a, b) => {
      const availability = Number(Boolean(b.item.nextSlotAt)) - Number(Boolean(a.item.nextSlotAt));
      if (availability !== 0) return availability;
      if (b.score !== a.score) return b.score - a.score;
      if (prefersSenior) {
        const seniority =
          (SENIORITY_RANK[b.item.interviewer.seniority] ?? 0) - (SENIORITY_RANK[a.item.interviewer.seniority] ?? 0);
        if (seniority !== 0) return seniority;
      }
      const price = a.item.interviewer.price_cents - b.item.interviewer.price_cents;
      if (prefersCheaper && price !== 0) return price;
      const rating = (b.item.rating?.average ?? 0) - (a.item.rating?.average ?? 0);
      if (rating !== 0) return rating;
      return price;
    });

  return ranked.slice(0, MATCH_COUNT).map(({ item, score: points, reasons }) => ({
    ...item,
    // Sem nenhuma resposta casada, o motivo é o que de fato ordenou: a nota.
    reasons: points > 0 ? reasons : item.rating?.reviewCount ? ["Bem avaliado"] : [],
  }));
}
