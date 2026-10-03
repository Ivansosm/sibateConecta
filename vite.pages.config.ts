import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const base=process.env.PAGES_BASE_PATH||'/sibateConecta/';
export default defineConfig({
 root:fileURLToPath(new URL('./pages-demo/',import.meta.url)),
 base,
 publicDir:fileURLToPath(new URL('./public/',import.meta.url)),
 plugins:[react()],
 build:{outDir:fileURLToPath(new URL('./dist-pages/',import.meta.url)),emptyOutDir:true},
});
