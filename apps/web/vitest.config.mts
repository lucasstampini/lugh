import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes unitários e de integração (Node). Os E2E com navegador ficam no Playwright (e2e/).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
