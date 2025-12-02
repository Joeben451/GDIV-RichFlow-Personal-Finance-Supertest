import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
  // Vite serves files from 'public' folder at root path
  publicDir: 'public',
  // Define environment variables (replaces webpack.DefinePlugin)
  define: {
    // Access via import.meta.env.VITE_API_URL in your code
  },
});

