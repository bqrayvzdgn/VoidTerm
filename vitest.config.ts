import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
      'electron/**/__tests__/**/*.test.ts'
    ],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/store/**', 'electron/**'],
      exclude: ['**/__tests__/**', '**/types/**']
    }
  }
})
