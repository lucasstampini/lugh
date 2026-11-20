import {
  ArrowRight,
  Check,
  ChevronRight,
  Database,
  LayoutTemplate,
  MessagesSquare,
  Network,
  Plus,
  Server,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { RoomCollage } from "@/components/demo/room-collage";
import { PriceStepper } from "@/components/demo/price-stepper";
import { PortalGate } from "@/components/motion/portal-gate";
import { LandingHeaderActions } from "@/components/landing-header-actions";
import { buttonVariants } from "@/components/ui/button";

// Tudo nesta página é ilustrativo (perfis, horários, preços, feedback): serve
// para mostrar como o produto funciona. Os dados reais ficam em /entrevistadores.

const STEPS = [
  {
    number: "1",
    tone: "primary" as const,
    title: "Escolha um entrevistador",
    text: "Filtre por área e senioridade, compare a experiência e o preço de cada profissional e escolha um horário que caiba na sua semana.",
  },
  {
    number: "2",
    tone: "deep" as const,
    title: "Faça a entrevista",
    text: "Entre na sala pelo navegador e passe por uma entrevista como as de verdade: você programa, desenha a arquitetura e explica seu raciocínio para quem já contrata.",
  },
  {
    number: "3",
    tone: "ink" as const,
    title: "Receba seu feedback",
    text: "Saia com uma nota para cada competência e comentários sobre o que você fez na sessão, para saber o que treinar antes da próxima entrevista.",
  },
];

// As mesmas áreas do filtro do marketplace (lib/interviewer-options): cada
// porta abre a lista já filtrada, então não pode existir área aqui que o
// filtro não conheça.
const AREAS = [
  { icon: Server, slug: "backend", name: "Back-end", description: "APIs, bancos de dados e filas" },
  { icon: LayoutTemplate, slug: "frontend", name: "Front-end", description: "React, CSS e acessibilidade" },
  { icon: Database, slug: "data", name: "Dados", description: "SQL, modelagem e pipelines" },
  { icon: Smartphone, slug: "mobile", name: "Mobile", description: "Android, iOS e React Native" },
  { icon: Network, slug: "system_design", name: "System design", description: "Arquitetura e escala" },
  { icon: MessagesSquare, slug: "behavioral", name: "Comportamental", description: "Sua história, contada com clareza" },
];

// Agenda de exemplo do entrevistador: uma coluna por dia, uma linha por faixa
// de horário. "livre" = aberto por ele, "fechado" = sem atendimento, "marcado"
// = sessão já agendada.
type SlotState = "livre" | "fechado" | "marcado";
const AGENDA_DAYS = ["seg", "ter", "qua", "qui", "sex"];
const AGENDA_ROWS: { label: string; state: SlotState }[][] = [
  [
    { label: "19h", state: "livre" },
    { label: "18h", state: "fechado" },
    { label: "18h", state: "livre" },
    { label: "19h", state: "livre" },
    { label: "Tiago", state: "marcado" },
  ],
  [
    { label: "20h", state: "fechado" },
    { label: "19h", state: "livre" },
    { label: "Pedro", state: "marcado" },
    { label: "20h", state: "livre" },
    { label: "18h", state: "livre" },
  ],
];
const AGENDA_SLOT: Record<SlotState, string> = {
  livre: "bg-accent text-ink rounded-[7px] py-[7px]",
  fechado:
    "border-border-dashed text-muted-foreground rounded-[7px] border-[1.5px] border-dashed py-[5.5px]",
  marcado: "edge bg-primary text-ink rounded-[7px] py-[5.5px] font-bold",
};

// Perfis ilustrativos da vitrine de entrevistadores. O card do meio sobe e os
// das pontas inclinam de leve, como no desenho do /preview.
const INTERVIEWERS = [
  {
    tag: "Back-end · Entrevista técnica",
    name: "Camila Ribeiro",
    role: "Engenheira de software sênior",
    company: "Fintech de grande porte",
    slot: "Qua, 18 nov · 19h",
    price: "R$ 100",
    tilt: "lg:-rotate-1",
    raised: false,
  },
  {
    tag: "Front-end · Entrevista técnica",
    name: "Rafael Nascimento",
    role: "Desenvolvedor front-end pleno",
    company: "Plataforma de educação",
    slot: "Qui, 19 nov · 18h",
    price: "R$ 80",
    tilt: "",
    raised: true,
  },
  {
    tag: "Dados · SQL e modelagem",
    name: "Beatriz Costa",
    role: "Engenheira de dados sênior",
    company: "Varejo online",
    slot: "Sex, 20 nov · 10h",
    price: "R$ 120",
    tilt: "lg:rotate-1",
    raised: false,
  },
];

const INTERVIEWER_STATS = [
  {
    value: "60 min",
    label: "por sessão",
    detail: "Você escolhe quantas abre por semana, sem mínimo.",
  },
  {
    value: "80%",
    label: "do valor fica com você",
    detail: "O Lugh retém 20% para pagamento, sala e suporte.",
  },
  {
    value: "PIX",
    label: "repasse automático",
    detail: "O dinheiro cai na sua conta depois da sessão concluída.",
  },
];

const INTERVIEWER_BENEFITS = [
  { lead: "Ganhe dinheiro", rest: "compartilhando sua experiência" },
  { lead: "Encontre talentos", rest: "antes de eles chegarem ao mercado" },
  { lead: "Defina seu preço", rest: "e abra só os horários que quiser" },
  { lead: "Melhore sua marca pessoal", rest: "e aumente seu networking" },
];

const FAQ = [
  {
    question: "Preciso ter experiência para participar?",
    answer:
      "Não. O treino é pensado para quem busca estágio ou a primeira vaga júnior.",
  },
  {
    question: "Como funciona a sessão?",
    answer:
      "Você e o entrevistador se encontram na sala do Lugh por 60 minutos, com vídeo, editor de código e quadro. Abre no navegador, sem instalar nada.",
  },
  {
    question: "Quanto custa?",
    answer:
      "Cada entrevistador define o próprio preço. Você paga por PIX só a sessão que marcar, sem mensalidade.",
  },
  {
    question: "Quando recebo meu feedback?",
    answer:
      "Depois da sessão, o entrevistador preenche a nota de cada competência e os comentários. O resultado fica em Minhas sessões.",
  },
  {
    question: "O Lugh garante uma vaga?",
    answer:
      "Não. O Lugh oferece prática e feedback para você chegar mais preparado. A contratação depende de cada processo seletivo.",
  },
];

const SECTION = "mx-auto box-border max-w-[1240px] px-[clamp(20px,5vw,48px)]";
const H2 =
  "font-heading text-[clamp(30px,3.5vw,46px)] leading-[1.08] font-extrabold tracking-[-0.02em]";
const NAV_LINK = "text-foreground nav-underline inline-flex min-h-11 items-center";
const GRID_AUTOFIT = "[grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]";

// Cada passo tem a sua cor de selo.
const STEP_NUMBER_TONE = {
  primary: "bg-primary text-ink",
  deep: "bg-brand-deep text-white",
  ink: "bg-foreground text-background",
} as const;

// Os passos não levam a lugar nenhum: sem hover, para não parecerem botão.
const STEP_CARD =
  "rise edge bg-card box-border flex flex-col items-start gap-[18px] rounded-[20px] p-[clamp(22px,2.4vw,32px)]";

// Cabeçalho de seção: tudo alinhado à esquerda, com o rótulo pequeno (filete e
// mono) em cima do título de display.
function SectionHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rise flex min-w-0 flex-col items-start gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="bg-brand-deep h-[6px] w-9 shrink-0 rounded-full" />
          <span className="text-brand-deep font-mono text-[13px] leading-[1.5] font-bold tracking-[0.08em] uppercase">
            {eyebrow}
          </span>
        </div>
        <h2 className={`max-w-[24ch] ${H2}`}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Bloco de abertura: cabeçalho e hero sobre a faixa azul, fechada por
          uma linha de tinta. Só quatro cores aqui: azul, branco, tinta e o
          amarelo do botão. */}
      <div
        className="edge-b bg-brand-deep relative flex flex-col overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.4px, transparent 1.4px)",
          backgroundSize: "26px 26px",
        }}
      >
        {/* Cabeçalho de ponta a ponta: logo encostado na esquerda, menu na
            direita, sem coluna centralizada. */}
        <header className="relative z-20 flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[clamp(20px,5vw,48px)] py-[18px]">
          <Link
            href="/"
            aria-label="Lugh, página inicial"
            className="group/logo inline-flex min-h-11 items-center"
          >
            <Image
              src="/brand/lugh-logo-dark-bg.svg"
              alt="Lugh"
              width={98}
              height={34}
              className="h-[34px] w-auto transition-transform duration-[400ms] group-hover/logo:scale-[1.06] group-hover/logo:-rotate-3"
            />
          </Link>
          <nav
            aria-label="Principal"
            className="flex flex-wrap items-center gap-x-7 gap-y-1 text-[15px] font-semibold"
          >
            <a
              href="#como-funciona"
              className="nav-underline hidden min-h-11 items-center text-white after:bg-white! sm:inline-flex"
            >
              Como funciona
            </a>
            <Suspense fallback={null}>
              <LandingHeaderActions />
            </Suspense>
          </nav>
        </header>

        {/* Hero: título e botão à esquerda, a arte à direita, com respiro
            entre o cabeçalho e os cards. */}
        <section className="relative z-10 mx-auto box-border flex w-full max-w-[1240px] flex-wrap items-center gap-x-[clamp(32px,5vw,72px)] gap-y-12 px-[clamp(20px,5vw,48px)] pt-[clamp(32px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <div className="pop flex min-w-0 flex-[1_1_420px] flex-col items-start gap-8">
            <h1 className="font-heading max-w-[16ch] text-[clamp(34px,4.3vw,60px)] leading-[1.02] font-extrabold tracking-[-0.03em] text-white">
              Treine entrevista técnica com quem já trabalha na área
              <span className="text-primary">.</span>
            </h1>

            <Link
              href="/entrevistadores"
              className={buttonVariants({ size: "lg", className: "h-14 px-7 text-[17px]" })}
            >
              Encontrar um entrevistador
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          {/* Arte: o portão da marca como marca d'água, a colagem da sala na
              frente. */}
          <div className="relative flex min-w-0 flex-[1_1_420px] justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-[4%] left-1/2 flex -translate-x-1/2 items-end justify-center"
            >
              <PortalGate tone="soft" areaTags={[]} />
            </div>

            <div className="relative w-full max-w-[540px]">
              <RoomCollage />
            </div>
          </div>
        </section>
      </div>

      <main>
        {/* Áreas: uma porta por área, no mesmo tamanho. */}
        <section id="areas" className="edge-b bg-background">
          <div className={`${SECTION} flex flex-col gap-[clamp(20px,2.5vw,32px)] pt-[clamp(28px,3.5vw,44px)] pb-[clamp(48px,6vw,80px)]`}>
            <SectionHead eyebrow="Áreas" title="Treine na sua área" />

            <div className={`grid gap-4 ${GRID_AUTOFIT}`}>
              {AREAS.map(({ icon: Icon, slug, name, description }) => (
                <Link
                  key={slug}
                  href={`/entrevistadores?area=${slug}`}
                  className="hover-deep edge bg-card group/area box-border flex min-h-[104px] items-center gap-[18px] rounded-2xl px-[22px] py-5"
                >
                  <span
                    aria-hidden="true"
                    className="edge bg-secondary flex size-[52px] shrink-0 items-center justify-center rounded-xl transition-colors duration-200 group-hover/area:border-white group-hover/area:bg-white/15"
                  >
                    <Icon size={26} strokeWidth={1.8} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-heading text-[clamp(22px,2vw,26px)] leading-[1.1] font-extrabold tracking-[-0.01em]">
                      {name}
                    </span>
                    <span className="text-muted-foreground text-sm">{description}</span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={22}
                    strokeWidth={2.4}
                    className="shrink-0 transition-transform duration-300 group-hover/area:translate-x-1.5"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona: um card por passo, sem prévia de tela dentro. Cada
            número tem a sua cor: amarelo, azul e tinta. */}
        <section id="como-funciona" className="bg-background">
          <div className={`${SECTION} flex flex-col gap-[clamp(28px,3vw,40px)] py-[clamp(56px,7vw,96px)]`}>
            <SectionHead
              eyebrow="Como funciona"
              title="Da escolha ao feedback, em três passos."
            />

            <div className={`grid gap-5 ${GRID_AUTOFIT}`}>
              {STEPS.map((step) => (
                <article key={step.number} className={STEP_CARD}>
                  <span
                    className={`edge font-heading flex size-11 items-center justify-center rounded-[10px] text-[22px] font-extrabold ${STEP_NUMBER_TONE[step.tone]}`}
                  >
                    {step.number}
                  </span>
                  <h3 className="font-heading text-[clamp(28px,2.6vw,36px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-[17px]">{step.text}</p>
                </article>
              ))}
            </div>

            <Link
              href="/entrevistadores"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-12 self-start px-5",
              })}
            >
              Ver entrevistadores
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* A sala: captura da sala de verdade (editor compartilhado, vídeo e o
            cursor da outra pessoa), na moldura de tinta do resto da página. */}
        <section id="a-sala" className="edge-t bg-secondary">
          <div className={`${SECTION} flex flex-col gap-[clamp(24px,3vw,40px)] py-[clamp(56px,7vw,96px)]`}>
            <SectionHead eyebrow="A sala" title="Vídeo, código e quadro na mesma tela">
              <p className="text-muted-foreground max-w-[58ch] text-[17px]">
                Os dois editam o mesmo código e o mesmo quadro ao mesmo tempo, com vídeo ao
                lado. Abre no navegador, sem instalar nada.
              </p>
            </SectionHead>

            <figure className="rise flex flex-col gap-3">
              <Image
                src="/illustrations/sala.png"
                alt="Sala de entrevista do Lugh: vídeo das duas pessoas à esquerda e, à direita, o editor com uma solução em Python e o cursor da entrevistadora"
                width={2160}
                height={1215}
                sizes="(min-width: 1240px) 1144px, 92vw"
                className="edge h-auto w-full rounded-[18px] shadow-[7px_7px_0_var(--border)]"
              />
              <figcaption className="text-muted-foreground font-mono text-xs">
                captura da sala do Lugh, com nomes ilustrativos
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Vitrine de entrevistadores: o desenho do /preview trazido para a
            paleta atual. Card do meio levantado, os das pontas inclinados. */}
        <section id="profissionais" className="edge-t bg-secondary">
          <div className={`${SECTION} flex flex-col gap-[clamp(28px,3.5vw,48px)] py-[clamp(56px,7vw,96px)]`}>
            <SectionHead
              eyebrow="Profissionais"
              title="Gente da área. Conversa de verdade."
            >
              <p className="text-muted-foreground max-w-[56ch] text-[17px]">
                Sem resposta decorada. Você treina com quem vive os problemas do
                mercado todo dia.
              </p>
            </SectionHead>

            <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-3">
              {INTERVIEWERS.map((person) => (
                <article
                  key={person.name}
                  className={`rise lift-card edge bg-card flex h-full flex-col gap-4 rounded-[18px] p-7 ${person.tilt} ${
                    person.raised
                      ? "shadow-[8px_8px_0_var(--border)] lg:z-10 lg:-translate-y-5"
                      : "shadow-[5px_5px_0_var(--border)]"
                  }`}
                >
                  <span className="edge bg-accent text-ink w-fit rounded-[7px] px-2.5 py-1 font-mono text-[11px] font-bold">
                    {person.tag}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-heading text-xl font-bold">{person.name}</h3>
                    <p className="text-sm font-bold">{person.role}</p>
                    <p className="text-muted-foreground text-xs">{person.company}</p>
                  </div>

                  <div className="border-border-dashed mt-auto flex flex-col gap-2 border-t-[1.5px] border-dashed pt-4">
                    <div className="flex items-center justify-between gap-3 text-sm font-bold">
                      <span className="font-mono text-xs">{person.slot}</span>
                      <Link
                        href="/entrevistadores"
                        className="text-brand-deep group/perfil inline-flex items-center gap-1"
                      >
                        Ver perfil
                        <ArrowRight
                          aria-hidden="true"
                          size={14}
                          className="transition-transform group-hover/perfil:translate-x-0.5"
                        />
                      </Link>
                    </div>
                    <p className="text-muted-foreground font-mono text-xs">
                      {person.price} por sessão · 60 min
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <p className="text-muted-foreground font-mono text-xs">
              perfis ilustrativos para mostrar a experiência
            </p>
          </div>
        </section>

        {/* Chamada: faixa azul com o botão amarelo. */}
        <section id="entrevistadores" className="edge-t edge-b bg-brand-deep text-white">
          <div
            className={`${SECTION} flex flex-wrap items-center justify-between gap-x-12 gap-y-7 py-[clamp(48px,6vw,80px)]`}
          >
            <h2 className={`rise min-w-0 flex-[1_1_360px] ${H2}`}>
              Esteja preparado de verdade para a próxima entrevista
            </h2>
            <Link
              href="/entrevistadores"
              className={buttonVariants({ size: "lg", className: "h-14 px-7 text-[17px]" })}
            >
              Encontrar um entrevistador
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Seja entrevistador: a oferta para o outro lado do marketplace. Duas
            colunas: o convite e o que a pessoa ganha à esquerda; à direita, a
            agenda e o preço como peças, porque são as duas coisas que ela
            controla. */}
        <section id="seja-entrevistador" className="edge-b bg-background">
          <div className={`${SECTION} flex flex-col gap-[clamp(32px,4vw,56px)] py-[clamp(56px,7vw,96px)]`}>
            <div className="flex flex-wrap items-start gap-x-[clamp(32px,5vw,72px)] gap-y-10">
              <div className="flex min-w-0 flex-[1_1_380px] flex-col items-start gap-8">
                <SectionHead eyebrow="Do outro lado" title="Seja entrevistador">
                  <p className="text-muted-foreground max-w-[52ch] text-[17px]">
                    Você escolhe os dias, os horários e quanto cobra. O Lugh cuida do
                    pagamento, da sala e do feedback, e o seu tempo livre vira renda.
                  </p>
                </SectionHead>

                <ul className="rise flex flex-col gap-3.5">
                  {INTERVIEWER_BENEFITS.map((benefit) => (
                    <li key={benefit.lead} className="flex items-start gap-3 text-[17px]">
                      <span
                        aria-hidden="true"
                        className="edge bg-primary text-ink mt-px flex size-[26px] shrink-0 items-center justify-center rounded-lg"
                      >
                        <Check size={15} strokeWidth={3} />
                      </span>
                      <span>
                        <strong className="font-extrabold">{benefit.lead}</strong>{" "}
                        {benefit.rest}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/onboarding/entrevistador"
                  className={buttonVariants({ size: "lg", className: "h-[54px] px-[26px]" })}
                >
                  Quero entrevistar
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>

              {/* Peças da agenda e do preço: o controle fica com o entrevistador. */}
              <div className="rise flex min-w-0 flex-[1_1_400px] flex-col gap-4">
                <div className="edge bg-card flex flex-col gap-3.5 rounded-[18px] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                    <span className="font-bold">sua agenda</span>
                    <span className="text-muted-foreground">16 a 20 nov</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
                    {AGENDA_DAYS.map((day) => (
                      <span key={day} className="text-muted-foreground">
                        {day}
                      </span>
                    ))}
                    {AGENDA_ROWS.flatMap((row, rowIndex) =>
                      row.map((slot, index) => (
                        <span key={`${rowIndex}-${index}`} className={AGENDA_SLOT[slot.state]}>
                          {slot.label}
                        </span>
                      )),
                    )}
                  </div>

                  <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="bg-accent size-2.5 rounded-[3px]" />
                      você abriu
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="edge bg-primary size-2.5 rounded-[3px]" />
                      já agendado
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="border-border-dashed size-2.5 rounded-[3px] border-[1.5px] border-dashed" />
                      fechado
                    </span>
                  </div>
                </div>

                <PriceStepper />
              </div>
            </div>

            {/* Números em fileira, separados por filete, sem virar mais três
                cards iguais. */}
            <dl className="border-border-soft divide-border-soft grid border-t-[1.5px] md:grid-cols-3 md:divide-x-[1.5px]">
              {INTERVIEWER_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="border-border-soft flex flex-col gap-1 border-b-[1.5px] py-6 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0"
                >
                  <dt className="text-muted-foreground font-mono text-xs">{stat.label}</dt>
                  <dd className="font-heading text-[clamp(30px,3.4vw,44px)] leading-none font-extrabold tabular-nums">
                    {stat.value}
                  </dd>
                  <p className="text-muted-foreground text-sm">{stat.detail}</p>
                </div>
              ))}
            </dl>

            <p className="border-border-dashed text-muted-foreground border-t-[1.5px] border-dashed pt-5 text-sm">
              Sem exclusividade e sem mensalidade: você abre só os horários que quiser e
              pode fechar a agenda quando precisar.
            </p>
          </div>
        </section>

        {/* Perguntas frequentes: faixa azul com os cards brancos. */}
        <section id="faq" className="edge-b bg-brand-deep text-white">
          <div
            className={`${SECTION} flex flex-wrap items-start gap-x-16 gap-y-8 py-[clamp(56px,7vw,96px)]`}
          >
            <h2 className={`rise min-w-0 flex-[1_1_280px] ${H2}`}>Perguntas frequentes</h2>

            <div className="rise flex min-w-0 flex-[1.8_1_480px] flex-col gap-3">
              {FAQ.map((item) => (
                <details
                  key={item.question}
                  className="lift edge bg-card text-foreground group/faq rounded-[14px]"
                >
                  <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-5 text-[17px] font-extrabold [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <Plus
                      aria-hidden="true"
                      size={20}
                      className="edge bg-primary text-ink box-content shrink-0 rounded-[9px] p-1.5 transition-transform duration-300 group-open/faq:rotate-45"
                    />
                  </summary>
                  <p className="text-muted-foreground max-w-[64ch] px-5 pb-[18px]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        className={`${SECTION} flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-4 pt-7 pb-9`}
      >
        <Image src="/brand/lugh-logo.svg" alt="Lugh" width={81} height={28} className="h-7 w-auto" />
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
          <Link href="/entrevistadores" className={NAV_LINK}>
            Entrevistadores
          </Link>
          <a href="#como-funciona" className={NAV_LINK}>
            Como funciona
          </a>
          <a href="#faq" className={NAV_LINK}>
            Perguntas frequentes
          </a>
          <a href="#seja-entrevistador" className={NAV_LINK}>
            Quero ser entrevistador
          </a>
        </nav>
        <span className="text-muted-foreground font-mono text-xs">© 2026 Lugh</span>
      </footer>
    </div>
  );
}
