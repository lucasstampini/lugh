import { authorizeRoomEntry } from "@/lib/room/access";
import { readJudge0Config, runBodySchema, runOnJudge0 } from "@/lib/room/run-code";

// POST /api/code/run  { sessionId, name?, language, code }
// Roda o código do editor no Judge0 e devolve o resultado. Só para participante da sessão
// e na janela de horário (a mesma checagem das rotas de token), para a chave do Judge0 não
// virar um executor de código aberto. A chave só existe aqui no servidor.
export async function POST(request: Request) {
  // authorizeRoomEntry consome o corpo: o clone fica para ler linguagem e código depois.
  const entry = await authorizeRoomEntry(request.clone());
  if (!entry.ok) {
    return Response.json({ error: entry.error }, { status: entry.status });
  }

  const parsed = runBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Código inválido" }, { status: 400 });
  }

  const config = readJudge0Config();
  if (!config) {
    return Response.json(
      { error: "Execução de código não configurada no servidor (JUDGE0_API_KEY)." },
      { status: 503 },
    );
  }

  const result = await runOnJudge0(config, parsed.data);
  return Response.json({ result });
}
