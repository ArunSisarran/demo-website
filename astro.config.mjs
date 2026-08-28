import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://cellarandvine.netlify.app',
  vite: { plugins: [tailwindcss()] },
});
