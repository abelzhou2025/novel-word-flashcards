
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: Removed unused `env` variable and `loadEnv` call which was causing a type error with `process.cwd()`.
  return {
    plugins: [react()],
    // This makes asset paths relative, which is required for GitHub Pages.
    // If you deploy to a subdirectory, e.g., `https://<user>.github.io/<repo>/`,
    // you might need to change this to `base: '/<repo>/'`.
    base: './'
  }
})