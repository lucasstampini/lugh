"use client";

import { Check, Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormAlert } from "@/components/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentView } from "@/lib/payments";

// De quanto em quanto tempo a tela pergunta se o PIX já caiu.
const POLL_INTERVAL_MS = 5000;

type Phase =
  // Sem cobrança ainda: pedindo o PIX para o servidor.
  | "loading"
  | "ready"
  | "expired"
  // O PIX foi pago, mas o horário já tinha sido liberado e outra pessoa agendou.
  | "paid_without_slot"
  | "error";

const H2 = "font-heading text-[26px] leading-tight font-bold";

type PaymentResult =
  | { kind: "pending"; payment: PaymentView }
  | { kind: "expired" }
  | { kind: "settled" }
  | { kind: "error"; message: string | null }
  // O pedido foi cancelado porque a tela saiu: não há o que mostrar.
  | { kind: "aborted" };

// Pede a cobrança PIX da sessão. Repetir devolve a mesma cobrança.
async function fetchPayment(sessionId: string, signal?: AbortSignal): Promise<PaymentResult> {
  try {
    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      signal,
    });
    const body: { status?: string; payment?: PaymentView; error?: string } = await response.json();

    if (!response.ok) return { kind: "error", message: body.error ?? null };
    if (body.status === "pending_payment" && body.payment) {
      return { kind: "pending", payment: body.payment };
    }
    if (body.status === "expired") return { kind: "expired" };
    if (body.status) return { kind: "settled" };
    return { kind: "error", message: null };
  } catch {
    return signal?.aborted ? { kind: "aborted" } : { kind: "error", message: null };
  }
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PaymentStep({
  sessionId,
  interviewerId,
  initialPayment,
  initialExpired,
}: {
  sessionId: string;
  interviewerId: string;
  // null quando a cobrança ainda não existe (a AbacatePay falhou na hora de agendar).
  initialPayment: PaymentView | null;
  initialExpired: boolean;
}) {
  const router = useRouter();
  const [payment, setPayment] = useState(initialPayment);
  const [phase, setPhase] = useState<Phase>(
    initialExpired ? "expired" : initialPayment ? "ready" : "loading",
  );
  const [error, setError] = useState<string | null>(null);
  // null até o navegador montar: o servidor não conhece o relógio de quem vê a tela.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const goToSessions = useCallback(() => {
    router.replace(`/sessoes?agendada=${sessionId}`);
  }, [router, sessionId]);

  const applyPayment = useCallback(
    (result: PaymentResult) => {
      if (result.kind === "pending") {
        setPayment(result.payment);
        setPhase("ready");
      } else if (result.kind === "expired") {
        setPhase("expired");
      } else if (result.kind === "settled") {
        // A sessão já saiu de aguardando pagamento: foi paga em outra aba.
        goToSessions();
      } else if (result.kind === "error") {
        setError(result.message);
        setPhase("error");
      }
    },
    [goToSessions],
  );

  const checkStatus = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(`/api/payments/status?sessionId=${sessionId}`, {
          signal,
          cache: "no-store",
        });
        if (!response.ok) return;
        const body: { status: string; paid: boolean } = await response.json();

        if (body.status === "expired") {
          setPhase(body.paid ? "paid_without_slot" : "expired");
        } else if (body.status !== "pending_payment") {
          goToSessions();
        }
      } catch {
        // Rede oscilou: a próxima consulta tenta de novo.
      }
    },
    [goToSessions, sessionId],
  );

  // Sem cobrança ao abrir: pede uma.
  useEffect(() => {
    if (initialPayment || initialExpired) return;
    const controller = new AbortController();
    void fetchPayment(sessionId, controller.signal).then(applyPayment);
    return () => controller.abort();
  }, [applyPayment, initialExpired, initialPayment, sessionId]);

  // Enquanto o PIX está na tela, pergunta ao servidor se já caiu. Aba em segundo plano
  // não consulta; ao voltar para ela, consulta na hora.
  useEffect(() => {
    if (phase !== "ready") return;
    const controller = new AbortController();

    const tick = () => {
      if (!document.hidden) void checkStatus(controller.signal);
    };
    const interval = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [checkStatus, phase]);

  // Contagem regressiva até o fim do prazo. No zero, quem decide se expirou é o servidor.
  const expiresAt = payment?.expiresAt;
  useEffect(() => {
    if (phase !== "ready" || !expiresAt) return;
    const deadline = new Date(expiresAt).getTime();

    const update = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        window.clearInterval(interval);
        void checkStatus();
      }
    };
    const interval = window.setInterval(update, 1000);
    update();

    return () => window.clearInterval(interval);
  }, [checkStatus, expiresAt, phase]);

  async function copyCode() {
    if (!payment) return;
    try {
      await navigator.clipboard.writeText(payment.brCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sem permissão de área de transferência: deixa o código selecionado para copiar à mão.
      codeRef.current?.select();
    }
  }

  function retry() {
    setPhase("loading");
    void fetchPayment(sessionId).then(applyPayment);
  }

  if (phase === "expired") {
    return (
      <div className="edge-dashed flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]">
        <h1 className={H2}>O prazo do PIX acabou</h1>
        <p className="text-muted-foreground max-w-[52ch]">
          O horário foi liberado e nada foi cobrado. Escolha um horário para gerar um PIX novo.
        </p>
        <Link href={`/agendar/${interviewerId}`} className={buttonVariants({ className: "h-12 px-5" })}>
          Escolher um horário
        </Link>
      </div>
    );
  }

  if (phase === "paid_without_slot") {
    return (
      <div role="alert" className="edge flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]">
        <h1 className={H2}>Recebemos seu PIX, mas o horário já foi ocupado</h1>
        <p className="text-muted-foreground max-w-[52ch]">
          O pagamento chegou depois do prazo e outra pessoa agendou esse horário. Fale com a
          gente para receber o valor de volta ou escolher outro horário sem pagar de novo.
        </p>
        <Link
          href="/sessoes"
          className={buttonVariants({ variant: "outline", className: "h-12 px-5" })}
        >
          Ver minhas sessões
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
          Pague o PIX para confirmar
        </h1>
        <p className="text-muted-foreground max-w-[60ch]">
          Abra o app do seu banco e escaneie o QR code, ou copie o código e cole na área PIX.
          A confirmação aparece aqui sozinha, em alguns segundos.
        </p>
      </div>

      {phase === "error" ? (
        <div className="flex flex-col items-start gap-3.5">
          <FormAlert title="Não deu para gerar o PIX">
            {error ??
              "O problema é do nosso lado. Seu horário continua reservado: tente de novo em alguns segundos."}
          </FormAlert>
          <Button type="button" onClick={retry} className="h-12 px-5">
            Tentar de novo
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          {payment ? (
            <Image
              src={payment.brCodeBase64}
              alt="QR code do PIX"
              width={220}
              height={220}
              unoptimized
              className="edge bg-card box-border size-[220px] shrink-0 rounded-2xl p-2.5"
            />
          ) : (
            <div
              role="status"
              aria-label="Gerando o PIX"
              className="bg-skeleton border-border-soft size-[220px] shrink-0 animate-pulse rounded-2xl border-[1.5px] motion-reduce:animate-none"
            />
          )}

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[13px]">
              <span className="border-border bg-accent inline-flex items-center gap-1.5 rounded-[7px] border-[1.5px] px-2 py-0.5 font-bold">
                <span
                  aria-hidden="true"
                  className="live bg-card size-2 rounded-full border-[1.5px] border-current"
                />
                aguardando pagamento
              </span>
              <span className="text-muted-foreground tabular-nums" aria-live="off">
                expira em {secondsLeft === null ? "--:--" : formatCountdown(secondsLeft)}
              </span>
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="pix-code" className="text-sm font-bold">
                PIX copia e cola
              </label>
              <Input
                id="pix-code"
                ref={codeRef}
                readOnly
                value={payment?.brCode ?? ""}
                placeholder="gerando o código..."
                onFocus={(event) => event.currentTarget.select()}
                className="font-mono text-[13px]"
              />
            </div>

            <Button
              type="button"
              size="lg"
              onClick={copyCode}
              disabled={!payment}
              className="gap-2 self-start px-5"
            >
              {copied ? (
                <Check aria-hidden="true" strokeWidth={2.4} />
              ) : (
                <Copy aria-hidden="true" strokeWidth={2.2} />
              )}
              <span aria-live="polite">{copied ? "Código copiado" : "Copiar código"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
