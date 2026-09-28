import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./screenshots/src/", import.meta.url));

export default defineConfig({
  srcDir: "./screenshots/src",
  output: "server",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@wix/essentials": `${root}wix-essentials.ts`,
        "@wix/dashboard": `${root}wix-dashboard.ts`,
      },
    },
  },
  devToolbar: { enabled: false },
  server: { host: "127.0.0.1", port: 4333 },
});
