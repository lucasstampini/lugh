"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { NotSavedNote } from "../wizard-parts";

// Etapa 3 ("Experiência e prática", Figma node 47:120) é só visual por
// enquanto: curso, situação da formação, experiência e habilidades não têm
// coluna no banco ainda. "Continuar" só navega pra próxima etapa, e por isso
// nada vem preenchido de início.
export function ExperienciaForm() {
  const [hasExperience, setHasExperience] = useState<boolean | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  function addSkill() {
    const value = newSkill.trim();
    if (value && !skills.includes(value)) {
      setSkills([...skills, value]);
    }
    setNewSkill("");
    setAddingSkill(false);
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border-[1.5px] p-6">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          Onde você está aprendendo?
        </h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="course" className="text-xs font-bold">
              Curso
            </label>
            <input
              id="course"
              name="course"
              placeholder="Sistemas de Informação"
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="institution" className="text-xs font-bold">
              Instituição de ensino
            </label>
            <input
              id="institution"
              name="institution"
              placeholder="Faculdade Horizonte"
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="status" className="text-xs font-bold">
              Situação da formação
            </label>
            <input
              id="status"
              name="status"
              placeholder="Cursando · 6º semestre"
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="graduation" className="text-xs font-bold">
              Conclusão prevista
            </label>
            <input
              id="graduation"
              name="graduation"
              placeholder="Dezembro de 2027"
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border-[1.5px] p-6">
        <h3
          id="experience-label"
          className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]"
        >
          Sua experiência na área
        </h3>

        <div
          role="radiogroup"
          aria-labelledby="experience-label"
          className="flex flex-col gap-3 sm:flex-row"
        >
          {[
            { value: false, label: "Ainda não trabalhei na área" },
            { value: true, label: "Já tenho experiência" },
          ].map((option) => {
            const selected = option.value === hasExperience;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setHasExperience(option.value)}
                className={`flex flex-1 items-center gap-2 rounded-xl border-[1.5px] p-3.5 text-left text-sm font-bold ${
                  selected
                    ? "bg-secondary border-ink text-brand-deep"
                    : "bg-card border-border"
                }`}
              >
                <span aria-hidden="true">{selected ? "✓" : "○"}</span> {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-[11px]">
          Sem problemas. O treino é justamente para ajudar você a dar esse
          primeiro passo.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border-[1.5px] p-6">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          O que você já está praticando?
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="bg-accent text-ink flex items-center gap-1 rounded-[10px] py-1 pr-1 pl-3.5 text-xs font-bold"
            >
              {skill}
              <button
                type="button"
                aria-label={`Remover ${skill}`}
                onClick={() => setSkills(skills.filter((item) => item !== skill))}
                className="hover:bg-card flex size-7 items-center justify-center rounded-md"
              >
                <X aria-hidden="true" size={13} />
              </button>
            </span>
          ))}

          {addingSkill ? (
            <input
              autoFocus
              value={newSkill}
              onChange={(event) => setNewSkill(event.target.value)}
              onBlur={addSkill}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              aria-label="Nome da habilidade"
              placeholder="Nome da habilidade"
              className="border-border bg-card focus-visible:ring-ring h-9 w-40 rounded-[10px] border-[1.5px] px-3 text-xs outline-none focus-visible:ring-2"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingSkill(true)}
              className="border-border bg-card text-brand-deep flex items-center gap-1.5 rounded-[10px] border-[1.5px] px-3.5 py-2 text-xs font-bold"
            >
              <Plus aria-hidden="true" size={13} />
              Adicionar habilidade
            </button>
          )}
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border-[1.5px] p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            Um projeto que mostra seu jeito
          </h3>
          <p className="text-muted-foreground text-xs">
            Opcional · Pode ser da faculdade, pessoal ou em grupo. Não
            precisa estar perfeito.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="project" className="text-xs font-bold">
              Nome do projeto
            </label>
            <input
              id="project"
              name="project"
              placeholder="API de organização de estudos"
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="projectLink" className="text-xs font-bold">
              Link do projeto ou portfólio
            </label>
            <input
              id="projectLink"
              name="projectLink"
              placeholder="Adicionar link do GitHub ou portfólio"
              className="border-border bg-card h-[50px] rounded-md border-[1.5px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <NotSavedNote />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/perfil/objetivo"
            className="text-brand-deep flex min-h-[52px] items-center text-sm font-bold"
          >
            ← Voltar
          </Link>
          <Link
            href="/perfil/revisar"
            className={buttonVariants({ className: "h-[52px] px-5" })}
          >
            Continuar →
          </Link>
        </div>
      </div>
    </div>
  );
}
