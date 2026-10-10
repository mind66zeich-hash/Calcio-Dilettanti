import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + HashRouter: funziona su GitHub Pages in qualunque sottocartella
export default defineConfig({
  plugins: [react()],
  base: './',
})
