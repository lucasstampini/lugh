import { defineConfig, devices } from "@playwright/test";

// E2E da sala: dois navegadores reais entram em /sala/teste e conversam entre si.
// Precisa do .env.local preenchido (LiveKit) e, a partir do editor, do apps/collab rodando.
// O collab só aceita token assinado com o mesmo segredo do Next. Nos E2E os dois sobem com
// este segredo de teste (variável do processo vence o .env.local e o .env do collab).
const COLLAB_JWT_SECRET = "segredo-so-dos-testes-e2e-com-32-chars";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  // Os testes compartilham a mesma sala "teste": rodar em paralelo misturaria participantes.
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    ...devices["Desktop Chrome"],
    // No Windows com Smart App Control, o Chromium do Playwright é bloqueado por não ser assinado.
    // Nesse caso rode com PW_CHANNEL=msedge (ou chrome) para usar o navegador instalado.
    channel: process.env.PW_CHANNEL,
    permissions: ["camera", "microphone"],
    launchOptions: {
      // Câmera e microfone falsos: o Chrome gera um vídeo de teste e um bipe.
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  webServer: [
    {
      // Servidor de colaboração (Hocuspocus) local, para o editor e o quadro.
      command: "npm run dev --prefix ../collab",
      url: "http://localhost:1234/health",
      reuseExistingServer: true,
      timeout: 60_000,
      env: { COLLAB_JWT_SECRET },
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
      // Variável do processo vence o .env.local: os testes usam o collab local, não o Render.
      // Se já houver um `npm run dev` rodando, ele é reaproveitado com a URL e o segredo que estiverem
      // nele: nesse caso o collab local precisa do mesmo COLLAB_JWT_SECRET do .env.local.
      env: { NEXT_PUBLIC_COLLAB_URL: "ws://localhost:1234", COLLAB_JWT_SECRET },
    },
  ],
});
