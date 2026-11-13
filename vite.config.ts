import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import analyzePhoto from './api/analyze-photo.js';
import embed from './api/embed.js';

/** Serves the Gemini routes during `npm run dev`. Production uses the Vercel functions. */
function localApi(env: Record<string, string>): Plugin {
  return {
    name: 'foundit-local-api',
    configureServer(server) {
      if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
      const mount = (route: string, handler: typeof embed) => {
        server.middlewares.use(route, (req, res, next) => {
          if (req.method !== 'POST') {
            next();
            return;
          }
          void handler(req, res);
        });
      };
      mount('/api/embed', embed);
      mount('/api/analyze-photo', analyzePhoto);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), localApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
