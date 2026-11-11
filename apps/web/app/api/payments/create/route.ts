import { z } from "zod";
import { ensurePayment } from "@/lib/payments";
import { getSessionForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

const OUR_FAULT =
  "Não deu para gerar o PIX agora. O problema é do nosso lado. Tente de novo em alguns segundos.";

const bodySchema = z.object({ sessionId: z.uuid() });

// POST /api/payments/create  { sessionId }
// Devolve a cobrança PIX da sessão, criando se ainda não existe. A action de agendar já
// tenta criar; esta rota é o caminho de quem reabre a tela ou de quando a primeira
// tentativa falhou. Só o candidato da sessão paga. Repetir devolve a mesma cobrança.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Sessão inválida" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Sessão inválida" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Entre na sua conta para pagar a sessão." }, { status: 401 });
  }

  try {
    // Sessão inexistente ou de outras pessoas: a mesma resposta, sem revelar qual foi.
    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return Response.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    if (session.role !== "candidate") {
      return Response.json({ error: "Só o candidato paga a sessão." }, { status: 403 });
    }

    const result = await ensurePayment(session.id);

    switch (result.kind) {
      case "pending":
        return Response.json({ status: "pending_payment", payment: result.payment });
      case "settled":
        return Response.json({ status: result.status });
      case "expired":
        return Response.json({ status: "expired" });
      case "not_found":
        return Response.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
  } catch {
    return Response.json({ error: OUR_FAULT }, { status: 500 });
  }
}
