import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const isDev = process.env.NODE_ENV === "development";
const sourcePath = isDev ? "/" : "/mini-fabric-whiteboard/";
// https://vite.dev/config/
export default defineConfig({
  base: sourcePath,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    svgr({
      exclude: /node_modules/,
      include: /assets\/svgs/,
      svgrOptions: {
        icon: true,
      },
    }),
    react(),
  ],
});
