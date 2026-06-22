import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tailwind v4 entra via plugin do Vite (sem tailwind.config.js).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
