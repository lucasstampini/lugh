import { ArrowRight, Check, Mic, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CodeAccent, CodeBlock, CodeMuted } from "@/components/code-block";
import { DemoTimer } from "@/components/demo/demo-timer";
import { BoardArrows, Caret, DemoCursor, Kw, LineNo, LiveDot } from "@/components/demo/parts";
import { RoomCollage } from "@/components/demo/room-collage";
import { Eyebrow } from "@/components/eyebrow";
import { LandingHeaderActions } from "@/components/landing-header-actions";
import { buttonVariants } from "@/components/ui/button";

// Tudo nesta página é ilustrativo (perfis, horários, preços, feedback): serve
// para mostrar como o produto funciona. Os dados reais ficam em /entrevistadores.

const DEMO_PEOPLE = [
  {
    name: "Camila Ribeiro",
    role: "Engenheira de software sênior · Fintech de grande porte",
    slot: "qua, 18 nov · 19h",
    image: "/illustrations/camila.svg",
    selected: true,
  },
  {
    name: "Rafael Nascimento",
    role: "Desenvolvedor front-end sênior · Plataforma de educação",
    slot: "qui, 19 nov · 18h",
    image: "/illustrations/rafael.svg",
    selected: false,
  },
  {
    name: "Beatriz Costa",
    role: "Engenheira de dados sênior · Varejo online",
    slot: "sex, 20 nov · 10h",
    image: "/illustrations/beatriz.svg",
    selected: false,
  },
];

// Agenda de exemplo: uma linha por faixa de horário, uma coluna por dia.
// "busy" = ocupado (tracejado), "picked" = o horário escolhido.
type SlotState = "free" | "busy" | "picked";
const WEEK_DAYS = ["seg", "ter", "qua", "qui", "sex"];
const WEEK_SLOTS: { label: string; state: SlotState }[][] = [
  [
    { label: "18h", state: "busy" },
    { label: "18h", state: "free" },
    { label: "18h", state: "free" },
    { label: "18h", state: "busy" },
    { label: "10h", state: "free" },
  ],
  [
    { label: "19h", state: "free" },
    { label: "19h", state: "busy" },
    { label: "19h", state: "picked" },
    { label: "19h", state: "free" },
    { label: "14h", state: "busy" },
  ],
  [
    { label: "20h", state: "busy" },
    { label: "20h", state: "free" },
    { label: "20h", state: "busy" },
    { label: "20h", state: "free" },
    { label: "18h", state: "free" },
  ],
  [
    { label: "21h", state: "free" },
    { label: "21h", state: "busy" },
    { label: "21h", state: "free" },
    { label: "21h", state: "busy" },
    { label: "19h", state: "free" },
  ],
];

const SLOT_CLASS: Record<SlotState, string> = {
  free: "edge",
  busy: "border-border-dashed text-muted-foreground border-[1.5px] border-dashed",
  picked: "pop edge bg-primary font-bold [animation-delay:.8s]",
};

const FEEDBACK_SCORES = [
  { label: "Resolução de problemas", score: 4 },
  { label: "Comunicação", score: 4 },
  { label: "Qualidade de código", score: 3 },
  { label: "System design", score: 3 },
];

const BOARD_NODES = [
  { title: "Cliente", subtitle: "Interface web" },
  { title: "API", subtitle: "Serviço de aplicação", highlight: true },
  { title: "Banco de dados", subtitle: "Persistência" },
  { title: "Cache", subtitle: "Acesso rápido", second: true },
];

const SECTION = "mx-auto box-border max-w-[1240px] px-[clamp(20px,5vw,48px)]";
const H2 =
  "font-heading text-[clamp(30px,3.5vw,46px)] leading-[1.08] font-extrabold tracking-[-0.02em]";
const NAV_LINK = "text-foreground inline-flex min-h-11 items-center";
const STEP_CARD =
  "rise lift bg-secondary flex min-w-0 flex-col gap-5 rounded-[18px] p-[clamp(20px,2.4vw,32px)]";

function StepHeading({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[13px] font-bold">{number}</span>
      <h3 className="font-heading text-2xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

function Avatar({ src, alt, size }: { src: string; alt: string; size: number }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="edge shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header
        className={`${SECTION} flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-3 py-[18px]`}
      >
        <Link href="/" aria-label="Lugh, página inicial" className="inline-flex min-h-11 items-center">
          <Image src="/brand/lugh-logo.svg" alt="Lugh" width={98} height={34} className="h-[34px] w-auto" />
        </Link>
        <nav
          aria-label="Principal"
          className="flex flex-wrap items-center gap-x-7 gap-y-1 text-[15px] font-semibold"
        >
          <a href="#como-funciona" className={NAV_LINK}>
            Como funciona
          </a>
          <a href="#a-sala" className={NAV_LINK}>
            A sala
          </a>
          <a href="#feedback" className={NAV_LINK}>
            Feedback
          </a>
          <Suspense fallback={null}>
            <LandingHeaderActions />
          </Suspense>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section
          className={`${SECTION} flex flex-wrap items-center gap-x-14 gap-y-12 pt-[clamp(28px,5vw,64px)] pb-[clamp(56px,7vw,96px)]`}
        >
          <div className="flex min-w-0 flex-[1_1_380px] flex-col items-start gap-6">
            <span className="edge bg-card inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-[13px] font-medium">
              <LiveDot />
              entrevista simulada · 1h
            </span>
            <h1 className="font-heading text-[clamp(36px,4.8vw,62px)] leading-[1.04] font-extrabold tracking-[-0.025em]">
              Treine entrevista técnica com quem já trabalha na área
            </h1>
            <p className="text-muted-foreground max-w-[52ch] text-[clamp(16px,1.4vw,19px)]">
              Uma entrevista simulada de 1 hora com um profissional de tecnologia. Você
              programa, desenha a arquitetura e sai com nota por competência.
            </p>
            <Link href="/entrevistadores" className={buttonVariants({ size: "lg", className: "h-[54px] px-[26px]" })}>
              Encontrar um entrevistador
              <ArrowRight aria-hidden="true" />
            </Link>
            <p className="text-muted-foreground font-mono text-[13px]">
              sessões a partir de R$ 30 · PIX · sem mensalidade
            </p>
          </div>

          <div className="bg-dots bg-secondary box-border min-w-0 flex-[1.35_1_440px] rounded-3xl p-[clamp(18px,3vw,40px)]">
            <RoomCollage />
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="edge-t bg-background">
          <div className={`${SECTION} flex flex-col gap-10 py-[clamp(56px,7vw,96px)]`}>
            <div className="rise flex max-w-[720px] flex-col gap-3">
              <Eyebrow>como funciona</Eyebrow>
              <h2 className={H2}>Como agendar sua primeira sessão</h2>
            </div>

            <div className="flex flex-wrap gap-5">
              <article className={`${STEP_CARD} flex-[1.5_1_440px]`}>
                <StepHeading number="01" title="Escolha">
                  Filtre por área e veja a experiência de cada entrevistador.
                </StepHeading>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  <span className="bg-foreground text-background rounded-[7px] px-2.5 py-1">
                    área: todas
                  </span>
                  <span className="edge bg-card rounded-[7px] px-2.5 py-[3px]">
                    experiência: sênior
                  </span>
                  <span className="edge bg-card rounded-[7px] px-2.5 py-[3px]">
                    ordenar: próximo horário
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {DEMO_PEOPLE.map((person) => (
                    <div
                      key={person.name}
                      className={`bg-card flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-xl px-3.5 py-3 ${
                        person.selected ? "edge" : "border-border-soft border-[1.5px]"
                      }`}
                    >
                      <Avatar src={person.image} alt={`Ilustração de ${person.name}`} size={52} />
                      <div className="min-w-0 flex-[1_1_200px]">
                        <p className="font-extrabold">{person.name}</p>
                        <p className="text-muted-foreground text-sm">{person.role}</p>
                      </div>
                      <span className="bg-accent rounded-[7px] px-[9px] py-1 font-mono text-xs">
                        {person.slot}
                      </span>
                      {person.selected ? (
                        <span className="edge bg-primary rounded-[7px] px-[9px] py-[3px] font-mono text-xs font-bold">
                          selecionada
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-[13px]">
                  Perfis ilustrativos, para mostrar como a busca funciona.
                </p>
              </article>

              <article className={`${STEP_CARD} flex-[1_1_320px]`}>
                <StepHeading number="02" title="Agende">
                  Escolha um horário livre na agenda dele.
                </StepHeading>
                <div className="edge bg-card flex flex-1 flex-col gap-3 rounded-xl p-3.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="font-bold">novembro</span>
                    <span className="text-muted-foreground">semana 16 a 20</span>
                  </div>
                  <div className="grid flex-1 grid-cols-5 grid-rows-[auto_repeat(4,minmax(36px,1fr))] gap-1.5 text-center font-mono text-xs">
                    {WEEK_DAYS.map((day) => (
                      <span key={day} className={day === "qua" ? "font-bold" : "text-muted-foreground"}>
                        {day}
                      </span>
                    ))}
                    {WEEK_SLOTS.flatMap((row, rowIndex) =>
                      row.map((slot, dayIndex) => (
                        <span
                          key={`${rowIndex}-${dayIndex}`}
                          className={`flex items-center justify-center rounded-[7px] py-[7px] ${SLOT_CLASS[slot.state]}`}
                        >
                          {slot.label}
                        </span>
                      )),
                    )}
                  </div>
                  <div className="border-border flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-dashed pt-3 font-mono text-xs">
                    <span className="text-muted-foreground">tracejado = ocupado</span>
                    <span className="font-bold">qua, 18 nov · 19h às 19h50</span>
                  </div>
                </div>
              </article>
            </div>

            <div className="flex flex-wrap gap-5">
              <article className={`${STEP_CARD} flex-[1_1_320px]`}>
                <StepHeading number="03" title="Pague por PIX">
                  O pagamento é por PIX. Se o horário está livre, a sessão é confirmada na hora.
                </StepHeading>
                <div className="edge bg-card flex flex-wrap items-center gap-4 rounded-xl p-3.5">
                  <svg
                    role="img"
                    aria-label="Ilustração de um QR code de PIX"
                    width="104"
                    height="104"
                    viewBox="0 0 29 29"
                    className="shrink-0"
                  >
                    <rect width="29" height="29" className="fill-card" />
                    <path
                      className="fill-foreground"
                      d="M0 0h7v7H0zM22 0h7v7h-7zM0 22h7v7H0zM9 0h2v2H9zM13 1h3v1h-3zM18 0h2v3h-2zM9 4h1v3H9zM12 4h2v2h-2zM16 5h4v1h-4zM0 9h3v1H0zM5 9h2v2H5zM9 9h3v3H9zM14 9h1v4h-1zM17 8h3v2h-3zM22 9h2v1h-2zM26 9h3v2h-3zM1 12h2v2H1zM5 13h3v1H5zM11 14h2v2h-2zM16 12h2v3h-2zM20 12h3v1h-3zM24 13h2v3h-2zM0 16h4v1H0zM6 16h3v2H6zM14 16h1v3h-1zM18 17h4v1h-4zM27 15h2v3h-2zM9 20h2v3H9zM13 21h3v2h-3zM18 20h2v2h-2zM22 20h3v3h-3zM27 21h2v1h-2zM9 25h4v1H9zM15 25h2v4h-2zM19 24h2v2h-2zM23 25h2v4h-2zM27 25h2v4h-2zM10 27h3v2h-3z"
                    />
                    <path className="fill-card" d="M1 1h5v5H1zM23 1h5v5h-5zM1 23h5v5H1z" />
                    <path className="fill-foreground" d="M2 2h3v3H2zM24 2h3v3h-3zM2 24h3v3H2z" />
                  </svg>
                  <div className="flex min-w-0 flex-[1_1_140px] flex-col gap-2">
                    <span className="font-heading text-[28px] leading-none font-extrabold tabular-nums">
                      R$ 100,00
                    </span>
                    <span className="text-muted-foreground truncate font-mono text-xs">
                      pix copia e cola: 00020126…
                    </span>
                    <span className="pop edge bg-primary inline-flex items-center gap-1.5 self-start rounded-[7px] px-[9px] py-[3px] font-mono text-xs font-bold [animation-delay:1.4s]">
                      <Check aria-hidden="true" size={13} strokeWidth={3} />
                      pagamento confirmado
                    </span>
                  </div>
                </div>
              </article>

              <article className={`${STEP_CARD} flex-[1.5_1_440px]`}>
                <StepHeading number="04" title="Entre na sala">
                  O link chega por e-mail. Abre no navegador, sem instalar nada.
                </StepHeading>
                <div className="edge bg-card flex flex-1 flex-wrap items-center gap-4 rounded-xl p-3.5">
                  <div className="edge w-[132px] shrink-0 overflow-hidden rounded-[10px]">
                    <Image
                      src="/illustrations/candidato.svg"
                      alt="Prévia da sua câmera, em ilustração"
                      width={400}
                      height={360}
                      className="block w-full"
                    />
                  </div>
                  <CodeBlock className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5 px-4 py-3.5 leading-normal whitespace-normal">
                    <CodeMuted>$ lugh entrar /sala/8c2f</CodeMuted>
                    <span>
                      <CodeAccent>ok</CodeAccent>&nbsp;&nbsp;câmera
                    </span>
                    <span>
                      <CodeAccent>ok</CodeAccent>&nbsp;&nbsp;microfone
                    </span>
                    <span>
                      <CodeAccent>ok</CodeAccent>&nbsp;&nbsp;Camila já está na sala
                      <span
                        aria-hidden="true"
                        className="caret bg-primary ml-1.5 inline-block h-[1.05em] w-2 align-text-bottom"
                      />
                    </span>
                  </CodeBlock>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* A sala */}
        <section id="a-sala" className="edge-t edge-b bg-secondary">
          <div
            className={`${SECTION} flex flex-wrap items-center gap-x-14 gap-y-12 py-[clamp(56px,7vw,96px)]`}
          >
            <div className="rise edge bg-card box-border flex min-w-0 flex-[1.6_1_520px] flex-col gap-3.5 rounded-[22px] p-[clamp(14px,2vw,26px)]">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-mono text-xs">
                <span className="inline-flex items-center gap-2">
                  <LiveDot />
                  Camila Ribeiro · técnica com código
                </span>
                <span className="inline-flex items-center gap-3">
                  <span className="font-bold">
                    <DemoTimer />
                  </span>
                  <span className="edge rounded-[7px] px-[9px] py-[3px]">Encerrar sessão</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-3.5">
                <div className="flex max-w-60 min-w-0 flex-[1_1_180px] flex-col gap-3">
                  <div className="edge relative overflow-hidden rounded-[14px]">
                    <Image
                      src="/illustrations/camila.svg"
                      alt="Ilustração da entrevistadora Camila em vídeo"
                      width={400}
                      height={360}
                      className="block w-full"
                    />
                    <div aria-hidden="true" className="absolute bottom-2.5 left-2.5 flex gap-1.5">
                      <span className="bg-code text-code-foreground flex size-[30px] items-center justify-center rounded-full">
                        <Mic size={14} />
                      </span>
                      <span className="bg-code text-code-foreground flex size-[30px] items-center justify-center rounded-full">
                        <Video size={14} />
                      </span>
                    </div>
                  </div>
                  <div className="bg-code text-code-foreground font-heading rounded-[14px] p-3.5 text-[15px] leading-[1.3] font-bold">
                    “Como você desenharia esse sistema?”
                  </div>
                </div>

                <div className="bg-code text-code-foreground min-w-0 flex-[2_1_300px] overflow-hidden rounded-[14px]">
                  <div className="border-code-border flex items-center justify-between border-b px-4 py-[11px] font-mono text-xs">
                    <span className="text-code-muted font-bold">&lt;/&gt; solucao.js</span>
                    <span className="text-primary">JavaScript</span>
                  </div>
                  <div className="overflow-x-auto px-4 py-3.5 font-mono text-xs leading-[1.75] whitespace-pre">
                    <div>
                      <LineNo>{"1  // Agrupe sua ideia antes de implementar"}</LineNo>
                    </div>
                    <div>
                      <LineNo>{"2  "}</LineNo>
                      <Kw>async function</Kw>
                      {" buscarPerfil(id) {"}
                    </div>
                    <div className="bg-code-line -mx-4 px-4">
                      <LineNo>{"3  "}</LineNo>
                      {"  "}
                      <Kw>const</Kw> cache = <Kw>await</Kw> memoria.get(id);
                      <Caret />
                    </div>
                    <div>
                      <LineNo>{"4  "}</LineNo>
                      {"  "}
                      <Kw>if</Kw> (cache) <Kw>return</Kw> cache;
                    </div>
                    <div>
                      <LineNo>{"5  "}</LineNo>
                    </div>
                    <div>
                      <LineNo>{"6  "}</LineNo>
                      {"  "}
                      <Kw>const</Kw> perfil = <Kw>await</Kw> banco.buscar(id);
                    </div>
                    <div>
                      <LineNo>{"7  "}</LineNo>
                      {"  "}
                      <Kw>await</Kw> memoria.set(id, perfil);
                    </div>
                    <div>
                      <LineNo>{"8  "}</LineNo>
                      {"  "}
                      <Kw>return</Kw> perfil;
                    </div>
                    <div>
                      <LineNo>{"9  "}</LineNo>
                      {"}"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="edge bg-secondary flex flex-col gap-3 rounded-[14px] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-heading font-bold">Quadro branco</span>
                  <span className="text-muted-foreground font-mono text-xs">100%</span>
                </div>
                <div className="bg-dots bg-card border-border-soft relative rounded-xl border-[1.5px] p-[clamp(14px,2vw,24px)] [background-size:24px_24px]">
                  <div className="grid grid-cols-3 gap-x-[clamp(22px,3vw,40px)] gap-y-9">
                    {BOARD_NODES.map((node) => (
                      <div
                        key={node.title}
                        className={`edge relative rounded-xl p-3 ${
                          node.highlight ? "bg-primary text-ink" : "bg-card"
                        } ${node.second ? "col-start-2" : ""}`}
                      >
                        <p className="font-heading text-sm font-bold">{node.title}</p>
                        <p className={`text-xs ${node.highlight ? "" : "text-muted-foreground"}`}>
                          {node.subtitle}
                        </p>
                        {node.highlight ? <BoardArrows gap="lg" /> : null}
                      </div>
                    ))}
                  </div>
                  <DemoCursor name="Camila" tone="interviewer" className="drift-a top-[22%] left-[24%]" />
                  <DemoCursor name="Você" tone="candidate" className="drift-b top-[66%] left-[70%]" />
                </div>
              </div>
            </div>

            <div className="rise flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
              <Eyebrow>a sala</Eyebrow>
              <h2 className={H2}>Vídeo, código e quadro na mesma tela</h2>
              <p className="text-muted-foreground text-[17px]">
                Você escreve o código e o entrevistador acompanha em tempo real. Na parte de
                system design, os dois desenham a arquitetura no mesmo quadro.
              </p>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section id="feedback" className="bg-background">
          <div
            className={`${SECTION} flex flex-wrap items-center gap-x-16 gap-y-12 py-[clamp(56px,7vw,96px)]`}
          >
            <div className="rise flex min-w-0 flex-[1_1_340px] flex-col gap-[18px]">
              <Eyebrow>o feedback</Eyebrow>
              <h2 className={H2}>Você sai sabendo o que melhorar</h2>
              <p className="text-muted-foreground max-w-[46ch] text-[17px]">
                Depois da sessão, o entrevistador preenche um feedback com nota para cada
                competência e comentários sobre o que você fez na entrevista.
              </p>
            </div>

            <div className="rise edge bg-card box-border flex min-w-0 flex-[1.3_1_420px] flex-col gap-[22px] rounded-[18px] p-[clamp(18px,2.4vw,30px)]">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar src="/illustrations/camila.svg" alt="Ilustração de Camila Ribeiro" size={46} />
                <div className="min-w-0 flex-[1_1_180px]">
                  <p className="font-extrabold">Resultado da sessão</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    Camila Ribeiro · qua, 18 nov · 1h
                  </p>
                </div>
                <span className="bg-accent rounded-[7px] px-[9px] py-1 font-mono text-xs">exemplo</span>
              </div>

              <div className="flex flex-col gap-3.5">
                {FEEDBACK_SCORES.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-3 text-[15px] font-bold">
                      <span>{item.label}</span>
                      <span className="font-mono tabular-nums">{item.score}/5</span>
                    </div>
                    <div className="edge bg-secondary h-3 overflow-hidden rounded-full">
                      <div
                        className="bar-grow bg-primary border-border h-full border-r-[1.5px]"
                        style={{ width: `${item.score * 20}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3.5">
                <div className="bg-accent min-w-0 flex-[1_1_200px] rounded-xl p-3.5">
                  <p className="text-brand-deep mb-1 font-mono text-xs font-bold">pontos fortes</p>
                  <p className="text-[15px]">
                    Explicou o plano antes de escrever código e deu nomes claros às variáveis.
                  </p>
                </div>
                <div className="bg-secondary min-w-0 flex-[1_1_200px] rounded-xl p-3.5">
                  <p className="mb-1 font-mono text-xs font-bold">o que melhorar</p>
                  <p className="text-[15px]">Testar os casos-limite antes de dizer que terminou.</p>
                </div>
              </div>

              <CodeBlock className="rounded-xl text-xs">
                <div>
                  <CodeMuted>{"3  "}</CodeMuted>
                  <CodeAccent>const</CodeAccent> cache = <CodeAccent>await</CodeAccent> memoria.get(id);
                </div>
                <div className="text-primary">{"   ^ Camila: e se o cache estiver fora do ar?"}</div>
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Entrevistadores */}
        <section id="entrevistadores" className="edge-t edge-b bg-secondary">
          <div
            className={`${SECTION} flex flex-wrap items-center gap-x-16 gap-y-12 py-[clamp(56px,7vw,96px)]`}
          >
            <div className="rise flex min-w-0 flex-[1.2_1_360px] flex-col items-start gap-5">
              <Eyebrow>entrevistadores</Eyebrow>
              <h2 className={H2}>Conheça os entrevistadores e encontre o seu</h2>
              <p className="text-muted-foreground max-w-[46ch] text-[17px]">
                Veja a experiência, as áreas, o preço e os horários de cada profissional. Cada
                entrevistador define o próprio preço, com sessões a partir de R$ 30.
              </p>
              <Link
                href="/entrevistadores"
                className={buttonVariants({ size: "lg", className: "h-[54px] px-[26px]" })}
              >
                Encontrar um entrevistador
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="rise flex min-w-0 flex-[1.2_1_380px] flex-wrap gap-3.5">
              <div className="lift edge bg-card box-border flex min-w-0 flex-[1.2_1_220px] flex-col gap-3 rounded-2xl p-3">
                <Image
                  src="/illustrations/camila.svg"
                  alt="Ilustração de Camila Ribeiro"
                  width={400}
                  height={360}
                  className="edge box-border block aspect-[10/7] w-full rounded-[10px] object-cover"
                />
                <div>
                  <p className="text-lg font-extrabold">Camila Ribeiro</p>
                  <p className="text-muted-foreground text-sm">
                    Engenheira de software sênior · Fintech de grande porte
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  <span className="edge rounded-[7px] px-2 py-0.5">back-end</span>
                  <span className="edge rounded-[7px] px-2 py-0.5">system design</span>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-sm font-bold">R$ 100 · 1h</span>
                  <span className="edge bg-primary rounded-[7px] px-2 py-0.5 font-bold">
                    qua, 18 nov · 19h
                  </span>
                </div>
              </div>

              <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-3.5">
                {[
                  {
                    name: "Rafael Nascimento",
                    role: "Front-end sênior · Plataforma de educação",
                    price: "R$ 80 · 1h",
                    slot: "qui, 19 nov · 18h",
                    image: "/illustrations/rafael.svg",
                  },
                  {
                    name: "Beatriz Costa",
                    role: "Dados sênior · Varejo online",
                    price: "R$ 120 · 1h",
                    slot: "sex, 20 nov · 10h",
                    image: "/illustrations/beatriz.svg",
                  },
                ].map((person) => (
                  <div
                    key={person.name}
                    className="lift edge bg-card flex flex-col gap-2.5 rounded-2xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={person.image} alt={`Ilustração de ${person.name}`} size={60} />
                      <div className="min-w-0">
                        <p className="font-extrabold">{person.name}</p>
                        <p className="text-muted-foreground text-[13px]">{person.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between gap-1.5 font-mono text-xs">
                      <span className="font-bold">{person.price}</span>
                      <span className="text-muted-foreground">{person.slot}</span>
                    </div>
                  </div>
                ))}
                <p className="text-muted-foreground text-[13px]">Perfis e preços ilustrativos.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        className={`${SECTION} flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-4 pt-8 pb-10`}
      >
        <Image src="/brand/lugh-logo.svg" alt="Lugh" width={81} height={28} className="h-7 w-auto" />
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
          <a href="#como-funciona" className={`${NAV_LINK} underline`}>
            Como funciona
          </a>
          <Link href="/entrevistadores" className={`${NAV_LINK} underline`}>
            Entrevistadores
          </Link>
          <Link href="/login" className={`${NAV_LINK} underline`}>
            Quero ser entrevistador
          </Link>
        </nav>
        <span className="text-muted-foreground font-mono text-xs">© 2026 Lugh</span>
      </footer>
    </div>
  );
}
