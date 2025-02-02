import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: process.env.NODE_ENV === "development" ? {
    host: "0.0.0.0", // Allows access from your local network
    port: 5173,
  } : undefined,
})
