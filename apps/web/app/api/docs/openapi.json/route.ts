import { connection } from "next/server";

import { buildOpenApiSpec, isApiDocsEnabled } from "@/lib/api-docs/openapi";

// GET /api/docs/openapi.json: a especificação OpenAPI que o Swagger UI de /api/docs lê.
// Só em desenvolvimento: em produção e no preview da Vercel responde 404.
export async function GET() {
  await connection(); // decide a cada request, nunca pré-renderiza

  if (!isApiDocsEnabled()) {
    return Response.json({ error: "Não encontrado" }, { status: 404 });
  }

  return Response.json(buildOpenApiSpec(), { headers: { "Cache-Control": "no-store" } });
}
