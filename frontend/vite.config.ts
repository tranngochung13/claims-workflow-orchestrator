import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode, command, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = process.env.API_PROXY_TARGET ?? env.API_PROXY_TARGET;
  if (command === "serve" && !isPreview && mode !== "test" && !target)
    throw new Error(
      "Set API_PROXY_TARGET in frontend/.env.local (see .env.example).",
    );
  if (target && !["http:", "https:"].includes(new URL(target).protocol))
    throw new Error("API_PROXY_TARGET must be an HTTP(S) origin.");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: target ? { "/api": { target, changeOrigin: true } } : undefined,
    },
  };
});
