/**
 * Testes de lib/emails.ts
 *
 * O que cobre: assunto, texto e HTML dos quatro e-mails (confirmação, lembrete, feedback
 * e repasse): horário em Brasília, valor formatado, link certo e nome escapado.
 *
 * Por que importa: e-mail enviado não tem como corrigir. Horário no fuso errado faz a
 * pessoa perder a sessão, e nome cru no HTML deixa o perfil de um usuário injetar
 * conteúdo no e-mail de outro.
 *
 * Rodar só este arquivo: npx vitest run lib/emails.test.ts
 */
import { describe, expect, it } from "vitest";

import { confirmationEmail, feedbackReadyEmail, payoutEmail, reminderEmail } from "./emails";

// 22:00 UTC = 19h em Brasília, quarta, 18 de novembro.
const STARTS_AT = "2026-11-18T22:00:00.000Z";
const ROOM_URL = "https://lugh.example/sala/sessao-1";

const candidateInput = {
  role: "candidate" as const,
  recipientName: "Pedro Almeida",
  otherName: "Camila Ribeiro",
  startsAt: STARTS_AT,
  type: "system_design" as const,
  roomUrl: ROOM_URL,
};
const interviewerInput = {
  ...candidateInput,
  role: "interviewer" as const,
  recipientName: "Camila Ribeiro",
  otherName: "Pedro Almeida",
};

// O Intl separa "R$" do número com espaço não separável.
const plain = (value: string) => value.replaceAll(" ", " ");

describe("confirmationEmail", () => {
  it("mostra data e hora em Brasília, o tipo e o link da sala para o candidato", () => {
    const email = confirmationEmail(candidateInput);

    expect(email.subject).toBe("Sessão confirmada: qua, 18 nov às 19h");
    expect(email.text).toContain("Recebemos o seu pagamento e a sessão com Camila Ribeiro");
    expect(email.text).toContain("quando: qua, 18 nov às 19h (horário de Brasília)");
    expect(email.text).toContain("tipo: system design");
    expect(email.text).toContain("entrevistador: Camila Ribeiro");
    expect(email.text).toContain(`Entrar na sala: ${ROOM_URL}`);
    expect(email.html).toContain(`href="${ROOM_URL}"`);
  });

  it("fala com o entrevistador do ponto de vista dele", () => {
    const email = confirmationEmail(interviewerInput);

    expect(email.text).toContain("Pedro Almeida agendou e pagou uma sessão com você");
    expect(email.text).toContain("candidato: Pedro Almeida");
    expect(email.text).not.toContain("Recebemos o seu pagamento");
  });

  it("escapa o nome no HTML", () => {
    const email = confirmationEmail({
      ...candidateInput,
      otherName: '<img src=x onerror="alert(1)">',
    });

    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});

describe("reminderEmail", () => {
  it("avisa que falta 1 hora, com o horário e o link da sala", () => {
    const email = reminderEmail(candidateInput);

    expect(email.subject).toBe("Sua sessão começa às 19h");
    expect(email.text).toContain("Falta 1 hora para a sua sessão com Camila Ribeiro");
    expect(email.text).toContain(`Entrar na sala: ${ROOM_URL}`);
  });
});

describe("feedbackReadyEmail", () => {
  it("avisa o candidato e leva ao resultado", () => {
    const email = feedbackReadyEmail({
      candidateName: "Pedro Almeida",
      interviewerName: "Camila Ribeiro",
      startsAt: STARTS_AT,
      resultUrl: "https://lugh.example/sessoes/sessao-1/resultado",
    });

    expect(email.subject).toBe("Seu feedback chegou");
    expect(email.text).toContain("Camila Ribeiro enviou o feedback da sessão de qua, 18 nov");
    expect(email.text).toContain("Ver o resultado: https://lugh.example/sessoes/sessao-1/resultado");
  });
});

describe("payoutEmail", () => {
  const input = {
    interviewerName: "Camila Ribeiro",
    candidateName: "Pedro Almeida",
    amountCents: 8000,
    startsAt: STARTS_AT,
    panelUrl: "https://lugh.example/painel",
  };

  it("mostra o valor a partir dos centavos e leva ao painel", () => {
    const email = payoutEmail(input);

    expect(plain(email.subject)).toBe("Você recebeu R$ 80");
    expect(plain(email.text)).toContain("valor: R$ 80");
    expect(email.text).toContain("sessão de qua, 18 nov com Pedro Almeida");
    expect(email.text).toContain("Ver meus ganhos: https://lugh.example/painel");
  });

  it("mantém os centavos quando o valor não é redondo", () => {
    expect(plain(payoutEmail({ ...input, amountCents: 8040 }).subject)).toBe("Você recebeu R$ 80,40");
  });
});

describe("todos os e-mails", () => {
  it("não usam travessão", () => {
    const emails = [
      confirmationEmail(candidateInput),
      confirmationEmail(interviewerInput),
      reminderEmail(candidateInput),
      feedbackReadyEmail({
        candidateName: "Pedro",
        interviewerName: "Camila",
        startsAt: STARTS_AT,
        resultUrl: ROOM_URL,
      }),
      payoutEmail({
        interviewerName: "Camila",
        candidateName: "Pedro",
        amountCents: 8000,
        startsAt: STARTS_AT,
        panelUrl: ROOM_URL,
      }),
    ];

    for (const email of emails) {
      expect(email.subject + email.text + email.html).not.toContain("—");
    }
  });
});
