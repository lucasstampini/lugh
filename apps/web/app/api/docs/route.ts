import { connection } from "next/server";

import { isApiDocsEnabled } from "@/lib/api-docs/openapi";

// Versão fixa e hash de integridade: se o arquivo do CDN mudar, o navegador não executa.
const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.36.0";
const BUNDLE_INTEGRITY = "sha384-fUpRgC19yPykTqzdrUbdAg8NTiu16NEKf9U12J+IJWCg8/1mEI8f2+PEIz60Wyd+";
const STYLES_INTEGRITY = "sha384-z/AtSaOHGn5MJ5auAHXUypohywlIWLBZo1jeGmhdpVIbCnFhxAH92cwdV41oyINc";

const PAGE = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Lugh API</title>
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" integrity="${STYLES_INTEGRITY}" crossorigin="anonymous" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI}/swagger-ui-bundle.js" integrity="${BUNDLE_INTEGRITY}" crossorigin="anonymous"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: "#swagger-ui",
        tryItOutEnabled: true,
      });
    </script>
  </body>
</html>`;

// GET /api/docs: Swagger UI com as rotas da API, para ver e executar à mão.
// Só em desenvolvimento: em produção e no preview da Vercel responde 404. As chamadas
// feitas daqui passam pelas mesmas checagens de login e permissão de qualquer outra.
export async function GET() {
  await connection(); // decide a cada request, nunca pré-renderiza

  if (!isApiDocsEnabled()) {
    return Response.json({ error: "Não encontrado" }, { status: 404 });
  }

  return new Response(PAGE, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
