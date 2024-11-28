import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

const isDev = process.env.NODE_ENV === "development";
const sourcePath = isDev ? "/" : "/white-board/";
// https://vite.dev/config/
export default defineConfig({
  base: sourcePath,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [react()],
});
