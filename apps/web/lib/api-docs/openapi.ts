import { z } from "zod";

import { RUN_OUTCOMES, runBodySchema } from "@/lib/room/run-code";
import { tokenBodySchema } from "@/lib/room/session";

// Documentação interativa da API (Swagger UI em /api/docs), só para desenvolvimento.
//
// A especificação descreve as rotas de app/api. Os corpos de requisição saem dos mesmos
// schemas zod que as rotas validam, então não dá para o documento divergir do código.
// Rota nova em app/api: acrescentar aqui.

// A documentação só existe no `next dev` da máquina de quem desenvolve. Em produção e
// no preview da Vercel (NODE_ENV=production nos dois) as rotas respondem 404. A checagem
// de VERCEL é a segunda trava: mesmo que alguém rode um dev server lá, continua fechado.
export function isApiDocsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "development" && !env.VERCEL;
}

type JsonSchema = Record<string, unknown>;

function bodySchema(schema: z.ZodType): JsonSchema {
  const jsonSchema: JsonSchema = z.toJSONSchema(schema, { io: "input" });
  // O dialeto já vem do próprio documento OpenAPI 3.1.
  delete jsonSchema.$schema;
  return jsonSchema;
}

function jsonContent(schema: JsonSchema) {
  return { content: { "application/json": { schema } } };
}

function errorResponse(description: string) {
  return { description, ...jsonContent({ $ref: "#/components/schemas/Error" }) };
}

const sessionIdProperty = { type: "string", format: "uuid" };
const tokenResponse = {
  description: "Token emitido",
  ...jsonContent({
    type: "object",
    required: ["token"],
    properties: { token: { type: "string", description: "JWT de curta duração" } },
  }),
};

// Respostas de authorizeRoomEntry, iguais nas três rotas da sala.
const roomEntryErrors = {
  400: errorResponse("Corpo inválido"),
  401: errorResponse("Sem login"),
  403: errorResponse("Fora da janela de horário, sessão encerrada ou não confirmada"),
  404: errorResponse("Sessão inexistente ou de outras pessoas"),
};

const sessionCookie = [{ supabaseSession: [] }];

export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Lugh API",
      version: "0.1.0",
      description:
        "Rotas internas do Lugh. As rotas autenticadas usam o cookie de sessão do Supabase: " +
        "entre no app nesta mesma origem (/login) e o Executar daqui já envia o cookie.",
    },
    tags: [
      { name: "Sala", description: "Tokens e execução de código da sala em tempo real" },
      { name: "Sessões", description: "Ciclo de vida da sessão" },
      { name: "Pagamentos", description: "PIX pela AbacatePay" },
      { name: "Webhooks", description: "Chamadas recebidas de serviços externos" },
      { name: "Infra" },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["Infra"],
          summary: "Confere se o app está no ar e se o Supabase responde",
          responses: {
            200: {
              description: "Estado do app",
              ...jsonContent({
                type: "object",
                required: ["app", "supabase"],
                properties: {
                  app: { type: "string", enum: ["ok"] },
                  supabase: { type: "string", enum: ["ok", "error", "not_configured"] },
                },
              }),
            },
          },
        },
      },
      "/api/livekit/token": {
        post: {
          tags: ["Sala"],
          summary: "Token de vídeo da sala (LiveKit)",
          description:
            "Só para participante da sessão, na janela de horário. Registra a entrada de quem " +
            "pediu e passa a sessão de scheduled para in_progress na primeira entrada.",
          security: sessionCookie,
          requestBody: { required: true, ...jsonContent(bodySchema(tokenBodySchema)) },
          responses: {
            200: tokenResponse,
            ...roomEntryErrors,
            500: errorResponse("LiveKit não configurado ou falha ao abrir a sala"),
          },
        },
      },
      "/api/collab/token": {
        post: {
          tags: ["Sala"],
          summary: "Token do editor e do quadro (Hocuspocus)",
          description: "Mesmas regras do token de vídeo. Não muda o status da sessão.",
          security: sessionCookie,
          requestBody: { required: true, ...jsonContent(bodySchema(tokenBodySchema)) },
          responses: {
            200: tokenResponse,
            ...roomEntryErrors,
            500: errorResponse("COLLAB_JWT_SECRET não configurado"),
          },
        },
      },
      "/api/code/run": {
        post: {
          tags: ["Sala"],
          summary: "Executa o código do editor no Judge0",
          description:
            "Só para participante da sessão, na janela de horário. A execução não é interativa: " +
            "a entrada inteira vai em stdin. Uma execução a cada 2 segundos por sessão.",
          security: sessionCookie,
          requestBody: {
            required: true,
            ...jsonContent(bodySchema(tokenBodySchema.extend(runBodySchema.shape))),
          },
          responses: {
            200: {
              description:
                "Resultado da execução. Falha do Judge0 também responde 200, com outcome failed.",
              ...jsonContent({
                type: "object",
                required: ["result"],
                properties: {
                  result: {
                    type: "object",
                    required: ["outcome", "output", "errorOutput", "timeSeconds"],
                    properties: {
                      outcome: { type: "string", enum: [...RUN_OUTCOMES] },
                      output: { type: "string" },
                      errorOutput: { type: "string" },
                      timeSeconds: { type: ["number", "null"] },
                    },
                  },
                },
              }),
            },
            ...roomEntryErrors,
            429: errorResponse("Execução repetida antes do intervalo mínimo"),
            503: errorResponse("Judge0 não configurado"),
          },
        },
      },
      "/api/sessions/{id}/end": {
        post: {
          tags: ["Sessões"],
          summary: "Entrevistador encerra a sessão",
          description:
            "in_progress → awaiting_feedback e derruba quem ainda está no vídeo. Repetir a " +
            "chamada devolve o mesmo resultado.",
          security: sessionCookie,
          parameters: [{ name: "id", in: "path", required: true, schema: sessionIdProperty }],
          responses: {
            200: {
              description: "Sessão encerrada",
              ...jsonContent({
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["awaiting_feedback"] } },
              }),
            },
            401: errorResponse("Sem login"),
            403: errorResponse("Quem chamou não é o entrevistador"),
            404: errorResponse("Sessão inexistente ou de outras pessoas"),
            409: errorResponse("Sessão fora de andamento, ou o candidato ainda não entrou"),
            500: errorResponse("Falha nossa"),
          },
        },
      },
      "/api/payments/create": {
        post: {
          tags: ["Pagamentos"],
          summary: "Devolve a cobrança PIX da sessão, criando se ainda não existe",
          description: "Só o candidato da sessão. Repetir devolve a mesma cobrança.",
          security: sessionCookie,
          requestBody: {
            required: true,
            ...jsonContent({
              type: "object",
              required: ["sessionId"],
              properties: { sessionId: sessionIdProperty },
            }),
          },
          responses: {
            200: {
              description:
                "pending_payment traz o PIX. Qualquer outro status significa que não há mais o que cobrar.",
              ...jsonContent({
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", examples: ["pending_payment", "scheduled", "expired"] },
                  payment: {
                    type: "object",
                    description: "Só quando status é pending_payment",
                    required: ["brCode", "brCodeBase64", "expiresAt", "amountCents"],
                    properties: {
                      brCode: { type: "string", description: "PIX copia e cola" },
                      brCodeBase64: { type: "string", description: "QR code em base64" },
                      expiresAt: { type: "string", format: "date-time" },
                      amountCents: { type: "integer" },
                    },
                  },
                },
              }),
            },
            400: errorResponse("Corpo inválido"),
            401: errorResponse("Sem login"),
            403: errorResponse("Quem chamou não é o candidato"),
            404: errorResponse("Sessão inexistente ou de outras pessoas"),
            500: errorResponse("Falha nossa ou da AbacatePay"),
          },
        },
      },
      "/api/payments/status": {
        get: {
          tags: ["Pagamentos"],
          summary: "Status do pagamento, conferido na AbacatePay",
          description:
            "A tela de pagamento consulta enquanto espera o PIX. Se a cobrança já foi paga, " +
            "confirma a sessão mesmo sem o webhook.",
          security: sessionCookie,
          parameters: [{ name: "sessionId", in: "query", required: true, schema: sessionIdProperty }],
          responses: {
            200: {
              description: "Status atual",
              ...jsonContent({
                type: "object",
                required: ["status", "paid"],
                properties: {
                  status: { type: "string", description: "Status atual da sessão" },
                  paid: { type: "boolean" },
                },
              }),
            },
            400: errorResponse("sessionId inválido"),
            401: errorResponse("Sem login"),
            404: errorResponse("Sessão inexistente, de outras pessoas, ou quem chamou é o entrevistador"),
            500: errorResponse("Falha nossa ou da AbacatePay"),
          },
        },
      },
      "/api/webhooks/abacatepay": {
        post: {
          tags: ["Webhooks"],
          summary: "AbacatePay avisa que um PIX foi pago",
          description:
            "Sem login: o secret prova a origem e a assinatura prova que o corpo não foi " +
            "alterado. Antes de confirmar, a rota confere a cobrança na AbacatePay. Idempotente.",
          security: [{ webhookSecret: [], webhookSignature: [] }],
          requestBody: {
            required: true,
            ...jsonContent({ type: "object", description: "Evento da AbacatePay, como ela envia" }),
          },
          responses: {
            200: {
              description: "Recebido (processado ou ignorado)",
              ...jsonContent({
                type: "object",
                required: ["received"],
                properties: { received: { type: "boolean" } },
              }),
            },
            401: errorResponse("Secret ou assinatura inválidos"),
            500: errorResponse("Falha ao confirmar o pagamento (a AbacatePay reenvia)"),
            503: errorResponse("Webhook não configurado, ou AbacatePay fora do ar"),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        supabaseSession: {
          type: "apiKey",
          in: "cookie",
          name: "sb-<projeto>-auth-token",
          description: "Cookie criado pelo login do app. O navegador envia sozinho na mesma origem.",
        },
        webhookSecret: { type: "apiKey", in: "header", name: "x-webhook-secret" },
        webhookSignature: { type: "apiKey", in: "header", name: "x-webhook-signature" },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "string", description: "Mensagem para mostrar na tela" } },
        },
      },
    },
  };
}
