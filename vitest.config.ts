import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // server-only throws when imported outside the RSC bundler; stub it in tests
      "server-only": path.resolve(__dirname, "test/stubs/empty.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
