import {
  Camera,
  Mic,
  MousePointer2,
  Pencil,
  Square,
  Type,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import { BlinkingEyes } from "@/components/motion/blinking-eyes";
import { FadeIn } from "@/components/motion/fade-in";
import { WanderingCursor } from "@/components/motion/wandering-cursor";

// Linhas reais do editor, igual ao mock do Figma (node 30:2345). Linha 2
// (índice 2, "const cache...") é a linha ativa, com highlight e cursor.
const CODE_LINES = [
  { text: "// Agrupe sua ideia antes de implementar", dim: true },
  { text: "async function buscarPerfil(id) {", dim: false },
  { text: "  const cache = await memoria.get(id);", dim: false, active: true },
  { text: "  if (cache) return cache;", dim: false },
  { text: "", dim: false },
  { text: "  const perfil = await banco.buscar(id);", dim: false },
  { text: "  await memoria.set(id, perfil);", dim: false },
  { text: "  return perfil;", dim: false },
  { text: "}", dim: false },
];

const BOARD_TOOLS = [MousePointer2, Pencil, Square, Type, Undo2];

// Pontos (em % do container) de cada nó do quadro, pros dois cursores
// colaborativos passearem entre eles (cores reais do produto: entrevistador
// em Índigo claro, candidato em Lume).
const CAMILA_CURSOR_PATH = [
  { x: 20, y: 20 },
  { x: 80, y: 20 },
  { x: 80, y: 75 },
  { x: 20, y: 20 },
];
const CANDIDATE_CURSOR_PATH = [
  { x: 50, y: 75 },
  { x: 20, y: 20 },
  { x: 80, y: 20 },
  { x: 50, y: 75 },
];

// Mockup da sala pra landing, com o conteúdo real do design (Figma node
// 30:2345): webcam com legenda, pergunta ao vivo, editor com código real e
// quadro de system design com os nós Cliente, API, Banco e Cache.
export function RoomPreview() {
  return (
    <div className="dark bg-card text-foreground flex flex-col gap-6 rounded-[24px] p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex w-full flex-col gap-3 sm:w-52 sm:shrink-0">
          <div
            className="relative overflow-hidden rounded-2xl bg-secondary"
            style={{ aspectRatio: "208 / 182" }}
          >
            <Image
              src="/illustrations/camila-retrato-editorial.png"
              alt="Camila, a entrevistadora"
              fill
              className="object-cover"
              unoptimized
            />
            <BlinkingEyes />

            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-card/80 px-2.5 py-1">
              <span className="size-2 animate-pulse rounded-full bg-destructive" />
              <span className="text-xs font-bold text-foreground">REC</span>
            </div>

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-card/90">
                <Mic aria-hidden="true" size={14} className="text-muted-foreground" />
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-card/90">
                <Camera aria-hidden="true" size={14} className="text-muted-foreground" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-background p-4">
            <p className="font-heading text-sm leading-snug font-extrabold text-foreground">
              &ldquo;Como você desenharia esse sistema?&rdquo;
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="font-mono text-xs font-bold text-muted-foreground">
              {"</>"} solucao.js
            </span>
            <span className="text-xs font-medium text-indigo-light">JavaScript</span>
          </div>

          <div className="flex flex-col gap-0.5 overflow-x-auto px-5 py-4 font-mono text-[11px] leading-[19px]">
            {CODE_LINES.map((line, index) => (
              <FadeIn key={index} index={index} large>
                <div
                  className={`flex gap-4 rounded px-2 ${
                    line.active ? "bg-indigo/25" : ""
                  }`}
                >
                  <span className="w-3 shrink-0 text-right text-muted-foreground/60">
                    {index + 1}
                  </span>
                  <span
                    className={`whitespace-pre ${line.dim ? "text-muted-foreground/60" : "text-foreground"}`}
                  >
                    {line.text}
                    {line.active ? (
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-foreground align-middle" />
                    ) : null}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-background p-5">
        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-bold text-foreground">
            Quadro branco
          </span>
          <div className="hidden items-center gap-3 sm:flex">
            {BOARD_TOOLS.map((Icon, index) => (
              <Icon
                key={index}
                aria-hidden="true"
                size={14}
                className="text-muted-foreground/60"
              />
            ))}
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-xl p-6"
          style={{
            backgroundImage:
              "radial-gradient(var(--secondary) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-3">
            <FadeIn index={0} large className="rounded-xl bg-secondary p-3.5">
              <p className="font-heading text-sm font-bold text-foreground">Cliente</p>
              <p className="text-[11px] text-muted-foreground">Interface web</p>
            </FadeIn>

            <FadeIn
              index={1}
              large
              className="bg-indigo relative rounded-xl p-3.5"
            >
              <p className="font-heading text-sm font-bold text-foreground">API</p>
              <p className="text-[11px] text-foreground">Serviço de aplicação</p>

              <span className="absolute top-1/2 -right-7 hidden -translate-y-1/2 text-indigo-light sm:block">
                →
              </span>
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-indigo-light">
                ↓
              </span>
            </FadeIn>

            <FadeIn index={2} large className="rounded-xl bg-secondary p-3.5">
              <p className="font-heading text-sm font-bold text-foreground">Banco de dados</p>
              <p className="text-[11px] text-muted-foreground">Persistência</p>
            </FadeIn>

            <FadeIn index={3} large className="rounded-xl bg-secondary p-3.5 sm:col-start-2">
              <p className="font-heading text-sm font-bold text-foreground">Cache</p>
              <p className="text-[11px] text-muted-foreground">Acesso rápido</p>
            </FadeIn>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <WanderingCursor
              points={CAMILA_CURSOR_PATH}
              color="var(--indigo-light)"
              label="Camila"
              duration={9}
            />
            <WanderingCursor
              points={CANDIDATE_CURSOR_PATH}
              color="var(--lume)"
              label="Você"
              labelTextColor="var(--lume-foreground)"
              duration={7}
              delay={1.2}
            />
          </div>
        </div>

        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span className="font-bold text-indigo-light">− 100% +</span>
        </div>
      </div>
    </div>
  );
}
