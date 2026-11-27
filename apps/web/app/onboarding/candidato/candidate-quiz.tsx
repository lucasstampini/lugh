"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import { saveCandidateQuiz } from "@/app/onboarding/actions";
import { Eyebrow } from "@/components/eyebrow";
import { Field, FormAlert } from "@/components/form-field";
import { springSoft } from "@/components/motion/springs";
import { TermsConsent } from "@/components/terms-consent";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CAREER_STAGE_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  ROLE_AREA_OPTIONS,
  URGENCY_OPTIONS,
} from "@/lib/candidate-preferences";

const QUESTIONS = [
  {
    title: "Qual sua área de interesse?",
    help: "Pode marcar mais de uma. É por ela que a gente procura quem já trabalha com isso.",
  },
  {
    title: "Que tipo de entrevista você quer treinar?",
    help: "Pode marcar mais de um. Você escolhe o tipo de novo na hora de agendar.",
  },
  {
    title: "Tem entrevista chegando?",
    help: "Quem tem pressa vê primeiro os entrevistadores com horário livre mais cedo.",
  },
  {
    title: "Em que momento você está?",
    help: "Ajuda a ordenar as sugestões para o seu momento.",
  },
  {
    title: "Como a gente te chama?",
    help: "É o nome que o entrevistador vê quando você agenda.",
  },
] as const;

const LAST_STEP = QUESTIONS.length - 1;

// Opção do questionário: botão com `aria-pressed`. Marcada fica em tinta com texto
// branco (DESIGN.md, seção 7); a cor não é a única pista, o peso do título também muda.
function Option({
  pressed,
  onClick,
  title,
  description,
}: {
  pressed: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`edge lift flex min-h-11 flex-[1_1_220px] cursor-pointer flex-col gap-1 rounded-[14px] px-4 py-3.5 text-left ${
        pressed ? "bg-foreground text-background" : "bg-card hover-deep"
      }`}
    >
      <span className={pressed ? "font-extrabold" : "font-bold"}>{title}</span>
      {description ? <span className="text-sm opacity-80">{description}</span> : null}
    </button>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

// Questionário de onboarding do candidato: uma pergunta por tela, tudo guardado no
// estado e enviado de uma vez no fim. Toda pergunta pode ser pulada; só o nome é
// obrigatório. Sem barra de progresso, só o contador: o fluxo é curto.
export function CandidateQuiz({
  initialName,
  needsTermsAcceptance,
}: {
  initialName: string;
  // Falso para quem já aceitou os Termos (ex.: voltou ao onboarding).
  needsTermsAcceptance: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveCandidateQuiz, null);
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<string[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<string[]>([]);
  const [urgency, setUrgency] = useState("");
  const [careerStage, setCareerStage] = useState("");
  // Controlado: o React limpa campos não controlados depois da action, e um erro ao
  // salvar não pode apagar o nome digitado.
  const [name, setName] = useState(initialName);

  // Ao trocar de pergunta o foco vai para o título: quem usa leitor de tela ou teclado
  // ouve a pergunta nova em vez de ficar num botão que sumiu.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus();
  }, [step]);

  const next = () => setStep((current) => Math.min(current + 1, LAST_STEP));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  const answered = [areas.length > 0, interviewTypes.length > 0, urgency !== "", careerStage !== ""];
  const question = QUESTIONS[step];

  let options: ReactNode = null;
  if (step === 0) {
    options = ROLE_AREA_OPTIONS.map((option) => (
      <Option
        key={option.value}
        title={option.label}
        pressed={areas.includes(option.value)}
        onClick={() => setAreas((current) => toggle(current, option.value))}
      />
    ));
  } else if (step === 1) {
    options = INTERVIEW_TYPE_OPTIONS.map((option) => (
      <Option
        key={option.value}
        title={option.title}
        description={option.description}
        pressed={interviewTypes.includes(option.value)}
        onClick={() => setInterviewTypes((current) => toggle(current, option.value))}
      />
    ));
  } else if (step === 2) {
    // Resposta única: escolher já leva para a próxima pergunta.
    options = URGENCY_OPTIONS.map((option) => (
      <Option
        key={option.value}
        title={option.title}
        description={option.description}
        pressed={urgency === option.value}
        onClick={() => {
          setUrgency(option.value);
          next();
        }}
      />
    ));
  } else if (step === 3) {
    options = CAREER_STAGE_OPTIONS.map((option) => (
      <Option
        key={option.value}
        title={option.title}
        description={option.description}
        pressed={careerStage === option.value}
        onClick={() => {
          setCareerStage(option.value);
          next();
        }}
      />
    ));
  }

  return (
    <form action={formAction} className="flex max-w-[720px] flex-col gap-7">
      {/* As respostas vão em campos escondidos: só a pergunta atual está montada. */}
      {areas.map((area) => (
        <input key={area} type="hidden" name="areas" value={area} />
      ))}
      {interviewTypes.map((type) => (
        <input key={type} type="hidden" name="interviewTypes" value={type} />
      ))}
      <input type="hidden" name="urgency" value={urgency} />
      <input type="hidden" name="careerStage" value={careerStage} />
      {step !== LAST_STEP ? <input type="hidden" name="name" value={name} /> : null}

      <motion.div
        key={step}
        className="flex flex-col gap-7 motion-reduce:transform-none!"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={springSoft}
      >
        <div className="flex flex-col gap-2">
          <Eyebrow>
            pergunta {step + 1} de {QUESTIONS.length}
          </Eyebrow>
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em] outline-none"
          >
            {question.title}
          </h1>
          <p className="text-muted-foreground">{question.help}</p>
        </div>

        {state?.error ? <FormAlert title={state.error} /> : null}

        {step === LAST_STEP ? (
          <div className="flex flex-col gap-5">
            <Field label="Nome" htmlFor="name">
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={120}
              />
            </Field>
            {needsTermsAcceptance ? <TermsConsent /> : null}
          </div>
        ) : (
          <div role="group" aria-label={question.title} className="flex flex-wrap gap-3">
            {options}
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {step === 0 ? (
          <Link href="/onboarding" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft aria-hidden="true" />
            Voltar
          </Link>
        ) : (
          <Button type="button" variant="outline" onClick={back}>
            <ArrowLeft aria-hidden="true" />
            Voltar
          </Button>
        )}

        {step === LAST_STEP ? (
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Salvando…" : "Ver meus matches"}
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : answered[step] ? (
          <Button type="button" onClick={next}>
            Continuar
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={next}>
            Pular
          </Button>
        )}
      </div>
    </form>
  );
}
