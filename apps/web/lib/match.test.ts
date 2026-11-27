/**
 * Testes de lib/match.ts
 *
 * O que cobre: a ordem e os motivos dos entrevistadores sugeridos no fim do onboarding do
 * candidato, a partir das respostas do questionário (área, tipo, urgência e momento).
 *
 * Por que importa: é a primeira coisa que o candidato vê depois de responder. O motivo
 * mostrado tem que ser o que de fato pontuou, e quem não tem horário livre não pode
 * passar na frente de quem dá para agendar.
 *
 * Rodar só este arquivo: npx vitest run lib/match.test.ts
 */
import { describe, expect, it } from "vitest";

import type { CandidatePreferences } from "./candidate-preferences";
import type { ListedInterviewer } from "./interviewers";
import { MATCH_COUNT, rankInterviewers } from "./match";

const NOW = new Date("2026-11-27T12:00:00.000Z");
const TOMORROW = "2026-11-28T22:00:00.000Z";
const IN_TEN_DAYS = "2026-12-07T22:00:00.000Z";

const NONE: CandidatePreferences = { areas: [], interviewTypes: [], urgency: null, careerStage: null };

function interviewer(
  id: string,
  overrides: {
    areas?: string[];
    seniority?: string;
    price?: number;
    average?: number | null;
    reviews?: number;
    nextSlotAt?: string | null;
  } = {},
): ListedInterviewer {
  return {
    interviewer: {
      profile_id: id,
      headline: "Engenheira de software",
      company: "Empresa Fictícia",
      seniority: overrides.seniority ?? "senior",
      areas: overrides.areas ?? ["software_engineer"],
      price_cents: overrides.price ?? 10000,
      bio: null,
    },
    profile: { id, name: id, avatar_url: null },
    rating:
      overrides.average === undefined
        ? null
        : { average: overrides.average, reviewCount: overrides.reviews ?? 3 },
    slots: [],
    nextSlotAt: overrides.nextSlotAt === undefined ? TOMORROW : overrides.nextSlotAt,
  };
}

const ids = (matches: ListedInterviewer[]) => matches.map((match) => match.interviewer.profile_id);

describe("rankInterviewers", () => {
  it("põe na frente quem atende a área escolhida e diz o motivo", () => {
    const matches = rankInterviewers(
      { ...NONE, areas: ["data"] },
      [interviewer("mobile", { areas: ["mobile"], average: 5 }), interviewer("dados", { areas: ["data"] })],
      NOW,
    );

    expect(ids(matches)).toEqual(["dados", "mobile"]);
    expect(matches[0].reasons).toEqual(["Atende Dados"]);
  });

  it("system design e comportamental casam com a área de mesmo nome; código ao vivo não pontua sozinho", () => {
    const matches = rankInterviewers(
      { ...NONE, interviewTypes: ["coding", "system_design", "behavioral"] },
      [interviewer("so-codigo"), interviewer("os-dois", { areas: ["system_design", "behavioral"] })],
      NOW,
    );

    expect(ids(matches)).toEqual(["os-dois", "so-codigo"]);
    expect(matches[0].reasons).toEqual(["Faz system design", "Faz entrevista comportamental"]);
    expect(matches[1].reasons).toEqual([]);
  });

  it("com pressa, quem tem horário em até 7 dias passa na frente", () => {
    const matches = rankInterviewers(
      { ...NONE, urgency: "this_week" },
      [interviewer("depois", { nextSlotAt: IN_TEN_DAYS, average: 5 }), interviewer("amanha")],
      NOW,
    );

    expect(ids(matches)).toEqual(["amanha", "depois"]);
    expect(matches[0].reasons).toEqual(["Tem horário esta semana"]);
  });

  it("quem não tem horário livre vai para o fim, mesmo casando a área", () => {
    const matches = rankInterviewers(
      { ...NONE, areas: ["data"] },
      [interviewer("sem-horario", { areas: ["data"], nextSlotAt: null }), interviewer("com-horario")],
      NOW,
    );

    expect(ids(matches)).toEqual(["com-horario", "sem-horario"]);
  });

  it("momento de carreira só desempata: preço menor para quem está começando, mais sênior para quem já trabalha", () => {
    const list = [
      interviewer("staff-caro", { seniority: "staff", price: 30000 }),
      interviewer("junior-barato", { seniority: "junior", price: 5000 }),
    ];

    expect(ids(rankInterviewers({ ...NONE, careerStage: "first_job" }, list, NOW))[0]).toBe("junior-barato");
    expect(ids(rankInterviewers({ ...NONE, careerStage: "working" }, list, NOW))[0]).toBe("staff-caro");

    // Com área em jogo, o desempate não inverte a ordem.
    const withArea = [
      interviewer("barato-fora", { areas: ["mobile"], price: 3000 }),
      interviewer("caro-na-area", { areas: ["data"], price: 30000 }),
    ];
    expect(
      ids(rankInterviewers({ ...NONE, areas: ["data"], careerStage: "internship" }, withArea, NOW))[0],
    ).toBe("caro-na-area");
  });

  it("sem resposta nenhuma, ordena pela nota e o motivo é a avaliação", () => {
    const matches = rankInterviewers(
      NONE,
      [interviewer("sem-nota"), interviewer("nota-4", { average: 4 }), interviewer("nota-5", { average: 5 })],
      NOW,
    );

    expect(ids(matches)).toEqual(["nota-5", "nota-4", "sem-nota"]);
    expect(matches[0].reasons).toEqual(["Bem avaliado"]);
    expect(matches[2].reasons).toEqual([]);
  });

  it("devolve no máximo três, e lista vazia quando não há entrevistador", () => {
    const many = ["a", "b", "c", "d", "e"].map((id) => interviewer(id));

    expect(MATCH_COUNT).toBe(3);
    expect(rankInterviewers(NONE, many, NOW)).toHaveLength(MATCH_COUNT);
    expect(rankInterviewers(NONE, [], NOW)).toEqual([]);
  });
});
