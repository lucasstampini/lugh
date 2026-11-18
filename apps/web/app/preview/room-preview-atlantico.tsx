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
import { WanderingCursor } from "@/components/motion/wandering-cursor";

// Mesmo mockup animado do componentes/room-preview.tsx da landing real
// (código digitando, cursores colaborativos no quadro), só recolorido pra
// Atlântico & Coral em vez de Índigo/Noite. Cópia local de propósito: o
// componente real é compartilhado com a landing de verdade, não dá pra
// trocar a cor dele sem mudar o site inteiro.
//
// Paleta só com cores já usadas no resto da página (navy #142C52/#182D4D,
// azul #2451A4, coral #FF8A70, apoio #E8EDF8/#3B5276), pra não ficar um
// mix de tons inventados que não conversam com o resto.
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

export function RoomPreviewAtlantico() {
  return (
    <div className="flex flex-col gap-6 rounded-[24px] bg-[#3B5276] p-6 lg:p-8">
      {/* Webcam + pergunta, numa fileira só pra cima (não disputa espaço
          com o editor, que agora fica numa linha própria, largura cheia). */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="relative shrink-0 overflow-hidden rounded-2xl bg-[#182D4D]"
          style={{ width: 160, aspectRatio: "208 / 182" }}
        >
          <Image
            src="/illustrations/camila-retrato-editorial.png"
            alt="Camila, a entrevistadora"
            fill
            className="object-cover"
            unoptimized
          />
          <BlinkingEyes />

          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-[#182D4D]/80 px-2 py-1">
            <span className="size-1.5 animate-pulse rounded-full bg-[#FF8A70]" />
            <span className="text-[10px] font-bold text-white">REC</span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#182D4D]/90">
              <Mic aria-hidden="true" size={11} className="text-[#E8EDF8]" />
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-[#182D4D]/90">
              <Camera aria-hidden="true" size={11} className="text-[#E8EDF8]" />
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center rounded-2xl bg-[#182D4D] p-4">
          <p className="font-heading text-sm leading-snug font-extrabold text-white">
            &ldquo;Como você desenharia esse sistema?&rdquo;
          </p>
        </div>
      </div>

      {/* Editor de código, largura cheia do card. */}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[#182D4D]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <span className="text-xs font-bold text-white/60">
            {"</>"} solucao.js
          </span>
          <span className="text-xs font-medium text-[#FF8A70]">JavaScript</span>
        </div>

        <div className="flex flex-col gap-0.5 overflow-x-auto px-5 py-4 text-[13px] leading-[22px]">
          {CODE_LINES.map((line, index) => (
            <div
              key={index}
              className={`flex gap-4 rounded px-2 ${
                line.active ? "bg-[#2451A4]/30" : ""
              }`}
            >
              <span className="w-4 shrink-0 text-right text-white/35">
                {index + 1}
              </span>
              <span
                className={`whitespace-pre ${line.dim ? "text-white/35" : "text-[#E8EDF8]"}`}
              >
                {line.text}
                {line.active ? (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#FF8A70] align-middle" />
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-[#E8EDF8] p-5">
        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-bold text-[#182D4D]">Quadro branco</span>
          <div className="hidden items-center gap-3 sm:flex">
            {BOARD_TOOLS.map((Icon, index) => (
              <Icon
                key={index}
                aria-hidden="true"
                size={14}
                className="text-[#626C7D]"
              />
            ))}
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-xl bg-white p-6"
          style={{
            backgroundImage: "radial-gradient(#CCD6E5 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E7E2DF] bg-white p-3.5">
              <p className="font-heading text-sm font-bold text-[#182D4D]">Cliente</p>
              <p className="text-[11px] text-[#626C7D]">Interface web</p>
            </div>

            <div className="relative rounded-xl bg-[#FF8A70] p-3.5">
              <p className="font-heading text-sm font-bold text-[#142C52]">API</p>
              <p className="text-[11px] text-[#142C52]/70">Serviço de aplicação</p>

              <span className="absolute top-1/2 -left-7 hidden -translate-y-1/2 text-[#2451A4] sm:block">
                →
              </span>
              <span className="absolute top-1/2 -right-7 hidden -translate-y-1/2 text-[#2451A4] sm:block">
                →
              </span>
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[#2451A4]">
                ↓
              </span>
            </div>

            <div className="rounded-xl border border-[#E7E2DF] bg-white p-3.5">
              <p className="font-heading text-sm font-bold text-[#182D4D]">Banco de dados</p>
              <p className="text-[11px] text-[#626C7D]">Persistência</p>
            </div>

            <div className="rounded-xl border border-[#E7E2DF] bg-white p-3.5 sm:col-start-2">
              <p className="font-heading text-sm font-bold text-[#182D4D]">Cache</p>
              <p className="text-[11px] text-[#626C7D]">Acesso rápido</p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <WanderingCursor
              points={CAMILA_CURSOR_PATH}
              color="#2451A4"
              label="Camila"
              labelTextColor="#FFFFFF"
              duration={9}
            />
            <WanderingCursor
              points={CANDIDATE_CURSOR_PATH}
              color="#FF8A70"
              label="Você"
              labelTextColor="#142C52"
              duration={7}
              delay={1.2}
            />
          </div>
        </div>

        <div className="flex items-center justify-end text-xs text-[#626C7D]">
          <span className="font-bold text-[#FF8A70]">− 100% +</span>
        </div>
      </div>
    </div>
  );
}
