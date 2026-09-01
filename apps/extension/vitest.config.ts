import { defineConfig } from 'vitest/config'
import path from 'path'
import { loadEnv } from 'vite'

const webEnvDir = path.resolve(__dirname, '../web')
const env = loadEnv(process.env.NODE_ENV || 'test', webEnvDir, '')

export default defineConfig({
  define: {
    'import.meta.env.VITE_WEBAPP_URL': JSON.stringify(
      env.VITE_WEBAPP_URL || process.env.VITE_WEBAPP_URL || 'http://localhost:3000'
    ),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      env.VITE_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      ''
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    ),
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.ts', 'lib/**/*.test.ts', 'entrypoints/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
})
