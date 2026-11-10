import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Code2,
  MessagesSquare,
  PanelsTopLeft,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LandingHeaderActions } from "@/components/landing-header-actions";
import { FadeIn } from "@/components/motion/fade-in";
import { HoverLift } from "@/components/motion/hover-lift";
import { MotionLink } from "@/components/motion/motion-link";
import { PortalGate } from "@/components/motion/portal-gate";
import { RoomPreview } from "@/components/room-preview";

const AREA_TAGS = [
  { label: "Produto", top: "15%", right: "1%" },
  { label: "Engenharia", top: "23%", left: "1%" },
  { label: "Dados", top: "33%", right: "-1%" },
  { label: "Design", top: "37%", left: "9%" },
  { label: "Finanças", top: "52%", right: "4%" },
  { label: "Marketing", top: "64%", right: "-1%" },
];

const VALUE_PROPS = [
  "Entrevistador verificado por LinkedIn",
  "Pagamento seguro via PIX",
  "Vídeo, código e quadro na mesma sala",
  "Feedback estruturado no fim",
];

const STEPS = [
  {
    number: "01",
    title: "Escolha quem te entrevista",
    description:
      "Filtre por área e senioridade, veja o perfil e os horários livres de quem já trabalha onde você quer chegar.",
  },
  {
    number: "02",
    title: "Agende e pague pela sessão",
    description:
      "Marque um horário e pague com PIX. Sem mensalidade, sem compromisso além da sessão marcada.",
  },
  {
    number: "03",
    title: "Treine e receba o feedback",
    description:
      "Sessão ao vivo de 60 minutos. No fim, nota por competência, pontos fortes e o que melhorar.",
  },
];

const BENEFITS = [
  {
    icon: Video,
    title: "Sessão ao vivo, cara a cara",
    description:
      "Vídeo direto com quem te entrevista, sem gravação automática nem robô do outro lado.",
  },
  {
    icon: Code2,
    title: "Editor de código de verdade",
    description: "Escreve e roda código com quem avalia, igual numa entrevista técnica real.",
  },
  {
    icon: PanelsTopLeft,
    title: "Quadro compartilhado",
    description: "Desenha arquitetura e fluxo de sistema junto com o entrevistador, em tempo real.",
  },
];

const PROFESSIONALS = [
  {
    initials: "CR",
    name: "Camila Ribeiro",
    rating: "4,9",
    reviews: 32,
    role: "Engenheira de software sênior",
    company: "Fintech de grande porte",
    tags: ["Back-end", "Entrevista técnica"],
    slot: "Qua, 18 nov · 19h",
  },
  {
    initials: "RN",
    name: "Rafael Nascimento",
    rating: "4,9",
    reviews: 24,
    role: "Desenvolvedor front-end pleno",
    company: "Plataforma de educação",
    tags: ["Front-end", "Entrevista técnica"],
    slot: "Qui, 19 nov · 18h",
  },
  {
    initials: "BC",
    name: "Beatriz Costa",
    rating: "4,8",
    reviews: 19,
    role: "Product designer sênior",
    company: "Empresa de tecnologia",
    tags: ["Design", "Portfólio"],
    slot: "Sex, 20 nov · 10h",
  },
];

const FEEDBACK_SCORES = [
  { label: "Raciocínio lógico", score: 4 },
  { label: "Comunicação", score: 4 },
  { label: "Testes e casos-limite", score: 3 },
];

const FAQ = [
  {
    question: "Preciso pagar mensalidade?",
    answer: "Não. Você paga só a sessão que marcar, via PIX.",
  },
  {
    question: "Quem são os entrevistadores?",
    answer:
      "Profissionais que já trabalham na área, com perfil validado pelo LinkedIn antes de aparecerem no marketplace.",
  },
  {
    question: "Como funciona o feedback?",
    answer:
      "No fim da sessão, o entrevistador preenche uma nota por competência, pontos fortes e o que melhorar. Fica salvo no seu histórico.",
  },
  {
    question: "Posso reagendar?",
    answer:
      "Sim, direto pela sua lista de sessões, enquanto ainda houver tempo antes do horário marcado.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-border bg-card sticky top-0 z-10 border-b">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/lugh-symbol.svg" alt="" width={32} height={32} />
            <span className="font-heading text-primary text-2xl font-extrabold tracking-[-0.02em]">
              lugh
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#como-funciona"
              className="hover:text-primary text-sm font-semibold transition-colors"
            >
              Como funciona
            </a>
            <a
              href="#formatos"
              className="hover:text-primary text-sm font-semibold transition-colors"
            >
              Formatos
            </a>
            <a
              href="#precos"
              className="hover:text-primary text-sm font-semibold transition-colors"
            >
              Preços
            </a>
          </nav>

          <Suspense fallback={null}>
            <LandingHeaderActions />
          </Suspense>
        </div>
      </header>

      {/* Hero: mesmo desenho do painel índigo da tela de login. */}
      <section className="grid grid-cols-1 lg:grid-cols-[5fr_4fr]">
        <FadeIn
          large
          className="bg-primary flex flex-col justify-between gap-12 px-8 py-12 sm:px-12 lg:px-16 lg:py-16"
        >
          <h1 className="font-heading text-[clamp(2.25rem,6vw,5.5rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-white">
            Chegue
            <br />
            <span className="pl-[8%]">preparado pra</span>
            <br />
            <span className="pl-[16%]">a entrevista de verdade.</span>
          </h1>

          <div className="flex flex-col gap-6">
            <div className="h-px bg-[#ECEAFE] opacity-35" />
            <div className="flex gap-7">
              <span className="font-bold text-[#ECEAFE]">›</span>
              <div className="flex flex-col gap-3.5">
                <p className="font-heading text-2xl leading-[1.12] font-bold tracking-[-0.01em] text-white sm:text-3xl">
                  Treine com quem já trabalha onde você quer entrar.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn
          large
          index={1}
          className="flex items-center justify-center px-8 py-12 sm:px-12 lg:px-12"
        >
          <PortalGate areaTags={AREA_TAGS}>
            <div className="bg-card border-border absolute bottom-[7%] left-0 flex w-[76%] flex-col gap-4 rounded-[22px] border p-6 shadow-lg">
              <p className="text-muted-foreground text-xs font-extrabold tracking-[0.08em] uppercase">
                Quem te entrevista
              </p>

              <div className="flex items-center gap-3">
                <div className="bg-secondary text-primary flex size-13 shrink-0 items-center justify-center rounded-full font-heading text-lg font-bold">
                  MA
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="font-bold">Mariana A.</p>
                  <p className="text-muted-foreground text-sm">
                    Engenheira Sênior · Fintech de grande porte
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="bg-secondary rounded-full px-3 py-1.5 text-xs font-bold">
                  Código ao vivo
                </span>
                <span className="bg-secondary rounded-full px-3 py-1.5 text-xs font-bold">
                  System design
                </span>
                <span className="bg-secondary rounded-full px-3 py-1.5 text-xs font-bold">
                  Comportamental
                </span>
              </div>

              <div className="border-border flex items-center justify-between gap-3 border-t pt-4">
                <div>
                  <p className="text-muted-foreground text-xs">Próximo horário</p>
                  <p className="text-sm font-extrabold">Sex, 18h</p>
                </div>
                <MotionLink
                  href="/login"
                  className="bg-lume text-foreground flex h-10 items-center rounded-lg px-4 text-sm font-extrabold"
                >
                  Reservar · R$ 100
                </MotionLink>
              </div>
            </div>
          </PortalGate>
        </FadeIn>
      </section>

      {/* Linha de confiança: texto curto com ícone, sem virar fileira de cards. */}
      <section className="bg-primary">
        <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-4 px-6 py-5">
          {VALUE_PROPS.map((item, index) => (
            <FadeIn
              key={item}
              index={index}
              className="flex items-center gap-2 text-white"
            >
              <Check aria-hidden="true" size={16} className="shrink-0 text-white" />
              <span className="text-sm font-bold">{item}</span>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Como funciona: lista numerada vertical, não cards em grid. */}
      <section id="como-funciona" className="mx-auto max-w-[1440px] px-6 py-14">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-[5fr_7fr]">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary h-2 w-8 rounded-full" />
            <span className="text-primary text-sm font-extrabold tracking-[0.08em] uppercase">
              Como funciona
            </span>
          </div>
          <h2 className="font-heading text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
            Da escolha ao feedback, em três passos.
          </h2>
        </div>

        <div className="relative flex flex-col gap-7">
          <div className="bg-border absolute top-7 bottom-7 left-7 w-px" />

          {STEPS.map((step, index) => (
            <FadeIn
              key={step.number}
              index={index}
              className="relative flex gap-6 pb-2"
            >
              <span className="bg-primary relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full font-heading text-xl font-extrabold text-white">
                {index + 1}
              </span>
              <div className="flex flex-col gap-2 pt-2">
                <h3 className="font-heading text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground max-w-prose">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Formatos: um grande e dois menores, não três iguais. */}
      <section id="formatos" className="border-border bg-card border-t">
        <div className="mx-auto max-w-[1440px] px-6 py-14">
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-[5fr_7fr]">
            <div className="flex items-center gap-2.5">
              <span className="bg-lume h-2 w-8 rounded-full" />
              <span className="text-primary text-sm font-extrabold tracking-[0.08em] uppercase">
                Formatos
              </span>
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
              Pra cada tipo de vaga, um formato.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FadeIn index={0} className="md:row-span-2">
              <HoverLift className="bg-primary flex h-full flex-col gap-4 rounded-[20px] p-8 text-white">
                <Code2 aria-hidden="true" size={28} />
                <h3 className="font-heading text-2xl font-bold">Técnica com código</h3>
                <p className="text-white/80">
                  Editor ao vivo pra resolver problema, escrever e rodar código junto com o
                  entrevistador, igual numa entrevista técnica de verdade.
                </p>
                <span className="bg-lume text-lume-foreground mt-auto w-fit rounded-md px-3 py-1.5 text-xs font-bold">
                  O formato mais pedido
                </span>
              </HoverLift>
            </FadeIn>

            <FadeIn index={1}>
              <HoverLift className="bg-background flex h-full flex-col gap-3 rounded-[20px] border-l-4 border-primary p-6">
                <MessagesSquare aria-hidden="true" size={24} className="text-primary" />
                <h3 className="font-heading text-lg font-bold">Comportamental</h3>
                <p className="text-foreground/70 text-sm">
                  Perguntas de carreira e fit, com feedback sobre como você se comunica.
                </p>
              </HoverLift>
            </FadeIn>

            <FadeIn index={2}>
              <HoverLift className="bg-background flex h-full flex-col gap-3 rounded-[20px] border-l-4 border-primary p-6">
                <PanelsTopLeft aria-hidden="true" size={24} className="text-primary" />
                <h3 className="font-heading text-lg font-bold">System design</h3>
                <p className="text-foreground/70 text-sm">
                  Quadro compartilhado pra desenhar arquitetura com quem avalia sênior e staff.
                </p>
              </HoverLift>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Profissionais + preço: listagem real de perfis, preço junto de quem cobra. */}
      <section id="precos" className="mx-auto max-w-[1440px] px-6 py-14">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-lume h-2 w-8 rounded-full" />
              <span className="text-primary text-sm font-extrabold tracking-[0.08em] uppercase">
                Profissionais e preço
              </span>
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
              Gente da área. Conversa de verdade.
            </h2>
            <p className="text-foreground/70 max-w-prose">
              Sem mensalidade, sem taxa de cadastro. Você paga só a sessão, direto pro
              profissional escolhido, a partir de{" "}
              <span className="bg-lume text-lume-foreground rounded-md px-1.5 py-0.5 font-bold">
                R$ 30,00
              </span>
              .
            </p>
          </div>
          <Link
            href="/entrevistadores"
            className="text-primary flex items-center gap-1.5 text-sm font-semibold"
          >
            Ver todos os profissionais
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PROFESSIONALS.map((person, index) => (
            <FadeIn key={person.name} index={index}>
              <HoverLift className="h-full">
                <Link
                  href="/entrevistadores"
                  className="border-border bg-card hover:border-primary flex h-full flex-col gap-4 rounded-[20px] border border-l-4 border-l-primary p-6 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary text-primary flex size-14 shrink-0 items-center justify-center rounded-full font-heading text-lg font-bold">
                      {person.initials}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold">{person.name}</p>
                      <p className="text-muted-foreground text-sm">
                        <span className="text-lume">★</span> {person.rating} · {person.reviews}{" "}
                        avaliações
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm">{person.role}</p>
                    <p className="text-muted-foreground text-sm">{person.company}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {person.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-secondary text-primary rounded-full px-2.5 py-1 text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <CalendarDays aria-hidden="true" size={15} />
                    {person.slot}
                  </div>

                  <div className="border-border mt-auto flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="font-heading text-lg font-bold tabular-nums">R$ 100,00</p>
                      <p className="text-muted-foreground text-xs">por sessão · 60 min</p>
                    </div>
                    <span className="border-border flex h-10 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold">
                      Ver perfil
                      <ArrowUpRight aria-hidden="true" size={16} />
                    </span>
                  </div>
                </Link>
              </HoverLift>
            </FadeIn>
          ))}
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          Perfis e avaliações ilustrativos para demonstrar a experiência.
        </p>
      </section>

      {/* Prática e evolução: a sala tem identidade própria, modo escuro sempre. */}
      <section className="bg-[#13122A] text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-[7fr_5fr]">
          <RoomPreview />

          <div className="flex flex-col gap-8">
            <FadeIn large index={1} className="flex flex-col gap-4">
              <span className="w-fit rounded-full bg-[#2A2850] px-3.5 py-2 text-sm font-bold text-white">
                A sala
              </span>
              <h2 className="font-heading text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
                A mesma sala onde a vaga de verdade vai te testar.
              </h2>
            </FadeIn>

            <div className="flex flex-col gap-4">
              {BENEFITS.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <FadeIn key={benefit.title} index={index + 2} className="flex gap-4">
                    <Icon aria-hidden="true" size={22} className="mt-0.5 shrink-0 text-lume" />
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold">{benefit.title}</p>
                      <p className="text-sm text-[#C9C7DB]">{benefit.description}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Feedback: mostra o relatório de verdade, não só promete. */}
      <section className="border-border bg-card border-t">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-[6fr_6fr]">
          <FadeIn large className="flex flex-col gap-4">
            <span className="bg-secondary w-fit rounded-full px-3.5 py-2 text-sm font-bold">
              Feedback
            </span>
            <h2 className="font-heading text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
              Um &ldquo;foi bem&rdquo; não basta. Você merece um plano.
            </h2>
            <p className="text-foreground/70 max-w-prose">
              Entenda suas forças e os pontos de atenção, com exemplos da
              própria sessão. Feedback de desenvolvimento, não promessa de
              contratação.
            </p>
            <MotionLink
              href="/login"
              className="bg-primary text-primary-foreground flex h-11 w-fit items-center gap-2 rounded-lg px-5 text-sm font-semibold"
            >
              Encontrar meu entrevistador
              <ArrowRight aria-hidden="true" size={17} />
            </MotionLink>
          </FadeIn>

          <FadeIn large index={1}>
            <div className="border-border bg-background flex flex-col gap-5 rounded-[20px] border p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="font-heading text-xl font-bold">Seu próximo passo</p>
                <span className="bg-secondary text-primary rounded-full px-3 py-1.5 text-xs font-bold">
                  Exemplo de feedback
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Você explicou bem sua ideia. Agora, vale praticar como testar
                as saídas antes de considerar a solução pronta.
              </p>

              <div className="flex flex-col gap-4">
                {FEEDBACK_SCORES.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="tabular-nums">{item.score}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < item.score ? "bg-lume" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-border flex flex-col gap-1.5 border-t pt-4">
                <p className="text-muted-foreground text-xs font-bold tracking-[0.04em] uppercase">
                  Seu foco da semana
                </p>
                <p className="text-sm">
                  Resolver 3 exercícios e escrever os testes antes de rodar o
                  código.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ: lista com disclosure nativa, sem JS. */}
      <section className="border-border bg-card border-t">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-6 py-14 md:grid-cols-[4fr_8fr]">
          <FadeIn large className="flex flex-col gap-3">
            <span className="bg-secondary w-fit rounded-full px-3.5 py-2 text-sm font-bold">
              Perguntas
            </span>
            <h2 className="font-heading text-4xl font-extrabold tracking-[-0.03em]">
              Perguntas frequentes.
            </h2>
          </FadeIn>

          <div className="flex flex-col">
            {FAQ.map((item, index) => (
              <FadeIn
                key={item.question}
                index={index}
                className={`group/faq py-4 ${
                  index !== FAQ.length - 1 ? "border-border border-b" : ""
                }`}
              >
                <details className="group">
                  <summary className="hover:text-primary flex cursor-pointer list-none items-center justify-between gap-4 font-semibold transition-colors">
                    {item.question}
                    <ChevronDown
                      aria-hidden="true"
                      size={18}
                      className="text-muted-foreground shrink-0 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="text-foreground/70 mt-3 max-w-prose text-sm">{item.answer}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final: bookend em índigo, igual ao hero. */}
      <section className="bg-primary">
        <FadeIn
          large
          className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 py-16 text-center"
        >
          <span className="bg-lume text-lume-foreground w-fit rounded-full px-3.5 py-2 text-sm font-bold">
            Prove que já sabe.
          </span>
          <h2 className="font-heading text-5xl font-extrabold tracking-[-0.03em] text-white">
            Pronto pra treinar antes da entrevista real?
          </h2>
          <MotionLink
            href="/login"
            className="bg-background text-primary flex h-12 items-center gap-2 rounded-lg px-6 text-base font-bold"
          >
            Comece a treinar
            <ArrowRight aria-hidden="true" size={17} />
          </MotionLink>
        </FadeIn>
      </section>

      <footer className="border-border bg-card border-t">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="flex flex-col gap-2">
              <span className="font-heading text-primary text-xl font-extrabold tracking-[-0.02em]">
                lugh
              </span>
              <p className="text-muted-foreground text-sm">Treine. Prove. Entre.</p>
            </div>

            <nav className="flex flex-col gap-3">
              <p className="text-xs font-bold tracking-[0.04em] uppercase">
                Para candidatos
              </p>
              <Link
                href="/entrevistadores"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Encontre profissionais
              </Link>
              <a
                href="#como-funciona"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Como funciona
              </a>
            </nav>

            <nav className="flex flex-col gap-3">
              <p className="text-xs font-bold tracking-[0.04em] uppercase">
                Para profissionais
              </p>
              <Link
                href="/login"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Seja entrevistador
              </Link>
            </nav>

            <nav className="flex flex-col gap-3">
              <p className="text-xs font-bold tracking-[0.04em] uppercase">
                Sobre a Lugh
              </p>
              <a
                href="#precos"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Preços
              </a>
              <Link
                href="/login"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Entrar
              </Link>
            </nav>
          </div>

          <p className="text-muted-foreground border-border border-t pt-6 text-xs">
            © 2026 Lugh · Hack Brasil 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
