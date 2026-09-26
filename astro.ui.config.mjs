import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
// Isolated UI development; authenticated Wix integration uses the default config.
export default defineConfig({output:'server',integrations:[react()],vite:{plugins:[tailwindcss()]},devToolbar:{enabled:false}});
