import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is injected by CI for GitHub Pages deployment.
// Locally it defaults to '/' so dev server works as normal.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
})
