import { ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, PanelsTopLeft, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/motion/fade-in";
import { HoverLift } from "@/components/motion/hover-lift";
import { MotionLink } from "@/components/motion/motion-link";
import { PortalGateAtlantico } from "./portal-gate-atlantico";
import { RoomPreviewAtlantico } from "./room-preview-atlantico";

// Repave completo da exploração "Atlântico & Coral" (Figma node 67:7):
// layout mais energético, com sangria de verdade (painéis mais largos que
// a coluna de texto, badges em cantos, cards assimétricos), nos mesmos
// moldes da landing real (FadeIn, HoverLift, MotionLink, Funnel
// Display/Manrope já carregadas pelo layout.tsx). Página isolada, sem
// link no menu real; as cores são locais, não tocam o globals.css nem o
// DESIGN.md. Conteúdo e perfis são ilustrativos, iguais aos usados no
// resto do marketplace.

const AREAS = ["Engenharia", "Produto", "Dados", "Design", "Finanças", "Marketing"];

// Balões flutuantes do portão (PortalGateAtlantico), mesmas posições em %
// da landing real.
const AREA_TAGS = [
  { label: "Produto", top: "15%", right: "1%" },
  { label: "Engenharia", top: "23%", left: "1%" },
  { label: "Dados", top: "33%", right: "-1%" },
  { label: "Design", top: "37%", left: "9%" },
  { label: "Finanças", top: "52%", right: "4%" },
  { label: "Marketing", top: "64%", right: "-1%" },
];

const ROOM_BENEFITS = [
  {
    icon: Video,
    title: "Vídeo ao vivo",
    description: "Sessão cara a cara, sem gravação automática nem robô do outro lado.",
  },
  {
    icon: Code2,
    title: "Editor de código de verdade",
    description: "Escreve e roda código com quem avalia, igual numa entrevista técnica real.",
  },
  {
    icon: PanelsTopLeft,
    title: "Quadro de system design",
    description: "Desenha arquitetura e fluxo de sistema junto com o profissional, em tempo real.",
  },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    numberColor: "text-[#2451A4]",
    title: "Escolha quem já chegou lá",
    description:
      "Encontre um profissional da sua área, com experiência no tipo de empresa e de entrevista que você busca.",
    footnote: "Um encontro, não um curso.",
    bg: "bg-[#FFF8F3]",
    fg: "text-[#182D4D]",
    muted: "text-[#626C7D]",
    raised: false,
  },
  {
    number: "02",
    numberColor: "text-[#FFD8C6]",
    title: "Pratique de verdade",
    description:
      "Reserve um horário, pague com PIX e entre em uma sessão ao vivo com vídeo, editor e quadro branco.",
    footnote: "60 minutos para colocar a mão na massa.",
    bg: "bg-[#2451A4]",
    fg: "text-white",
    muted: "text-white/80",
    raised: true,
  },
  {
    number: "03",
    numberColor: "text-[#2451A4]",
    title: "Saia com um caminho",
    description:
      "Receba uma avaliação estruturada: o que já funciona, o que ajustar e como praticar antes da próxima entrevista.",
    footnote: "Seu próximo passo, sem adivinhação.",
    bg: "bg-[#FFF8F3]",
    fg: "text-[#182D4D]",
    muted: "text-[#626C7D]",
    raised: false,
  },
];

const FORMATS = [
  { number: "01", title: "Técnica", description: "Lógica, código e raciocínio em voz alta.", tag: "Para devs e dados" },
  { number: "02", title: "Comportamental", description: "Conte sua história com clareza e exemplos.", tag: "Para qualquer área" },
  { number: "03", title: "Portfólio e case", description: "Defenda decisões, mostre seu processo.", tag: "Para design e produto" },
];

// Mesmos perfis ilustrativos usados em outras telas de exemplo do marketplace.
const INTERVIEWERS = [
  {
    tag: "Software Engineer · Entrevista técnica",
    name: "Camila Ribeiro",
    role: "Engenheira de software sênior",
    company: "Fintech de grande porte",
    slot: "Qua, 18 nov · 19h",
    tilt: "lg:-rotate-1",
    raised: false,
  },
  {
    tag: "AI Engineer · Entrevista técnica",
    name: "Rafael Nascimento",
    role: "Engenheiro de IA pleno",
    company: "Plataforma de educação",
    slot: "Qui, 19 nov · 18h",
    tilt: "",
    raised: true,
  },
  {
    tag: "Design · Portfólio",
    name: "Beatriz Costa",
    role: "Product designer sênior",
    company: "Empresa de tecnologia",
    slot: "Sex, 20 nov · 10h",
    tilt: "lg:rotate-1",
    raised: false,
  },
];

const EXPERIENCE_STEPS = [
  { number: "01", title: "Conversa olho no olho", description: "Um profissional presente para ouvir seu raciocínio." },
  { number: "02", title: "Construa em tempo real", description: "Editor de código e quadro branco na mesma sala." },
  { number: "03", title: "Saiba o que fazer depois", description: "Pontos fortes, ajustes e um plano de prática." },
];

const FEEDBACK_PREVIEW = [
  { label: "O QUE JÁ FUNCIONA", text: "Você explica o contexto antes de propor uma solução." },
  { label: "O QUE AJUSTAR", text: "Deixe mais clara a relação entre sua decisão e o resultado." },
  { label: "SEU PRÓXIMO TREINO", text: "Pratique uma resposta com contexto, decisão e aprendizado." },
];

const PRICING_INCLUSIONS = [
  "Um profissional da sua área",
  "Vídeo, editor de código e quadro branco",
  "Feedback estruturado e plano de prática",
  "Pagamento único com PIX",
];

const FAQ = [
  {
    question: "Preciso ter experiência para participar?",
    answer:
      "Não. O treino foi pensado para quem busca estágio ou uma primeira vaga júnior. Conte seu momento para ajustar o desafio.",
  },
  {
    question: "Como funciona a sessão ao vivo?",
    answer:
      "Você e o profissional se encontram na sala da Lugh por 60 minutos. O formato inclui conversa, exercício ou case e espaço para dúvidas.",
  },
  {
    question: "Quando recebo meu feedback?",
    answer:
      "Após a sessão, o profissional organiza a avaliação. Você acompanha a disponibilidade em Minhas sessões e acessa seu plano por lá.",
  },
  {
    question: "Posso remarcar ou cancelar?",
    answer:
      "Você pode pedir uma remarcação ou cancelar até 24h antes da sessão, sem custo. Confira os detalhes antes de confirmar seu horário.",
  },
  {
    question: "A Lugh garante uma vaga?",
    answer:
      "Não. A Lugh oferece prática e orientação para você se preparar melhor. A contratação depende de cada processo seletivo.",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Para candidatos",
    links: [
      { label: "Encontre profissionais", href: "/entrevistadores" },
      { label: "Como funciona", href: "#como-funciona" },
    ],
  },
  {
    title: "Para profissionais",
    links: [
      { label: "Compartilhe seu ofício", href: "/login" },
      { label: "Seja entrevistador", href: "/login" },
    ],
  },
  {
    title: "Sobre a Lugh",
    links: [
      { label: "Nossa história", href: "/" },
      { label: "Fale com a gente", href: "#faq" },
    ],
  },
];

function Eyebrow({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`text-[11px] font-bold tracking-[0.08em] uppercase text-[#2451A4] ${className}`}>
      {children}
    </span>
  );
}

export default function PreviewLandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#FFF8F3] text-[#182D4D]">
      {/* Navegação */}
      <header className="sticky top-0 z-20 bg-[#FFF8F3]/95 backdrop-blur">
        <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-20">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/lugh-symbol-atlantico-coral.svg" alt="" width={28} height={26} />
            <span className="font-heading text-[28px] font-bold">lugh</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold lg:flex">
            <a href="#como-funciona" className="transition-colors hover:text-[#2451A4]">Como funciona</a>
            <a href="#profissionais" className="transition-colors hover:text-[#2451A4]">Profissionais</a>
            <a href="#formatos" className="transition-colors hover:text-[#2451A4]">Formatos</a>
            <a href="#precos" className="transition-colors hover:text-[#2451A4]">Preços</a>
          </nav>

          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden text-sm font-bold sm:inline">
              Entrar
            </Link>
            <MotionLink
              href="/login"
              className="flex h-11 items-center justify-center rounded-xl bg-[#2451A4] px-6 text-sm font-bold text-white"
            >
              Começar
            </MotionLink>
          </div>
        </div>
      </header>

      {/* Hero: painel Índigo com o título à esquerda, portão (o mesmo
          PortalGate da landing real, recolorido) à direita. */}
      <section className="grid grid-cols-1 lg:grid-cols-[5fr_4fr]">
        <FadeIn
          large
          className="flex flex-col justify-between gap-12 bg-[#2451A4] px-8 py-12 sm:px-12 lg:px-16 lg:py-16"
        >
          <div className="flex flex-col gap-6">
            <h1 className="font-heading max-w-[20ch] text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.98] font-bold tracking-[-0.03em] text-white">
              Chegue
              <br />
              <span className="pl-[8%]">na porta com a</span>
              <br />
              <span className="pl-[16%] text-[#FF8A70]">resposta pronta.</span>
            </h1>
          </div>

          <div className="flex flex-col gap-6">
            <div className="h-px bg-white/25" />
            <div className="flex gap-7">
              <span className="font-bold text-[#FFD8C6]">›</span>
              <div className="flex flex-col gap-3.5">
                <p className="font-heading text-2xl leading-[1.12] font-bold tracking-[-0.01em] text-white sm:text-3xl">
                  Treine com quem já trabalha onde você quer entrar.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <MotionLink
                href="/entrevistadores"
                className="flex h-[50px] items-center gap-2 rounded-xl bg-[#FF8A70] px-6 text-sm font-bold text-[#142C52]"
              >
                Agendar minha simulação
              </MotionLink>
              <MotionLink
                href="/login"
                className="flex h-[50px] items-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-bold text-white"
              >
                Quero entrevistar
              </MotionLink>
            </div>
          </div>
        </FadeIn>

        <FadeIn large index={1} className="flex flex-col items-center justify-center gap-6 px-8 py-12 sm:px-12 lg:px-12">
          <PortalGateAtlantico areaTags={AREA_TAGS}>
            <div className="absolute bottom-[7%] left-0 flex w-[76%] flex-col gap-4 rounded-[22px] border border-[#E7E2DF] bg-white p-6 shadow-lg">
              <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#626C7D] uppercase">
                Quem te entrevista
              </p>

              <div className="flex items-center gap-3">
                <div className="font-heading flex size-13 shrink-0 items-center justify-center rounded-full bg-[#E8EDF8] text-lg font-bold text-[#2451A4]">
                  CR
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="font-bold text-[#182D4D]">Camila R.</p>
                  <p className="text-sm text-[#626C7D]">
                    Engenheira Sênior · Fintech de grande porte
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#E8EDF8] px-3 py-1.5 text-xs font-bold text-[#182D4D]">
                  Código ao vivo
                </span>
                <span className="rounded-full bg-[#E8EDF8] px-3 py-1.5 text-xs font-bold text-[#182D4D]">
                  System design
                </span>
                <span className="rounded-full bg-[#E8EDF8] px-3 py-1.5 text-xs font-bold text-[#182D4D]">
                  Comportamental
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[#E7E2DF] pt-4">
                <div>
                  <p className="text-xs text-[#626C7D]">Próximo horário</p>
                  <p className="text-sm font-extrabold text-[#182D4D]">Sex, 18h</p>
                </div>
                <MotionLink
                  href="/login"
                  className="flex h-10 items-center rounded-lg bg-[#FF8A70] px-4 text-sm font-extrabold text-[#142C52]"
                >
                  Reservar · R$ 100
                </MotionLink>
              </div>
            </div>
          </PortalGateAtlantico>

          {/* Fallback sem o portão (que só aparece a partir de md). */}
          <div className="flex flex-col items-center gap-6 pt-2 text-center md:hidden">
            <p className="text-base font-bold">Para qualquer ofício. Para o seu próximo passo.</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {AREAS.map((area) => (
                <span key={area} className="rounded-2xl border border-[#E7E2DF] bg-white px-4 py-2 text-[11px] font-bold text-[#182D4D] shadow-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Linha de confiança, igual à landing real. */}
      <section className="bg-[#2451A4]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm font-semibold text-white lg:px-20">
          <span>Entrevistador verificado por LinkedIn</span>
          <span>Pagamento seguro via PIX</span>
          <span>Vídeo, código e quadro na mesma sala</span>
          <span>Feedback estruturado no fim</span>
        </div>
      </section>

      {/* Como funciona, com o card do meio levantado acima dos outros dois. */}
      <section id="como-funciona" className="bg-white px-6 py-24 lg:px-20">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="flex flex-col gap-4">
            <Eyebrow>Como funciona</Eyebrow>
            <h2 className="font-heading max-w-[26ch] text-[36px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[48px]">
              Antes da entrevista que vale, uma que ensina.
            </h2>
            <p className="max-w-[48ch] text-base leading-relaxed text-[#626C7D]">
              Você não precisa chegar sabendo tudo. Precisa de espaço para
              tentar, errar e evoluir.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 pt-16 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <FadeIn key={step.number} index={index + 1} className={step.raised ? "lg:-translate-y-6" : ""}>
                <HoverLift
                  className={`relative flex h-full flex-col gap-4 overflow-hidden rounded-[20px] p-7 ${step.bg} ${step.fg} ${
                    step.raised ? "shadow-2xl lg:z-10" : "shadow-sm"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`font-heading absolute -top-9 -right-3 text-[130px] font-black select-none ${step.numberColor} opacity-25`}
                  >
                    {step.number}
                  </span>
                  <span className={`font-heading relative text-[42px] font-bold ${step.numberColor}`}>{step.number}</span>
                  <h3 className="font-heading relative text-xl font-bold">{step.title}</h3>
                  <p className={`relative text-sm leading-relaxed ${step.muted}`}>{step.description}</p>
                  <p className={`relative text-[11px] font-bold ${step.numberColor}`}>{step.footnote}</p>
                </HoverLift>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* A sala: fundo claro, mesmo tom do resto da página. O mockup em si
          (RoomPreviewAtlantico) continua escuro, flutuando por cima. */}
      <section className="bg-[#FFF8F3] text-[#182D4D]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[7fr_5fr] lg:px-20">
          <FadeIn large>
            <HoverLift className="relative">
              <RoomPreviewAtlantico />
              <span className="absolute -top-5 -right-4 w-fit -rotate-3 rounded-2xl bg-[#FF8A70] px-4 py-2 text-[11px] font-bold tracking-[0.06em] uppercase text-[#142C52] shadow-xl">
                Prática, não roteiro pronto
              </span>
            </HoverLift>
          </FadeIn>

          <div className="flex flex-col gap-8">
            <FadeIn large index={1} className="flex flex-col gap-4">
              <Eyebrow>Treine. Prove. Entre.</Eyebrow>
              <h2 className="font-heading text-4xl font-bold tracking-[-0.03em] md:text-5xl">
                A primeira tentativa não precisa ser na entrevista.
              </h2>
              <p className="text-[#626C7D]">
                Um profissional da sua área, um desafio para o seu momento e
                um caminho para continuar evoluindo.
              </p>
            </FadeIn>

            <div className="flex flex-col gap-4">
              {ROOM_BENEFITS.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <FadeIn key={benefit.title} index={index + 2} className="flex gap-4">
                    <Icon aria-hidden="true" size={22} className="mt-0.5 shrink-0 text-[#2451A4]" />
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold">{benefit.title}</p>
                      <p className="text-sm text-[#626C7D]">{benefit.description}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Formatos de entrevista */}
      <section id="formatos" className="bg-[#E8EDF8] px-6 py-24 lg:px-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.75fr]">
          <FadeIn className="flex flex-col gap-4">
            <Eyebrow>Para o seu momento</Eyebrow>
            <h2 className="font-heading text-[36px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[44px]">
              Qual porta você quer abrir?
            </h2>
            <p className="text-base leading-relaxed text-[#626C7D]">
              O treino certo para o seu próximo desafio. Todas as sessões por
              R$ 100.
            </p>
          </FadeIn>

          <div className="flex flex-col">
            {FORMATS.map((format, index) => (
              <FadeIn key={format.number} index={index + 1} className="border-t border-[#CCD6E5] py-7 last:border-b">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-6">
                    <span className="text-sm font-bold text-[#2451A4]">{format.number}</span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-heading text-2xl font-bold">{format.title}</h3>
                      <p className="text-sm text-[#626C7D]">{format.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2451A4]">{format.tag}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Encontre seu profissional, com o card do meio levantado e os dois
          outros levemente rotacionados. */}
      <section id="profissionais" className="bg-[#FFF8F3] px-6 py-24 lg:px-20">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="flex flex-col gap-4 text-center">
            <Eyebrow className="mx-auto">Quem conhece o caminho, treina com você</Eyebrow>
            <h2 className="font-heading mx-auto max-w-[30ch] text-[36px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[44px]">
              Gente da área. Conversa de verdade.
            </h2>
            <p className="mx-auto max-w-[56ch] text-base leading-relaxed text-[#626C7D]">
              Sem respostas decoradas. Pratique com profissionais que vivem
              os desafios do mercado.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 pt-16 sm:grid-cols-3">
            {INTERVIEWERS.map((person, index) => (
              <FadeIn
                key={person.name}
                index={index + 1}
                className={`${person.raised ? "lg:-translate-y-5" : ""} ${person.tilt}`}
              >
                <HoverLift
                  className={`flex h-full flex-col gap-4 rounded-[20px] border border-[#E7E2DF] bg-white p-7 ${
                    person.raised ? "shadow-2xl lg:z-10" : "shadow-sm"
                  }`}
                >
                  <span className="w-fit rounded-2xl bg-[#E8EDF8] px-3 py-1.5 text-[11px] font-bold text-[#2451A4]">
                    {person.tag}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-bold">{person.name}</h3>
                    <p className="text-sm font-bold text-[#626C7D]">{person.role}</p>
                    <p className="text-xs text-[#626C7D]">{person.company}</p>
                  </div>
                  <div className="mt-auto border-t border-[#E7E2DF] pt-4">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>{person.slot}</span>
                      <Link
                        href="/entrevistadores"
                        className="flex items-center gap-1 text-[#2451A4] transition-transform hover:translate-x-0.5"
                      >
                        Ver perfil <ArrowRight aria-hidden="true" size={14} />
                      </Link>
                    </div>
                    <p className="pt-2 text-xs text-[#626C7D]">R$ 100 por sessão · 60 min</p>
                  </div>
                </HoverLift>
              </FadeIn>
            ))}
          </div>

          <p className="pt-10 text-center text-xs text-[#626C7D]">
            Perfis e avaliações ilustrativos para demonstrar a experiência Lugh.
          </p>
        </div>
      </section>

      {/* Experiência e feedback, com aspas gigantes sangrando no canto do card. */}
      <section className="bg-white px-6 py-24 lg:px-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-10">
            <FadeIn className="flex flex-col gap-4">
              <Eyebrow>Prática que vira próximo passo</Eyebrow>
              <h2 className="font-heading text-[36px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[42px]">
                Um &ldquo;foi bem&rdquo; não basta. Você merece um plano.
              </h2>
              <p className="text-base leading-relaxed text-[#626C7D]">
                O ambiente é de treino. O desafio é real. E o aprendizado
                continua depois da conversa.
              </p>
            </FadeIn>

            <div className="flex flex-col gap-6">
              {EXPERIENCE_STEPS.map((step, index) => (
                <FadeIn key={step.number} index={index + 1} className="flex gap-5">
                  <span className="text-sm font-bold text-[#2451A4]">{step.number}</span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-heading text-[17px] font-bold">{step.title}</h3>
                    <p className="text-sm text-[#626C7D]">{step.description}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn index={1}>
            <div className="relative overflow-hidden rounded-[24px] bg-[#E8EDF8] p-9">
              <span
                aria-hidden="true"
                className="absolute -top-10 -left-4 text-[160px] leading-none font-black text-[#2451A4]/10 select-none"
              >
                &ldquo;
              </span>
              <span className="relative text-[11px] font-bold tracking-[0.06em] text-[#2451A4]">
                Exemplo de feedback
              </span>
              <h3 className="font-heading relative pt-2 text-[30px] font-bold">Seu próximo passo</h3>
              <p className="relative pt-2 text-sm leading-relaxed text-[#626C7D]">
                Uma avaliação para entender o que manter, o que ajustar e como
                continuar praticando.
              </p>

              <div className="relative flex flex-col">
                {FEEDBACK_PREVIEW.map((item) => (
                  <div key={item.label} className="border-t border-[#CCD6E5] py-5 last:border-b">
                    <p className="text-[10px] font-bold tracking-[0.06em] text-[#2451A4]">{item.label}</p>
                    <p className="pt-1.5 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Preço, com dois círculos coral sangrando pelos cantos do card. */}
      <section id="precos" className="bg-[#FFF8F3] px-6 py-24 lg:px-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr]">
          <FadeIn className="flex flex-col gap-4">
            <Eyebrow>Sem assinatura. Sem pressão.</Eyebrow>
            <h2 className="font-heading text-[40px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[52px]">
              Uma sessão. Muito mais clareza.
            </h2>
            <p className="pt-2 text-lg leading-relaxed text-[#626C7D]">
              Sem pacote obrigatório, sem mensalidade. Você escolhe quando
              treinar e com quem quer aprender.
            </p>
            <p className="text-sm leading-relaxed text-[#626C7D]">
              O primeiro emprego já tem incertezas demais. O preço do seu
              treino não precisa ser uma delas.
            </p>
          </FadeIn>

          <FadeIn index={1}>
            <HoverLift className="relative overflow-hidden rounded-[24px] bg-white p-10 shadow-sm">
              <span
                aria-hidden="true"
                className="absolute -top-12 -right-12 size-56 rounded-full bg-[#FF8A70]/25"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-10 -left-10 size-32 rounded-full bg-[#2451A4]/10"
              />
              <span className="relative text-[11px] font-bold tracking-[0.06em] text-[#2451A4]">
                Sessão individual
              </span>
              <p className="font-heading relative pt-1 text-[68px] leading-none font-bold">R$ 100</p>
              <p className="relative pt-2 text-sm text-[#626C7D]">por sessão · 60 minutos</p>

              <div className="relative flex flex-col gap-3 pt-7">
                {PRICING_INCLUSIONS.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <Check aria-hidden="true" size={16} className="shrink-0 text-[#2451A4]" />
                    {item}
                  </div>
                ))}
              </div>

              <MotionLink
                href="/entrevistadores"
                className="relative mt-8 flex h-[54px] items-center justify-center gap-2 rounded-xl bg-[#FF8A70] text-sm font-bold text-[#142C52]"
              >
                Encontrar meu entrevistador
                <ArrowRight aria-hidden="true" size={16} />
              </MotionLink>
              <p className="relative pt-3 text-center text-xs text-[#626C7D]">
                Sem taxas extras. Você vê tudo antes de pagar.
              </p>
            </HoverLift>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white px-6 py-24 lg:px-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.75fr]">
          <FadeIn className="flex flex-col gap-4">
            <Eyebrow>Antes de começar</Eyebrow>
            <h2 className="font-heading text-[40px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[52px]">
              Pode perguntar.
            </h2>
            <p className="text-base leading-relaxed text-[#626C7D]">
              Treino bom também começa com expectativas claras.
            </p>
            <a
              href="mailto:oi@lugh.app"
              className="flex items-center gap-1.5 pt-2 text-sm font-bold text-[#2451A4]"
            >
              Fale com a gente <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          </FadeIn>

          <div className="flex flex-col">
            {FAQ.map((item, index) => (
              <FadeIn
                key={item.question}
                index={index + 1}
                className={`group/faq py-6 ${index !== FAQ.length - 1 ? "border-b border-[#CCD6E5]" : ""}`}
              >
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold transition-colors hover:text-[#2451A4]">
                    {item.question}
                    <ChevronDown
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-[#626C7D] transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="pt-3 text-sm leading-relaxed text-[#626C7D]">{item.answer}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Convite para começar, com o nome da marca gigante sangrando no fundo. */}
      <section className="relative overflow-hidden bg-[#FF8A70] px-6 py-24 text-[#142C52] lg:px-20">
        <span
          aria-hidden="true"
          className="font-heading absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40vw] font-black tracking-[-0.05em] text-[#142C52]/10 select-none sm:text-[28vw]"
        >
          lugh
        </span>

        <FadeIn large className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-6 text-center">
          <Eyebrow className="text-[#142C52]/70">Se prepare para a pergunta na porta</Eyebrow>
          <h2 className="font-heading max-w-[26ch] text-[40px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[52px]">
            Seu talento merece uma boa entrada.
          </h2>
          <p className="max-w-[52ch] text-base leading-relaxed">
            Na história de Lugh, entrar exigia provar um ofício. Aqui, você
            tem espaço para treinar o seu.
          </p>
          <MotionLink
            href="/entrevistadores"
            className="flex h-[54px] items-center gap-2 rounded-xl bg-[#142C52] px-7 text-sm font-bold text-white"
          >
            Agendar minha simulação
          </MotionLink>
        </FadeIn>
      </section>

      {/* Rodapé */}
      <footer className="flex flex-col gap-10 bg-[#142C52] px-6 py-16 text-white lg:px-20">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <p className="font-heading text-[38px] font-bold">lugh</p>
            <p className="pt-1 text-sm text-[#FFD8C6]">Treine. Prove. Entre.</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-16">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <p className="text-sm font-bold">{column.title}</p>
                <div className="flex flex-col gap-1.5">
                  {column.links.map((link) => (
                    <a key={link.label} href={link.href} className="text-[13px] text-white/70 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 border-t border-[#3B5276] pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Lugh. Feito para abrir caminhos.</span>
          <span>Termos de uso &nbsp;·&nbsp; Privacidade &nbsp;·&nbsp; Acessibilidade</span>
        </div>
      </footer>
    </main>
  );
}
