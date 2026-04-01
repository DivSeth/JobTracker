import path from 'node:path'
import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: '.',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
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
    ],
  },
  runner: {
    startUrls: ['https://boards.greenhouse.io/'],
  },
})
