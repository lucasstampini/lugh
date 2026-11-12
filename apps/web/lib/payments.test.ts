/**
 * Testes de lib/payments.ts
 *
 * O que cobre: a cobrança PIX de uma sessão (uma por sessão, com ou sem split), a
 * confirmação do pagamento e a consulta de status. O banco e a AbacatePay são simulados.
 *
 * Por que importa: é dinheiro. Cobrar duas vezes, confirmar sessão sem pagamento ou
 * perder um pagamento feito no último segundo são os erros que não podem acontecer.
 *
 * Rodar só este arquivo: npx vitest run lib/payments.test.ts
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AbacatePayError } from "./abacatepay";
import {
  confirmPayment,
  ensurePayment,
  interviewerShare,
  paymentSecondsLeft,
  refreshPaymentStatus,
} from "./payments";

type Call = {
  table: string;
  op: "select" | "insert" | "update";
  values?: Record<string, unknown>;
  filters: Record<string, unknown>;
};
type Result = { data?: unknown; error?: { code?: string; message: string } | null };

const mocks = vi.hoisted(() => ({
  createPixCharge: vi.fn(),
  checkPixCharge: vi.fn(),
  respond: vi.fn(),
}));

const calls: Call[] = [];

// Imitação mínima do query builder do Supabase: registra a chamada e devolve o que o
// teste programou em mocks.respond para aquela tabela e operação.
function builder(table: string) {
  const call: Call = { table, op: "select", filters: {} };
  const settle = async (): Promise<Result> => {
    calls.push(call);
    return { data: null, error: null, ...((await mocks.respond(call)) as Result | undefined) };
  };
  const chain = {
    select: () => chain,
    insert: (values: Record<string, unknown>) => {
      call.op = "insert";
      call.values = values;
      return chain;
    },
    update: (values: Record<string, unknown>) => {
      call.op = "update";
      call.values = values;
      return chain;
    },
    eq: (column: string, value: unknown) => {
      call.filters[column] = value;
      return chain;
    },
    in: (column: string, value: unknown) => {
      call.filters[column] = value;
      return chain;
    },
    lt: (column: string, value: unknown) => {
      call.filters[`${column}<`] = value;
      return chain;
    },
    maybeSingle: settle,
    then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
      settle().then(resolve, reject),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({ from: builder }),
}));

vi.mock("@/lib/abacatepay", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./abacatepay")>()),
  createPixCharge: mocks.createPixCharge,
  checkPixCharge: mocks.checkPixCharge,
}));

const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";
const INTERVIEWER_ID = "7d1c2a9e-1111-4222-8333-444455556666";
const CREATED_AT = "2026-11-12T12:00:00.000Z";
// 10 minutos depois de agendar: faltam 20 para o prazo.
const NOW = new Date("2026-11-12T12:10:00.000Z");

const session = {
  id: SESSION_ID,
  status: "pending_payment",
  created_at: CREATED_AT,
  interviewer_id: INTERVIEWER_ID,
};
const charge = {
  id: "pix_char_1",
  status: "PENDING",
  brCode: "000201...",
  brCodeBase64: "data:image/png;base64,AAAA",
  expiresAt: "2026-11-12T12:30:00.000Z",
};
const paymentRow = {
  br_code: "000201...",
  br_code_base64: "data:image/png;base64,AAAA",
  expires_at: "2026-11-12T12:30:00.000Z",
  amount_cents: 10000,
};

// Programa as respostas do banco por "tabela.operação".
function database(responses: Record<string, Result | ((call: Call) => Result)>) {
  mocks.respond.mockImplementation((call: Call) => {
    const response = responses[`${call.table}.${call.op}`];
    return typeof response === "function" ? response(call) : response;
  });
}

function callsTo(table: string, op: Call["op"]) {
  return calls.filter((call) => call.table === table && call.op === op);
}

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
  mocks.createPixCharge.mockResolvedValue(charge);
});

describe("valores e prazo", () => {
  it("separa 80% para o entrevistador, arredondando para baixo", () => {
    expect(interviewerShare(10000)).toBe(8000);
    expect(interviewerShare(3333)).toBe(2666);
  });

  it("conta os segundos até 30 minutos depois de agendar", () => {
    expect(paymentSecondsLeft(CREATED_AT, NOW)).toBe(20 * 60);
    expect(paymentSecondsLeft(CREATED_AT, new Date("2026-11-12T12:30:01.000Z"))).toBeLessThan(0);
  });
});

describe("ensurePayment", () => {
  it("cria a cobrança com split quando o entrevistador tem subconta", async () => {
    database({
      "sessions.select": { data: session },
      "interviewers.select": { data: { price_cents: 10000, abacate_subaccount_id: "sacc_1" } },
    });

    const result = await ensurePayment(SESSION_ID, NOW);

    expect(mocks.createPixCharge).toHaveBeenCalledWith({
      amountCents: 10000,
      description: expect.any(String),
      expiresInSeconds: 20 * 60,
      externalId: SESSION_ID,
      split: { subAccountId: "sacc_1", amountCents: 8000 },
    });
    expect(callsTo("payments", "insert")[0].values).toMatchObject({
      session_id: SESSION_ID,
      abacate_billing_id: "pix_char_1",
      amount_cents: 10000,
      interviewer_share_cents: 8000,
      expires_at: "2026-11-12T12:30:00.000Z",
    });
    expect(result).toEqual({ kind: "pending", payment: { ...toView(), amountCents: 10000 } });
  });

  it("cobra sem split quando o entrevistador não tem subconta", async () => {
    database({
      "sessions.select": { data: session },
      "interviewers.select": { data: { price_cents: 10000, abacate_subaccount_id: null } },
    });

    await ensurePayment(SESSION_ID, NOW);

    expect(mocks.createPixCharge.mock.calls[0][0]).not.toHaveProperty("split");
    expect(callsTo("payments", "insert")[0].values).toMatchObject({ interviewer_share_cents: 0 });
  });

  it("cobra sem split quando a loja não tem split liberado", async () => {
    database({
      "sessions.select": { data: session },
      "interviewers.select": { data: { price_cents: 10000, abacate_subaccount_id: "sacc_1" } },
    });
    mocks.createPixCharge
      .mockRejectedValueOnce(
        new AbacatePayError("Split para subcontas não está habilitado para esta loja", 200),
      )
      .mockResolvedValueOnce(charge);

    await ensurePayment(SESSION_ID, NOW);

    expect(mocks.createPixCharge).toHaveBeenCalledTimes(2);
    expect(mocks.createPixCharge.mock.calls[1][0]).not.toHaveProperty("split");
    expect(callsTo("payments", "insert")[0].values).toMatchObject({ interviewer_share_cents: 0 });
  });

  it("repassa qualquer outro erro da AbacatePay sem gravar pagamento", async () => {
    database({
      "sessions.select": { data: session },
      "interviewers.select": { data: { price_cents: 10000, abacate_subaccount_id: "sacc_1" } },
    });
    mocks.createPixCharge.mockRejectedValue(new AbacatePayError("Subconta não encontrada", 200));

    await expect(ensurePayment(SESSION_ID, NOW)).rejects.toBeInstanceOf(AbacatePayError);
    expect(callsTo("payments", "insert")).toHaveLength(0);
  });

  it("devolve a cobrança que já existe, sem criar outra", async () => {
    database({ "sessions.select": { data: session }, "payments.select": { data: paymentRow } });

    const result = await ensurePayment(SESSION_ID, NOW);

    expect(result).toEqual({ kind: "pending", payment: toView() });
    expect(mocks.createPixCharge).not.toHaveBeenCalled();
  });

  it("fica com a cobrança de quem gravou primeiro quando duas chamadas correm juntas", async () => {
    let reads = 0;
    database({
      "sessions.select": { data: session },
      "interviewers.select": { data: { price_cents: 10000, abacate_subaccount_id: null } },
      // Primeira leitura: ainda não existe. Depois do insert recusado: a da outra chamada.
      "payments.select": () => ({ data: reads++ === 0 ? null : paymentRow }),
      "payments.insert": { error: { code: "23505", message: "duplicate key" } },
    });

    await expect(ensurePayment(SESSION_ID, NOW)).resolves.toEqual({
      kind: "pending",
      payment: toView(),
    });
  });

  it("expira a sessão quando o prazo de pagamento já passou", async () => {
    database({ "sessions.select": { data: session } });

    const result = await ensurePayment(SESSION_ID, new Date("2026-11-12T12:30:00.000Z"));

    expect(result).toEqual({ kind: "expired" });
    expect(callsTo("sessions", "update")[0]).toMatchObject({
      values: { status: "expired" },
      filters: { status: "pending_payment" },
    });
    expect(mocks.createPixCharge).not.toHaveBeenCalled();
  });

  it("não cria cobrança com menos de 5 minutos de prazo: libera o horário", async () => {
    database({ "sessions.select": { data: session } });

    const result = await ensurePayment(SESSION_ID, new Date("2026-11-12T12:26:00.000Z"));

    expect(result).toEqual({ kind: "expired" });
    expect(callsTo("sessions", "update")[0].filters).toMatchObject({
      id: SESSION_ID,
      status: "pending_payment",
    });
    expect(mocks.createPixCharge).not.toHaveBeenCalled();
  });

  it.each([
    [null, { kind: "not_found" }],
    [{ ...session, status: "expired" }, { kind: "expired" }],
    [{ ...session, status: "scheduled" }, { kind: "settled", status: "scheduled" }],
  ])("não cobra sessão %j", async (row, expected) => {
    database({ "sessions.select": { data: row } });

    await expect(ensurePayment(SESSION_ID, NOW)).resolves.toEqual(expected);
    expect(mocks.createPixCharge).not.toHaveBeenCalled();
  });
});

describe("confirmPayment", () => {
  it("marca o pagamento como pago e confirma a sessão, só a partir dos status de origem", async () => {
    database({ "payments.select": { data: { id: "pay-1", session_id: SESSION_ID } } });

    await expect(confirmPayment("pix_char_1", NOW)).resolves.toBe("confirmed");

    expect(callsTo("payments", "update")[0]).toMatchObject({
      values: { status: "paid", paid_at: NOW.toISOString() },
      filters: { id: "pay-1", status: "pending" },
    });
    expect(callsTo("sessions", "update")[0]).toMatchObject({
      values: { status: "scheduled" },
      filters: { id: SESSION_ID, status: ["pending_payment", "expired"] },
    });
  });

  it("avisa quando o horário da sessão expirada já foi ocupado", async () => {
    database({
      "payments.select": { data: { id: "pay-1", session_id: SESSION_ID } },
      "sessions.update": { error: { code: "23P01", message: "exclusion" } },
    });

    await expect(confirmPayment("pix_char_1", NOW)).resolves.toBe("slot_lost");
  });

  it("ignora cobrança que não é nossa", async () => {
    database({ "payments.select": { data: null } });

    await expect(confirmPayment("pix_char_outro", NOW)).resolves.toBe("unknown");
    expect(callsTo("sessions", "update")).toHaveLength(0);
  });

  it("lança erro quando o banco falha, para o webhook ser reenviado", async () => {
    database({
      "payments.select": { data: { id: "pay-1", session_id: SESSION_ID } },
      "payments.update": { error: { message: "timeout" } },
    });

    await expect(confirmPayment("pix_char_1", NOW)).rejects.toThrow();
  });
});

describe("refreshPaymentStatus", () => {
  const pending = { abacate_billing_id: "pix_char_1", status: "pending" };

  it("confirma a sessão quando a AbacatePay diz que o PIX foi pago", async () => {
    database({
      "sessions.select": { data: { status: "pending_payment", created_at: CREATED_AT } },
      "payments.select": (call) =>
        // A leitura por abacate_billing_id é a do confirmPayment.
        call.filters.abacate_billing_id
          ? { data: { id: "pay-1", session_id: SESSION_ID } }
          : { data: pending },
    });
    mocks.checkPixCharge.mockResolvedValue("PAID");

    await refreshPaymentStatus(SESSION_ID, NOW);

    expect(mocks.checkPixCharge).toHaveBeenCalledWith("pix_char_1");
    expect(callsTo("sessions", "update")[0].values).toEqual({ status: "scheduled" });
  });

  it("não confirma nada enquanto a cobrança está pendente", async () => {
    database({
      "sessions.select": { data: { status: "pending_payment", created_at: CREATED_AT } },
      "payments.select": { data: pending },
    });
    mocks.checkPixCharge.mockResolvedValue("PENDING");

    await expect(refreshPaymentStatus(SESSION_ID, NOW)).resolves.toEqual({
      status: "pending_payment",
      paid: false,
    });
    expect(callsTo("sessions", "update")).toHaveLength(0);
  });

  it("segue com o que está no banco quando a AbacatePay não responde", async () => {
    database({
      "sessions.select": { data: { status: "pending_payment", created_at: CREATED_AT } },
      "payments.select": { data: pending },
    });
    mocks.checkPixCharge.mockRejectedValue(new AbacatePayError("Sem resposta da AbacatePay", 0));

    await expect(refreshPaymentStatus(SESSION_ID, NOW)).resolves.toEqual({
      status: "pending_payment",
      paid: false,
    });
  });

  it("expira a sessão quando o prazo passou sem pagamento", async () => {
    database({
      "sessions.select": { data: { status: "pending_payment", created_at: CREATED_AT } },
      "payments.select": { data: pending },
    });
    mocks.checkPixCharge.mockResolvedValue("EXPIRED");

    await refreshPaymentStatus(SESSION_ID, new Date("2026-11-12T12:31:00.000Z"));

    expect(callsTo("sessions", "update")[0]).toMatchObject({
      values: { status: "expired" },
      filters: { status: "pending_payment" },
    });
  });

  it("não consulta a AbacatePay para sessão já confirmada", async () => {
    database({
      "sessions.select": { data: { status: "scheduled", created_at: CREATED_AT } },
      "payments.select": { data: { ...pending, status: "paid" } },
    });

    await expect(refreshPaymentStatus(SESSION_ID, NOW)).resolves.toEqual({
      status: "scheduled",
      paid: true,
    });
    expect(mocks.checkPixCharge).not.toHaveBeenCalled();
  });

  it("devolve null para sessão que não existe", async () => {
    database({ "sessions.select": { data: null } });

    await expect(refreshPaymentStatus(SESSION_ID, NOW)).resolves.toBeNull();
  });
});

function toView() {
  return {
    brCode: paymentRow.br_code,
    brCodeBase64: paymentRow.br_code_base64,
    expiresAt: paymentRow.expires_at,
    amountCents: paymentRow.amount_cents,
  };
}
