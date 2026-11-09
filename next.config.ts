import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagem Docker / Lightsail: só o necessário para `node server.js`.
  output: "standalone",
  // pdf-parse/pdfjs + canvas nativo: fora do bundle; tracing inclui binários
  // Linux para o standalone Docker (Lightsail).
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/pdf-parse/**/*",
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
    ],
  },
  experimental: {
    // Importação de pasta inteira (múltiplos documentos de uma vez) pode
    // facilmente passar do limite padrão de 1MB por requisição de Server Action.
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
