// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On case-insensitive filesystems (Windows/macOS), a request for the
// "/license" client route resolves to the repo-root LICENSE file before
// Vite's own SPA history fallback gets a chance to run, so the dev server
// tries to serve/transform that plain-text file instead of index.html. This
// plugin rewrites such navigation requests to "/" early enough to avoid that.
function spaFallbackBeforeFsResolve() {
  return {
    name: 'spa-fallback-before-fs-resolve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          return next();
        }

        const pathname = (req.url || '').split('?')[0];
        const lastSegment = pathname.split('/').pop() || '';
        const acceptsHtml = (req.headers.accept || '').includes('text/html');
        const isAppRoute =
          acceptsHtml &&
          pathname !== '/' &&
          !pathname.startsWith('/@') &&
          !pathname.startsWith('/node_modules/') &&
          !lastSegment.includes('.');

        if (isAppRoute) {
          req.url = '/';
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallbackBeforeFsResolve()],
  build: {
    outDir: 'build', // CRA's default build output
  },
  base: '',
  server: {
          allowedHosts: [
                  'localhost',
                  '127.0.0.1',
          ],
          fs: {
                  // Defense in depth: never serve the raw LICENSE file's contents even
                  // if something reaches the filesystem-serving path directly.
                  deny: ['LICENSE'],
          },
  }
});
