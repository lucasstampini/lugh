import { Server } from "@hocuspocus/server";

// Fase 0: servidor mínimo, sem autenticação nem persistência.
// Fase 1 adiciona o editor/quadro; fase 5 adiciona onAuthenticate (JWT) e Database (Supabase).

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
});

server.listen();
