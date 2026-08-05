import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEmbeddedLoginPublicKey(env) {
  if (env.VITE_LOGIN_RSA_PUBLIC_KEY) {
    return env.VITE_LOGIN_RSA_PUBLIC_KEY.replace(/\\n/g, '\n')
  }
  const pemPath = path.resolve(__dirname, '../life-claim-backend/keys/login_public.pem')
  if (fs.existsSync(pemPath)) {
    return fs.readFileSync(pemPath, 'utf8')
  }
  return ''
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_PROXY_TARGET ||
    env.REACT_APP_PROXY_TARGET ||
    'https://192.168.60.62:3010'
  const loginRsaPublicKey = loadEmbeddedLoginPublicKey(env)

  return {
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      __LOGIN_RSA_PUBLIC_KEY__: JSON.stringify(loginRsaPublicKey),
    },
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'build',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts')) return 'recharts'
            if (id.includes('node_modules/xlsx')) return 'xlsx'
            if (id.includes('node_modules/lucide-react')) return 'lucide'
          },
        },
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Vitest config (roadmap 0.5 — test harness skeleton). Picked up by Vitest
    // from this same file; has no effect on `vite dev`/`vite build`.
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        // Scope coverage to the modules under test today; widen as the suite grows.
        include: [
          'src/util/percentDisplay.js',
          'src/util/statusBadgeTone.js',
          'src/util/workflowRoles.js',
          'src/util/claimDaysOpen.js',
          'src/components/BrandLogo.jsx',
        ],
        // Enforced in CI via `npm run test:coverage`.
        thresholds: { statements: 85, branches: 70, functions: 95, lines: 85 },
      },
    },
  }
})
