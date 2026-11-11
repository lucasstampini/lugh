import Image from "next/image";
import { DemoTimer } from "./demo-timer";
import { BoardArrows, Caret, DemoCursor, Kw, LineAuthor, LineNo, LiveDot } from "./parts";

// Composição decorativa da sala: vídeo, editor e quadro sobrepostos. Usada no
// hero da landing e no painel direito do login. O conteúdo é ilustrativo.
export function RoomCollage() {
  return (
    <div className="grid w-full grid-cols-12">
      <div className="pop edge bg-card relative z-[2] col-start-6 col-end-13 row-start-1 -mb-[30px] flex flex-col gap-2.5 rounded-[14px] p-2.5 [animation-delay:.15s]">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="edge relative aspect-[4/3] overflow-hidden rounded-[9px]">
            <Image
              src="/illustrations/camila.svg"
              alt="Ilustração da entrevistadora Camila"
              width={400}
              height={360}
              className="size-full object-cover"
            />
            <span className="edge bg-primary text-ink absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-px font-mono text-[11px] font-bold">
              Camila
            </span>
          </div>
          <div className="edge relative aspect-[4/3] overflow-hidden rounded-[9px]">
            <Image
              src="/illustrations/candidato.svg"
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
        <div className="flex items-center justify-between gap-2 px-0.5 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5">
            <LiveDot />
            ao vivo
          </span>
          <DemoTimer />
        </div>
      </div>

      <div className="pop edge bg-code col-start-1 col-end-11 row-start-2 overflow-hidden rounded-[14px] [animation-delay:.3s]">
        <div className="border-code-border flex items-center justify-between border-b px-4 py-2.5 font-mono text-xs">
          <span className="text-code-muted">&lt;/&gt; dois_somam.py</span>
          <span className="text-primary">Python</span>
        </div>
        <div className="text-code-foreground overflow-hidden px-4 pt-3.5 pb-[18px] font-mono text-[clamp(11px,1vw,13px)] leading-[1.75] whitespace-pre">
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
          <div className="bg-code-line -mx-4 px-4">
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
      </div>

      <div className="pop edge bg-card relative z-[2] col-start-4 col-end-13 row-start-3 -mt-[34px] rounded-[14px] px-3.5 pt-3 pb-4 [animation-delay:.45s]">
        <div className="mb-2.5 flex items-center justify-between font-mono text-xs">
          <span className="font-bold">quadro</span>
          <span className="text-muted-foreground">system design</span>
        </div>
        <div className="bg-dots bg-secondary relative rounded-[10px] px-3.5 pt-4 pb-3.5 [background-size:18px_18px]">
          <div className="grid grid-cols-3 gap-[26px] text-[13px] font-bold">
            <div className="edge bg-card rounded-[9px] px-2.5 py-[9px]">Cliente</div>
            <div className="edge bg-primary text-ink relative rounded-[9px] px-2.5 py-[9px]">
              API
              <BoardArrows gap="sm" />
            </div>
            <div className="edge bg-card rounded-[9px] px-2.5 py-[9px]">Banco</div>
            <div className="pop edge-dashed bg-card col-start-2 rounded-[9px] px-2.5 py-[9px] [animation-delay:4.4s]">
              Cache
            </div>
          </div>
          <DemoCursor name="Camila" tone="interviewer" className="drift-a top-[46%] left-[12%]" />
          <DemoCursor name="Você" tone="candidate" className="drift-b top-[62%] left-[62%]" />
        </div>
      </div>
    </div>
  );
}
