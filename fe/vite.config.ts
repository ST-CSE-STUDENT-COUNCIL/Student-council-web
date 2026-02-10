import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      // 이미지 최적화 설정
      png: {
        quality: 80, // PNG 품질 (0-100)
      },
      jpeg: {
        quality: 80, // JPEG 품질 (0-100)
      },
      jpg: {
        quality: 80, // JPG 품질 (0-100)
      },
      webp: {
        quality: 80, // WebP 품질 (0-100)
        lossless: false,
      },
      // SVG 최적화
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupIds: false,
                removeViewBox: false,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  build: {
    // 청크 크기 최적화
    chunkSizeWarningLimit: 1000,
    // Minification 최적화
    minify: 'esbuild',
    // Source map 비활성화 (production)
    sourcemap: false
  },
  // 최적화 설정
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@tanstack/react-router'
    ]
  }
})