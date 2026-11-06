import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const page = (name: string) => fileURLToPath(new URL(name, import.meta.url));

// The site is served from the root of lightfoot.trustroots.org (custom domain), so the base path
// stays "/". Two pages: the map app (index.html) and the pre-launch placeholder (placeholder.html),
// which deploy.yml publishes as the home page until the map launches.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: { index: page("index.html"), placeholder: page("placeholder.html") },
    },
  },
});
