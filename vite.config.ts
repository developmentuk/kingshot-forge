import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [react()],

  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __DEPLOYMENT_ENV__: JSON.stringify(process.env.VERCEL_ENV ?? 'local'),
    __COMMIT_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'),
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
