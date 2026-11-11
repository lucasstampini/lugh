"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormAlert } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/initials";
import { NOTES_MAX_LENGTH, type SessionType } from "@/lib/slots";
import { createSession } from "./actions";

export type BookingSlot = {
  startsAt: string;
  // "19h"
  time: string;
  // "qua, 18 nov · 19h"
  label: string;
};

export type BookingDay = {
  dayKey: string;
  // "qua 18"
  label: string;
  slots: BookingSlot[];
};

const SESSION_TYPE_OPTIONS: { value: SessionType; title: string; description: string }[] = [
  {
    value: "coding",
    title: "Código ao vivo",
    description: "Você resolve um problema no editor e explica o raciocínio enquanto escreve.",
  },
  {
    value: "system_design",
    title: "System design",
    description: "Você desenha a arquitetura de um sistema no quadro, junto com quem entrevista.",
  },
  {
    value: "behavioral",
    title: "Comportamental",
    description: "Perguntas sobre suas experiências e sobre como você trabalha em equipe.",
  },
];

const WEEK_LABELS = ["próximos 7 dias", "semana seguinte"];

const H2 = "font-heading text-[22px] font-bold";
const SUMMARY_ROW = "flex justify-between gap-4";

export function BookingForm({
  interviewerId,
  interviewerName,
  headline,
  avatarUrl,
  price,
  days,
  week,
  initialSlot,
}: {
  interviewerId: string;
  interviewerName: string;
  headline: string;
  avatarUrl: string | null;
  price: string;
  days: BookingDay[];
  week: number;
  initialSlot: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    createSession.bind(null, interviewerId),
    null,
  );
  // Controlados: o React limpa campos não controlados depois da action, e um
  // erro (horário recém-ocupado, por exemplo) não pode apagar o que foi escrito.
  const [slot, setSlot] = useState<string | null>(initialSlot);
  const [type, setType] = useState<SessionType>("coding");
  const [notes, setNotes] = useState("");

  const selected = days.flatMap((day) => day.slots).find((item) => item.startsAt === slot);
  const hasSlots = days.some((day) => day.slots.length > 0);
  const otherWeek = week === 0 ? 1 : 0;

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-x-12 gap-y-7">
      <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-7">
        <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
          Agende sua sessão
        </h1>

        <fieldset className="flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <legend className={H2}>Horário</legend>
            <span className="text-muted-foreground font-mono text-xs">horário de Brasília</span>
          </div>

          <nav aria-label="Semana" className="flex flex-wrap gap-2 font-mono text-[13px]">
            {WEEK_LABELS.map((label, index) => (
              <Link
                key={label}
                href={`/agendar/${interviewerId}?semana=${index}`}
                aria-current={index === week ? "page" : undefined}
                className={`edge inline-flex min-h-11 items-center rounded-[9px] px-3.5 ${
                  index === week ? "bg-foreground text-background font-bold" : "bg-card"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {hasSlots ? (
            <div className="bg-secondary flex flex-col gap-2.5 rounded-2xl p-4 font-mono text-[13px]">
              {days.map((day) => (
                <div key={day.dayKey} className="flex items-start gap-2.5">
                  <span
                    className={`flex min-h-11 w-16 shrink-0 items-center ${
                      day.slots.length > 0 ? "font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {day.label}
                  </span>
                  {day.slots.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {day.slots.map((item) => (
                        <label
                          key={item.startsAt}
                          className="edge bg-card has-checked:bg-primary has-checked:text-ink has-focus-visible:outline-ring inline-flex min-h-11 min-w-[58px] cursor-pointer items-center justify-center rounded-lg px-2 has-checked:font-bold has-focus-visible:outline-[3px] has-focus-visible:outline-offset-[3px]"
                        >
                          <input
                            type="radio"
                            name="slot"
                            value={item.startsAt}
                            checked={slot === item.startsAt}
                            onChange={() => setSlot(item.startsAt)}
                            className="sr-only"
                          />
                          <span className="sr-only">{item.label}</span>
                          <span aria-hidden="true">{item.time}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex min-h-11 items-center">
                      sem horários
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="edge-dashed flex flex-col items-start gap-2 rounded-2xl p-4">
              <p className="text-muted-foreground">
                {interviewerName} não tem horário livre neste período.
              </p>
              <Link
                href={`/agendar/${interviewerId}?semana=${otherWeek}`}
                className="text-brand-deep inline-flex min-h-11 items-center font-bold underline"
              >
                {otherWeek === 1 ? "Ver a semana seguinte" : "Ver os próximos 7 dias"}
              </Link>
            </div>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2.5">
          <legend className={`${H2} mb-3.5`}>Tipo de entrevista</legend>
          {SESSION_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="edge bg-card has-checked:bg-accent flex cursor-pointer items-start gap-3 rounded-[14px] px-4 py-3.5"
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="accent-brand-deep mt-1 size-5 shrink-0"
              />
              <span>
                <span className="block font-extrabold">{option.title}</span>
                <span className="text-muted-foreground block text-sm">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <Field
          label="O que você quer treinar?"
          htmlFor="notes"
          counter={`${notes.length}/${NOTES_MAX_LENGTH}`}
          help="Opcional. Conte a vaga que você busca e onde costuma travar: quem entrevista lê antes da sessão."
        >
          <Textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={NOTES_MAX_LENGTH}
            placeholder="Ex: estágio em backend, quero treinar explicar meu raciocínio em voz alta."
          />
        </Field>
      </div>

      <aside
        aria-label="Resumo da sessão"
        className="edge bg-card box-border flex w-full min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-[18px] p-5 md:max-w-[400px]"
      >
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={60}
              height={60}
              unoptimized
              className="edge size-[60px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="edge bg-accent flex size-[60px] shrink-0 items-center justify-center rounded-full font-mono font-bold"
            >
              {initials(interviewerName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-extrabold break-words">{interviewerName}</p>
            <p className="text-muted-foreground text-sm break-words">{headline}</p>
          </div>
        </div>
        <div className="border-border border-t-[1.5px] border-dashed" />
        <dl className="flex flex-col gap-2.5 font-mono text-[13px]">
          <div className={SUMMARY_ROW}>
            <dt className="text-muted-foreground">horário</dt>
            <dd aria-live="polite" className={selected ? "font-bold" : "text-muted-foreground"}>
              {selected ? selected.label : "escolha um horário"}
            </dd>
          </div>
          <div className={SUMMARY_ROW}>
            <dt className="text-muted-foreground">duração</dt>
            <dd>1h</dd>
          </div>
          <div className={SUMMARY_ROW}>
            <dt className="text-muted-foreground">pagamento</dt>
            <dd>PIX</dd>
          </div>
        </dl>
        <div className="border-border border-t-[1.5px] border-dashed" />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-extrabold">Total</span>
          <span className="font-heading text-[28px] leading-none font-extrabold tabular-nums">
            {price}
          </span>
        </div>

        {state?.error ? <FormAlert title="Não deu para agendar">{state.error}</FormAlert> : null}

        <Button type="submit" size="lg" disabled={!selected || pending} className="h-[54px] w-full">
          {pending ? "Agendando..." : "Confirmar agendamento"}
        </Button>
        <p className="text-muted-foreground text-center font-mono text-xs">
          pagamento por PIX chega em breve
        </p>
      </aside>
    </form>
  );
}
