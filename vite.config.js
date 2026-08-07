import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Samler hele appen til én index.html i dist/ ved `npm run build`.
// Da fungerer GitHub Pages nøyaktig som før — én fil — men kildekoden
// er delt i mange små, ryddige filer under src/.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
})
