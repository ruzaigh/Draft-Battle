import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/draft-battle/',
  // @ts-ignore — vitest config
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
