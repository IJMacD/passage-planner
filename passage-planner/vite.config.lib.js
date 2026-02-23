import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: resolve(__dirname, "src/library.jsx"),
            name: "passagePlanner",
            fileName: "passage-planner-lib",
        },
    },
    define: { "process.env.NODE_ENV": '"production"' },
});
