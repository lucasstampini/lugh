import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Sem isso, abrir o app por 127.0.0.1 (em vez de localhost) bloqueia os
  // recursos de hot-reload do dev server e quebra a hidratação do React.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // O padrão é 1 MB e a foto de perfil (uploadAvatar) aceita até 4 MB.
    // A folga cobre o overhead do multipart.
    serverActions: { bodySizeLimit: "5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
