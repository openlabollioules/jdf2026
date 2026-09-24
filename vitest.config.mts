import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": r("./src"),
      // `server-only` lève une erreur hors du bundler Next : neutralisé pour les tests.
      "server-only": r("./src/test/empty.ts"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
