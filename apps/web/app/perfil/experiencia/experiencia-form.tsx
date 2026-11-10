"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const DEFAULT_SKILLS = ["JavaScript", "Node.js", "SQL"];

// Etapa 3 ("Experiência e prática", Figma node 47:120) é só visual por
// enquanto: curso, situação da formação, experiência e habilidades não têm
// coluna no banco ainda. "Salvar e continuar" só navega pra próxima etapa.
export function ExperienciaForm() {
  const [hasExperience, setHasExperience] = useState(false);
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
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
      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
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
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          Sua experiência na área
        </h3>

        <div className="flex flex-col gap-3 sm:flex-row">
          {[
            { value: false, label: "Ainda não trabalhei na área" },
            { value: true, label: "Já tenho experiência" },
          ].map((option) => {
            const selected = option.value === hasExperience;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setHasExperience(option.value)}
                className={`flex flex-1 items-center gap-2 rounded-xl border p-3.5 text-left text-sm font-bold ${
                  selected
                    ? "bg-secondary border-primary text-primary"
                    : "bg-card border-border"
                }`}
              >
                {selected ? "✓" : "○"} {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-[11px]">
          Sem problemas. O treino é justamente para ajudar você a dar esse
          primeiro passo.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
        <h3 className="font-heading text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          O que você já está praticando?
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="bg-secondary text-primary rounded-[10px] px-3.5 py-2 text-xs font-bold"
            >
              {skill}
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
              placeholder="Nome da habilidade"
              className="border-input bg-card h-9 w-40 rounded-[10px] border px-3 text-xs outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingSkill(true)}
              className="border-input bg-card text-primary flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-xs font-bold"
            >
              <Plus aria-hidden="true" size={13} />
              Adicionar habilidade
            </button>
          )}
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-[18px] rounded-[20px] border p-6">
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
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="border-input bg-card h-[50px] rounded-md border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href="/perfil/objetivo"
            className="text-primary flex h-[52px] items-center text-sm font-bold"
          >
            ← Voltar
          </Link>
          <Link
            href="/perfil/revisar"
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
