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

    return { userId: payload.sub, name: payload.name };
  },

  extensions: persistence ? [persistence] : [],
});

server.listen();
