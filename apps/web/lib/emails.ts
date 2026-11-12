import { formatPrice } from "@/lib/format-price";
import { formatSessionDate } from "@/lib/format-session-date";
import { SESSION_TYPE_LABELS, type SessionRole, type SessionType } from "@/lib/room/session";

// Textos e HTML dos e-mails do Lugh. Funções puras: recebem os dados prontos e devolvem
// assunto, HTML e a versão em texto. Quem busca os dados e envia é lib/notifications.ts.

export type EmailContent = { subject: string; html: string; text: string };

// Cores da identidade (as mesmas dos tokens do site). Cliente de e-mail não lê CSS
// externo nem fonte da web: tudo vai inline, com fontes do sistema.
const INK = "#0F1A14";
const GREEN = "#2EF58A";
const LINK = "#0B7A4B";
const MUTED = "#55635B";
const SURFACE = "#F4F7F5";
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

// Nomes vêm do perfil, que o usuário edita: nunca entram crus no HTML.
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// "qua, 18 nov às 19h (horário de Brasília)"
function sessionWhen(startsAt: string): string {
  const { day, time } = formatSessionDate(startsAt);
  return `${day} às ${time} (horário de Brasília)`;
}

type Layout = {
  title: string;
  paragraphs: string[];
  details?: [label: string, value: string][];
  action: { label: string; url: string };
  footnote?: string;
};

function renderHtml({ title, paragraphs, details = [], action, footnote }: Layout): string {
  const body = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${INK}">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;font-family:${MONO};font-size:13px;color:${MUTED}">${escapeHtml(label)}</td><td style="padding:4px 0;font-family:${MONO};font-size:13px;color:${INK};text-align:right">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const detailsBlock = rows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:${SURFACE};border-radius:12px"><tr><td style="padding:14px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr></table>`
    : "";

  const footnoteBlock = footnote
    ? `<p style="margin:24px 0 0;font-size:14px;line-height:1.55;color:${MUTED}">${escapeHtml(footnote)}</p>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#FFFFFF;font-family:${FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 24px;font-size:22px;font-weight:800;color:${INK}">Lugh</td></tr>
<tr><td style="border:1.5px solid ${INK};border-radius:18px;padding:28px 24px">
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.15;font-weight:800;color:${INK}">${escapeHtml(title)}</h1>
${body}${detailsBlock}
<a href="${escapeHtml(action.url)}" style="display:inline-block;padding:14px 24px;background:${GREEN};color:${INK};border:1.5px solid ${INK};border-radius:12px;font-size:16px;font-weight:800;text-decoration:none">${escapeHtml(action.label)}</a>
${footnoteBlock}
</td></tr>
<tr><td style="padding:20px 0 0;font-size:13px;line-height:1.55;color:${MUTED}">Você recebeu este e-mail porque tem uma sessão no Lugh. Se o botão não abrir, copie este link: <a href="${escapeHtml(action.url)}" style="color:${LINK}">${escapeHtml(action.url)}</a></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function renderText({ title, paragraphs, details = [], action, footnote }: Layout): string {
  return [
    title,
    ...paragraphs,
    ...(details.length ? [details.map(([label, value]) => `${label}: ${value}`).join("\n")] : []),
    `${action.label}: ${action.url}`,
    ...(footnote ? [footnote] : []),
  ].join("\n\n");
}

function render(subject: string, layout: Layout): EmailContent {
  return { subject, html: renderHtml(layout), text: renderText(layout) };
}

export type SessionEmailInput = {
  // Quem recebe o e-mail e o papel dele na sessão.
  role: SessionRole;
  recipientName: string;
  otherName: string;
  startsAt: string;
  type: SessionType;
  roomUrl: string;
};

function sessionDetails(input: SessionEmailInput): [string, string][] {
  return [
    ["quando", sessionWhen(input.startsAt)],
    ["duração", "1 hora"],
    ["tipo", SESSION_TYPE_LABELS[input.type]],
    [input.role === "candidate" ? "entrevistador" : "candidato", input.otherName],
  ];
}

const ROOM_FOOTNOTE = "O link da sala também fica em Minhas sessões, no site.";

// Pagamento confirmado: a sessão está marcada. Vai para os dois participantes.
export function confirmationEmail(input: SessionEmailInput): EmailContent {
  const { day, time } = formatSessionDate(input.startsAt);
  const intro =
    input.role === "candidate"
      ? `Olá, ${input.recipientName}. Recebemos o seu pagamento e a sessão com ${input.otherName} está confirmada.`
      : `Olá, ${input.recipientName}. ${input.otherName} agendou e pagou uma sessão com você.`;

  return render(`Sessão confirmada: ${day} às ${time}`, {
    title: "Sessão confirmada",
    paragraphs: [intro],
    details: sessionDetails(input),
    action: { label: "Entrar na sala", url: input.roomUrl },
    footnote: ROOM_FOOTNOTE,
  });
}

// Uma hora antes do início. Vai para os dois participantes.
export function reminderEmail(input: SessionEmailInput): EmailContent {
  const { time } = formatSessionDate(input.startsAt);

  return render(`Sua sessão começa às ${time}`, {
    title: "Sua sessão começa em 1 hora",
    paragraphs: [
      `Olá, ${input.recipientName}. Falta 1 hora para a sua sessão com ${input.otherName}.`,
      "Teste a câmera e o microfone antes de entrar.",
    ],
    details: sessionDetails(input),
    action: { label: "Entrar na sala", url: input.roomUrl },
  });
}

export type FeedbackReadyEmailInput = {
  candidateName: string;
  interviewerName: string;
  startsAt: string;
  resultUrl: string;
};

// O entrevistador enviou o feedback. Vai para o candidato.
export function feedbackReadyEmail(input: FeedbackReadyEmailInput): EmailContent {
  const { day } = formatSessionDate(input.startsAt);

  return render("Seu feedback chegou", {
    title: "Seu feedback chegou",
    paragraphs: [
      `Olá, ${input.candidateName}. ${input.interviewerName} enviou o feedback da sessão de ${day}.`,
      "Você encontra as notas por critério, os pontos fortes, o que melhorar e o código e o quadro da sessão.",
    ],
    action: { label: "Ver o resultado", url: input.resultUrl },
  });
}

export type PayoutEmailInput = {
  interviewerName: string;
  candidateName: string;
  amountCents: number;
  startsAt: string;
  panelUrl: string;
};

// O repasse da sessão foi liberado. Vai para o entrevistador.
export function payoutEmail(input: PayoutEmailInput): EmailContent {
  const { day } = formatSessionDate(input.startsAt);
  const amount = formatPrice(input.amountCents);

  return render(`Você recebeu ${amount}`, {
    title: `Você recebeu ${amount}`,
    paragraphs: [
      `Olá, ${input.interviewerName}. O repasse da sessão de ${day} com ${input.candidateName} foi liberado.`,
      "O valor vai por PIX para a chave do CPF ou CNPJ que você cadastrou no painel.",
    ],
    details: [["valor", amount]],
    action: { label: "Ver meus ganhos", url: input.panelUrl },
  });
}
