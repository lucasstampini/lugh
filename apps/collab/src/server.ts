import { Database } from "@hocuspocus/extension-database";
import { Server } from "@hocuspocus/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

// Servidor de colaboração da sala: repassa as edições do editor e do quadro entre os dois
// participantes, só deixa entrar quem tem um token assinado pelo Next.js e salva o
// documento Yjs no Supabase (o disco do Render grátis é apagado ao reiniciar).

// Sem o segredo não dá para conferir token nenhum. Melhor não subir do que subir aberto.
const jwtSecret = process.env.COLLAB_JWT_SECRET;
if (!jwtSecret) {
  console.error("COLLAB_JWT_SECRET não configurada: o servidor de colaboração não sobe sem ela.");
  process.exit(1);
}
const secret = new TextEncoder().encode(jwtSecret);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

if (!supabase) {
  console.warn(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas: os documentos ficam só em memória e somem ao reiniciar.",
  );
}

// A sala de teste (dev e E2E) nunca é salva: cada execução começa com o documento vazio.
const TEST_DOCUMENT = "session-teste";

// O PostgREST entrega e recebe bytea como texto hexadecimal com o prefixo \x.
function toBytea(state: Uint8Array): string {
  return `\\x${Buffer.from(state).toString("hex")}`;
}

function fromBytea(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value.replace(/^\\x/, ""), "hex"));
}

// Sessão que ainda aceita edição. Encerrada (ou concluída, expirada, não compareceu), o
// documento vira o retrato final que a tela de resultado mostra: ninguém mais escreve.
const OPEN_STATUSES = new Set(["scheduled", "in_progress"]);
// De quanto em quanto tempo o status é conferido de novo para um documento aberto. É o
// tempo máximo que uma conexão já aberta ainda consegue editar depois do encerramento.
const STATUS_CACHE_MS = 5_000;

const openCache = new Map<string, { open: boolean; checkedAt: number }>();

// O documento ainda aceita edição? Sem banco configurado (dev) e na sala de teste, sempre.
// Se a consulta falhar, vale a última resposta conhecida (ou aberto, na primeira): uma
// falha do banco não pode derrubar uma sessão no meio.
async function isDocumentOpen(documentName: string): Promise<boolean> {
  if (!supabase || documentName === TEST_DOCUMENT) return true;

  const cached = openCache.get(documentName);
  // Sessão fechada não reabre: não precisa consultar de novo.
  if (cached && (!cached.open || Date.now() - cached.checkedAt < STATUS_CACHE_MS)) {
    return cached.open;
  }

  const { data, error } = await supabase
    .from("sessions")
    .select("status")
    .eq("id", documentName.replace(/^session-/, ""))
    .maybeSingle();

  if (error) return cached?.open ?? true;

  const open = data ? OPEN_STATUSES.has(data.status) : false;
  openCache.set(documentName, { open, checkedAt: Date.now() });
  return open;
}

const persistence = supabase
  ? new Database({
      async fetch({ documentName }) {
        if (documentName === TEST_DOCUMENT) return null;

        const { data, error } = await supabase
          .from("collab_documents")
          .select("state")
          .eq("name", documentName)
          .maybeSingle();

        // Falha de leitura recusa a conexão. Abrir o documento vazio aqui faria o próximo
        // salvamento apagar o que já estava guardado.
        if (error) throw new Error(`Falha ao carregar ${documentName}: ${error.message}`);
        return typeof data?.state === "string" ? fromBytea(data.state) : null;
      },

      async store({ documentName, state }) {
        if (documentName === TEST_DOCUMENT) return;

        const { error } = await supabase.from("collab_documents").upsert({
          name: documentName,
          state: toBytea(state),
          updated_at: new Date().toISOString(),
        });

        // O documento segue em memória e o Hocuspocus tenta salvar de novo na próxima edição.
        if (error) console.error(`Falha ao salvar ${documentName}: ${error.message}`);
      },
    })
  : null;

const server = new Server({
  port: Number(process.env.PORT ?? 1234),
  address: "0.0.0.0",

  async onRequest({ request, response }) {
    if (request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ app: "ok", service: "collab" }));
      // Rejeitar sem erro interrompe o handler padrão do Hocuspocus.
      return Promise.reject();
    }
  },

  // O token vem de POST /api/collab/token (Next.js), que já conferiu se a pessoa participa
  // da sessão e se está na hora. Aqui conferimos a assinatura, a validade e se o documento
  // pedido é o da sessão do token: um token não abre o documento de outra sessão.
  async onAuthenticate({ token, documentName }) {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    if (typeof payload.sessionId !== "string" || documentName !== `session-${payload.sessionId}`) {
      throw new Error("Sem acesso a esta sessão");
    }

    // O token vale 2h: sem isto, quem guardou um ainda reconectaria depois do encerramento.
    if (!(await isDocumentOpen(documentName))) {
      throw new Error("Sessão encerrada");
    }

    return { userId: payload.sub, name: payload.name };
  },

  // Conexão que já estava aberta quando a sessão foi encerrada: a mensagem é recusada
  // (o Hocuspocus fecha a conexão) antes de mudar o documento.
  async beforeHandleMessage({ documentName }) {
    if (!(await isDocumentOpen(documentName))) {
      throw new Error("Sessão encerrada");
    }
  },

  // O documento saiu da memória (todos desconectaram): o cache dele não serve mais.
  async afterUnloadDocument({ documentName }) {
    openCache.delete(documentName);
  },

  extensions: persistence ? [persistence] : [],
});

server.listen();
