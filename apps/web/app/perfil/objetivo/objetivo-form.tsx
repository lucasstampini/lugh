"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const LEVEL_OPTIONS = ["Estágio", "Júnior", "Os dois"];
const COMPANY_OPTIONS = ["Fintech de grande porte", "Big tech", "Empresa em crescimento"];
const FORMAT_OPTIONS = [
  { label: "Entrevista técnica", description: "Raciocínio, código e testes." },
  { label: "Comportamental", description: "Conte sua história com clareza." },
  { label: "System design", description: "Desenhe e discuta sistemas." },
];

// Etapa 2 ("Objetivo profissional", Figma node 47:61) é só visual por
// enquanto: não existe coluna no banco pra nível, tipo de empresa ou
// formato de treino. "Salvar e continuar" só navega pra próxima etapa.
export function ObjetivoForm() {
  const [level, setLevel] = useState("Os dois");
  const [companies, setCompanies] = useState<string[]>(["Fintech de grande porte", "Big tech"]);
  const [formats, setFormats] = useState<string[]>(["Entrevista técnica", "Comportamental"]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          Que tipo de oportunidade você busca?
        </h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="area" className="text-xs font-bold">
              Área de interesse *
            </label>
            <Input
              id="area"
              name="area"
              placeholder="Engenharia de software"
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-xs font-bold">
              Função que você busca
            </label>
            <Input
              id="role"
              name="role"
              placeholder="Desenvolvedora back-end"
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold">Seu próximo nível *</span>
          <div className="flex flex-col gap-3 sm:flex-row">
            {LEVEL_OPTIONS.map((option) => {
              const selected = option === level;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLevel(option)}
                  className={`flex flex-1 items-center gap-2.5 rounded-xl border p-4 text-left text-sm font-bold ${
                    selected
                      ? "bg-secondary border-primary text-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <span
                    className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
                      selected ? "bg-primary border-primary" : "bg-card border-border"
                    }`}
                  >
                    {selected ? <span className="bg-card size-1.5 rounded-full" /> : null}
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

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
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
                onClick={() => toggle(companies, setCompanies, option)}
                className={`flex flex-1 items-center gap-2.5 rounded-xl border p-4 text-left text-sm font-bold ${
                  selected
                    ? "bg-secondary border-primary text-primary"
                    : "bg-card border-border"
                }`}
              >
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-md ${
                    selected ? "bg-primary" : "bg-card border-border border"
                  }`}
                >
                  {selected ? <Check aria-hidden="true" size={12} className="text-primary-foreground" /> : null}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
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
                onClick={() => toggle(formats, setFormats, option.label)}
                className={`flex flex-1 flex-col gap-2 rounded-xl border p-4 text-left ${
                  selected
                    ? "bg-secondary border-primary"
                    : "bg-card border-border"
                }`}
              >
                <span
                  className={`flex items-center gap-2.5 text-sm font-bold ${
                    selected ? "text-primary" : "text-foreground"
                  }`}
                >
                  <span
                    className={`flex size-[18px] shrink-0 items-center justify-center rounded-md ${
                      selected ? "bg-primary" : "bg-card border-border border"
                    }`}
                  >
                    {selected ? (
                      <Check aria-hidden="true" size={12} className="text-primary-foreground" />
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
        <div className="flex items-center justify-between">
          <Link
            href="/perfil"
            className="text-primary flex h-[52px] items-center text-sm font-bold"
          >
            ← Voltar
          </Link>
          <Link
            href="/perfil/experiencia"
            className="bg-primary text-primary-foreground flex h-[52px] items-center gap-2 rounded-xl px-5 text-sm font-extrabold"
          >
            Salvar e continuar →
          </Link>
        </div>
        <p className="text-muted-foreground text-xs">
          Você pode salvar e sair para continuar depois.
        </p>
      </div>
    </div>
  );
}
