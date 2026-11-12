import { z } from "zod";
import { refreshPaymentStatus } from "@/lib/payments";
import { getSessionForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

const OUR_FAULT = "Não deu para conferir o pagamento. O problema é do nosso lado.";

// GET /api/payments/status?sessionId=<id>
// A tela de pagamento consulta esta rota enquanto espera o PIX. Além de ler o banco, ela
// confere a cobrança na AbacatePay e confirma a sessão se já foi paga: assim a tela
// avança mesmo quando o webhook atrasa (e em localhost, que não recebe webhook).
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const parsed = z.uuid().safeParse(sessionId);
  if (!parsed.success) {
    return Response.json({ error: "Sessão inválida" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Entre na sua conta para ver o pagamento." }, { status: 401 });
  }

  try {
    const session = await getSessionForUser(parsed.data, user.id);
    // O entrevistador não acompanha o pagamento: para ele, a mesma resposta de sessão alheia.
    if (!session || session.role !== "candidate") {
      return Response.json({ error: "Sessão não encontrada" }, { status: 404 });
    }

    const status = await refreshPaymentStatus(session.id);
    if (!status) {
      return Response.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    return Response.json(status);
  } catch {
    return Response.json({ error: OUR_FAULT }, { status: 500 });
  }
}
