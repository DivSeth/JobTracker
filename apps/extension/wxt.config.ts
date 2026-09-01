import path from 'node:path'
import { defineConfig } from 'wxt'
import { loadEnv } from 'vite'

const webEnvDir = path.resolve(__dirname, '../web')

function resolveExtensionEnv(mode: string) {
  const env = loadEnv(mode, webEnvDir, '')

  return {
    webappUrl:
      env.VITE_WEBAPP_URL ||
      process.env.VITE_WEBAPP_URL ||
      'http://localhost:3000',
    supabaseUrl:
      env.VITE_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      '',
    supabaseAnonKey:
      env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '',
  }
}

const env = resolveExtensionEnv(process.env.NODE_ENV || 'development')

export default defineConfig({
  srcDir: '.',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    define: {
      'import.meta.env.VITE_WEBAPP_URL': JSON.stringify(env.webappUrl),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.supabaseAnonKey),
    },
    resolve: {
      alias: {
        react: path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      },
    },
  }),
  manifest: {
    name: 'AutoApply',
    description: 'One-click ATS auto-fill powered by your application profiles',
    version: '0.1.0',
    permissions: ['storage', 'alarms', 'activeTab', 'tabs'],
    host_permissions: [
      '*://*.myworkdayjobs.com/*',
      '*://boards.greenhouse.io/*',
      '*://job-boards.greenhouse.io/*',
      '*://autoapply-seven.vercel.app/*',
    ],
  },
  runner: {
    startUrls: ['https://boards.greenhouse.io/'],
  },
})
