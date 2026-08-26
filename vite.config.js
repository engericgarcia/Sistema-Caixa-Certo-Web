import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Em desenvolvimento, tudo que começa com /api é encaminhado para a API,
      // evitando qualquer configuração de CORS na máquina local.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: {
      // Separa React e Recharts do código da aplicação para o cache
      // do navegador aproveitar melhor entre deploys.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
