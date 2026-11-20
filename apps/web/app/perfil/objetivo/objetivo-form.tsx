"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { NotSavedNote } from "../wizard-parts";

const LEVEL_OPTIONS = ["Estágio", "Júnior", "Os dois"];
const COMPANY_OPTIONS = ["Fintech de grande porte", "Big tech", "Empresa em crescimento"];
const FORMAT_OPTIONS = [
  { label: "Entrevista técnica", description: "Raciocínio, código e testes." },
  { label: "Comportamental", description: "Conte sua história com clareza." },
  { label: "System design", description: "Desenhe e discuta sistemas." },
];

// Etapa 2 ("Objetivo profissional", Figma node 47:61) é só visual por
// enquanto: não existe coluna no banco pra nível, tipo de empresa ou
// formato de treino. "Continuar" só navega pra próxima etapa, e por isso nada
// vem marcado de início: a tela não finge ter dados da pessoa.
export function ObjetivoForm() {
  const [level, setLevel] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="border-border-soft bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          Que tipo de oportunidade você busca?
        </h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="area" className="text-xs font-bold">
              Área de interesse
            </label>
            <input
              id="area"
              name="area"
              placeholder="Engenharia de software"
              className="border-border-soft bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-xs font-bold">
              Função que você busca
            </label>
            <input
              id="role"
              name="role"
              placeholder="Desenvolvedora back-end"
              className="border-border-soft bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span id="level-label" className="text-xs font-bold">
            Seu próximo nível
          </span>
          <div role="radiogroup" aria-labelledby="level-label" className="flex flex-col gap-3 sm:flex-row">
            {LEVEL_OPTIONS.map((option) => {
              const selected = option === level;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLevel(option)}
                  className={`flex flex-1 items-center gap-2.5 rounded-xl border p-4 text-left text-sm font-bold ${
                    selected
                      ? "bg-secondary border-ink text-brand-deep"
                      : "bg-card border-border-soft"
                  }`}
                >
                  <span
                    className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
                      selected ? "bg-primary border-ink" : "bg-card border-border-soft"
                    }`}
                  >
                    {selected ? <span className="bg-ink size-1.5 rounded-full" /> : null}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-[11px]">
            Sem precisar escolher uma empresa específica. Vamos partir do
            tipo de vaga que faz sentido para você.
          </p>
        </div>
      </div>

      <div className="border-border-soft bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            Onde você gostaria de trabalhar?
          </h3>
          <p className="text-muted-foreground text-xs">
            Opcional · Você pode escolher mais de um tipo de empresa.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {COMPANY_OPTIONS.map((option) => {
            const selected = companies.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(companies, setCompanies, option)}
                className={`flex flex-1 items-center gap-2.5 rounded-xl border p-4 text-left text-sm font-bold ${
                  selected
                    ? "bg-secondary border-ink text-brand-deep"
                    : "bg-card border-border-soft"
                }`}
              >
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-md ${
                    selected ? "bg-primary border-ink border" : "bg-card border-border-soft border"
                  }`}
                >
                  {selected ? <Check aria-hidden="true" size={12} strokeWidth={3} className="text-ink" /> : null}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border-soft bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            O que você quer treinar primeiro?
          </h3>
          <p className="text-muted-foreground text-xs">
            Selecione os formatos que mais ajudam no seu objetivo. Você pode
            mudar depois.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {FORMAT_OPTIONS.map((option) => {
            const selected = formats.includes(option.label);
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(formats, setFormats, option.label)}
                className={`flex flex-1 flex-col gap-2 rounded-xl border p-4 text-left ${
                  selected
                    ? "bg-secondary border-ink"
                    : "bg-card border-border-soft"
                }`}
              >
                <span
                  className={`flex items-center gap-2.5 text-sm font-bold ${
                    selected ? "text-brand-deep" : "text-foreground"
                  }`}
                >
                  <span
                    className={`flex size-[18px] shrink-0 items-center justify-center rounded-md ${
                      selected ? "bg-primary border-ink border" : "bg-card border-border-soft border"
                    }`}
                  >
                    {selected ? (
                      <Check aria-hidden="true" size={12} strokeWidth={3} className="text-ink" />
                    ) : null}
                  </span>
                  {option.label}
                </span>
                <span className="text-muted-foreground text-xs">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <NotSavedNote />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/perfil"
            className="text-brand-deep flex min-h-[52px] items-center text-sm font-bold"
          >
            ← Voltar
          </Link>
          <Link
            href="/perfil/experiencia"
            className={buttonVariants({ className: "h-[52px] px-5" })}
          >
            Continuar →
          </Link>
        </div>
      </div>
    </div>
  );
}
