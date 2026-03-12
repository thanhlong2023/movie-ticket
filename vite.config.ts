import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/n8n-proxy/chat": {
        target: "https://thuydo.app.n8n.cloud",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(/^\/n8n-proxy\/chat/, "/webhook/chatbox"),
      },
    },
  },
});
