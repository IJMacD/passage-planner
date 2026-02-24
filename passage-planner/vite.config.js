import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
    origin: "http://127.0.0.1:5173",
    proxy: {
      "/logbook": {
        target: "https://passage.ijmacd.com",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});
