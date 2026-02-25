import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      "/logbook": {
        target: "https://passage.localhost",
        changeOrigin: true,
        secure: false,
      },
      "/weather_forecast.php": {
        target: "https://passage.ijmacd.com",
        changeOrigin: true,
      },
      "/ais": {
        target: "https://passage.ijmacd.com",
        changeOrigin: true,
      },
      "/tides": {
        target: "https://passage.ijmacd.com",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});
