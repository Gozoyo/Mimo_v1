import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Mimo_v1/" : "/",
  plugins: [react()],
  server: {
    allowedHosts: [".loca.lt", ".trycloudflare.com"]
  },
  preview: {
    allowedHosts: [".loca.lt", ".trycloudflare.com"]
  }
}));
