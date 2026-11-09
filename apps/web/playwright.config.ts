import { defineConfig, devices } from "@playwright/test";

// E2E da sala: dois navegadores reais entram em /sala/teste e conversam entre si.
// Precisa do .env.local preenchido (LiveKit) e, a partir do editor, do apps/collab rodando.
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
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
