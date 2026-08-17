import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    /**
     * Anchors the clock so date tests are not a coin flip that fails once
     * a year on a leap day or at a daylight-saving change. Individual
     * tests override it with vi.setSystemTime where the moment matters.
     */
    env: {
      TZ: 'Europe/Oslo',
      /**
       * lib/supabase.ts throws at import time if these are missing, and
       * the pricing/loyalty modules import it. These are structurally
       * valid placeholders: createClient never opens a connection unless
       * a query runs, and no test runs one. Nothing here is a real
       * credential.
       */
      NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key-for-tests',
    },
  },
})
