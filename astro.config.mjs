import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({site:'https://www.vendbi.com', output:'static', trailingSlash:'always',vite:{plugins:[tailwindcss()]}});
