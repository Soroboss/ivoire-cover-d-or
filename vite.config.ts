import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Chemins relatifs: OK pour déploiements sous sous-dossier et hébergement statique simple.
  base: './',
  plugins: [react()],
})
