import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The site is served from the root of lightfoot.org (custom domain), so the base path stays "/".
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist" },
});
