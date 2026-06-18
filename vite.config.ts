import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Draft-Battle/',
  // @ts-ignore — vitest config
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
