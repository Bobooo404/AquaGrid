import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss()
  ],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api/get-state": {
        target: "https://server.manurobotics.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/auto_logs_2/api"),
      },
    },
  },
})
