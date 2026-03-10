// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // CRA's default build output
  },
  base: import.meta.VITE_DOMAIN_SUBDIRECTORY ? `/${import.meta.VITE_DOMAIN_SUBDIRECTORY}/` : '',
  server: {
          allowedHosts: [
                  'localhost',
                  '127.0.0.1',
          ],
  }
});