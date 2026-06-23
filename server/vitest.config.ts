import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Integration tests share one in-memory app; run files sequentially so the
    // login rate-limiter counter is predictable.
    fileParallelism: false,
  },
});
