import { Mic, MonitorUp, MousePointer2, Pencil, Square, Type, Video } from "lucide-react";
import Image from "next/image";
import { Caret, DemoCursor, Kw, LineAuthor, LineNo } from "./parts";

// Composição decorativa da sala: vídeo, editor e quadro, espalhados em
// diagonal. Usada no hero da landing e no painel direito do login. O
// conteúdo é ilustrativo. Cada card imita a interface real da sala com a
// mesma linguagem do produto: borda de tinta, mono nos rótulos, amarelo no
// que está ativo.

const CARD =
  "pop edge relative rounded-[14px] shadow-[7px_7px_0_var(--border)]";

// Seta reta do diagrama, em SVG, para não depender do glifo da fonte.
function Arrow({ direction, className }: { direction: "right" | "down"; className?: string }) {
  const rotate = direction === "down" ? "rotate-90" : "";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 12"
      className={`text-ink absolute h-3 w-6 ${rotate} ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 6h20M16 1l5 5-5 5" />
    </svg>
  );
}

function CallButton({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Mic;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`edge flex size-7 items-center justify-center rounded-full ${
        active ? "bg-primary text-ink" : "bg-card text-ink"
      }`}
    >
      <Icon size={13} strokeWidth={2.2} />
    </span>
  );
}

function BoardTool({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Pencil;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`edge flex size-6 items-center justify-center rounded-md ${
        active ? "bg-primary" : "bg-card"
      }`}
    >
      <Icon size={12} strokeWidth={2.2} />
    </span>
  );
}

export function RoomCollage() {
  return (
    <div className="flex w-full flex-col gap-[clamp(8px,1.4vw,18px)]">
      {/* Vídeo: duas câmeras lado a lado e a barra de controles da chamada. */}
      <div className={`${CARD} bg-card flex w-full self-stretch rotate-0 md:w-[50%] md:self-end md:rotate-[1.4deg] flex-col gap-2.5 p-2.5 [animation-delay:.15s]`}>
        <div className="flex items-center justify-between px-0.5 font-mono text-[11px]">
          <span className="font-bold">sala</span>
          <span className="text-muted-foreground">técnica com código</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="edge relative aspect-[4/3] overflow-hidden rounded-[9px]">
            <Image
              src="/illustrations/camila-retrato-editorial.png"
              alt="Ilustração da entrevistadora Camila"
              width={400}
              height={360}
              className="size-full object-cover"
            />
            <span className="edge bg-brand-deep absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-px font-mono text-[11px] font-bold text-white">
              Camila
            </span>
          </div>
          <div className="edge relative aspect-[4/3] overflow-hidden rounded-[9px]">
            <Image
              src="/illustrations/candidato-editorial.svg"
              alt="Ilustração do candidato"
              width={400}
              height={360}
              className="size-full object-cover"
            />
            <span className="edge bg-card text-ink absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-px font-mono text-[11px] font-bold">
              Você
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-0.5">
          <CallButton icon={Mic} label="Microfone ligado" active />
          <CallButton icon={Video} label="Câmera ligada" active />
          <CallButton icon={MonitorUp} label="Compartilhar tela" />
        </div>
      </div>

      {/* Editor: aba do arquivo, código com a linha ativa e a barra de status. */}
      <div className={`${CARD} bg-code w-full self-stretch rotate-0 md:w-[64%] md:self-start md:-rotate-[1.1deg] overflow-hidden [animation-delay:.3s]`}>
        <div className="border-code-border flex items-center justify-between border-b pr-4 font-mono text-xs">
          <div className="flex items-stretch">
            <span className="bg-code-line text-code-foreground border-code-border flex items-center gap-1.5 border-r px-3.5 py-2.5">
              <span className="bg-primary size-1.5 rounded-full" />
              dois_somam.py
            </span>
            <span className="text-code-muted flex items-center px-3 py-2.5">+</span>
          </div>
          <span className="text-primary">Python</span>
        </div>

        <div className="text-code-foreground overflow-hidden px-4 pt-3.5 pb-3.5 font-mono text-[clamp(11px,1vw,13px)] leading-[1.75] whitespace-pre">
          <div>
            <LineNo>{"1  "}</LineNo>
            <Kw>def</Kw> dois_somam(nums, alvo):
          </div>
          <div>
            <LineNo>{"2  "}</LineNo>
            {"    vistos = {}"}
          </div>
          <div>
            <LineNo>{"3  "}</LineNo>
            {"    "}
            <Kw>for</Kw> i, n <Kw>in</Kw> enumerate(nums):
          </div>
          <div className="bg-code-line border-primary -mx-4 border-l-2 px-4 pl-[14px]">
            <LineNo>{"4  "}</LineNo>
            <span className="type-in [animation-delay:1s]">{"        falta = alvo - n"}</span>
            <Caret /> <LineAuthor name="Você" tone="candidate" />
          </div>
          <div>
            <LineNo>{"5  "}</LineNo>
            <span className="type-in text-code-muted [animation-delay:3s]">
              {"        # e se o par já foi visto?"}
            </span>
            <Caret className="bg-primary [animation-delay:.4s]" />{" "}
            <LineAuthor name="Camila" tone="interviewer" />
          </div>
        </div>

        <div className="border-code-border text-code-muted flex items-center justify-between border-t px-4 py-1.5 font-mono text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-primary size-1.5 rounded-full" />
            sincronizado
          </span>
          <span>Ln 4, Col 24 · UTF-8</span>
        </div>
      </div>

      {/* Quadro: barra de ferramentas, diagrama com setas de verdade e os
          dois cursores. */}
      <div className={`${CARD} bg-card w-full self-stretch rotate-0 md:w-[64%] md:self-end md:rotate-[0.7deg] px-3.5 pt-3 pb-3.5 [animation-delay:.45s]`}>
        <div className="mb-2.5 flex items-center justify-between font-mono text-xs">
          <span className="font-bold">quadro</span>
          <span className="text-muted-foreground">system design</span>
        </div>

        <div className="bg-dots bg-secondary edge relative rounded-[10px] py-4 pr-3.5 pl-12 [background-size:18px_18px]">
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            <BoardTool icon={MousePointer2} label="Selecionar" />
            <BoardTool icon={Square} label="Retângulo" active />
            <BoardTool icon={Pencil} label="Desenho livre" />
            <BoardTool icon={Type} label="Texto" />
          </div>

          <div className="font-heading grid grid-cols-3 gap-x-8 gap-y-[26px] text-[12px] font-bold">
            <div className="edge bg-card rounded-[9px] px-2.5 py-[9px]">Cliente</div>
            <div className="edge bg-primary text-ink relative rounded-[9px] px-2.5 py-[9px]">
              API
              <Arrow direction="right" className="top-1/2 -left-[30px] -translate-y-1/2" />
              <Arrow direction="right" className="top-1/2 -right-[30px] -translate-y-1/2" />
              <Arrow direction="down" className="-bottom-[26px] left-1/2 -translate-x-1/2" />
            </div>
            <div className="edge bg-card rounded-[9px] px-2.5 py-[9px]">Banco</div>
            <div className="pop edge-dashed bg-card col-start-2 rounded-[9px] px-2.5 py-[9px] [animation-delay:4.4s]">
              Cache
            </div>
          </div>

          <span className="text-muted-foreground absolute right-2.5 bottom-2 font-mono text-[10px]">
            100%
          </span>

          <DemoCursor name="Camila" tone="interviewer" className="drift-a top-[44%] left-[22%]" />
          <DemoCursor name="Você" tone="candidate" className="drift-b top-[60%] left-[64%]" />
        </div>
      </div>
    </div>
  );
}
