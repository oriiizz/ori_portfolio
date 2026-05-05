import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
      /** 与仓库并排：personal/assets（封面、项目媒体可放这里） */
      '@workspaceAssets': path.resolve(__dirname, '../assets'),
    },
  },
  publicDir: 'public',
  server: {
    fs: {
      // contentConfig 里 import.meta.glob 会读上一级 personal/assets
      allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '.')],
    },
  },
})
