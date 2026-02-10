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
    rollupOptions: {
      output: {
        // 수동 청크 분리로 초기 로딩 속도 개선
        manualChunks: (id) => {
          // node_modules의 vendor 라이브러리 분리
          if (id.includes('node_modules')) {
            // React 관련 (최우선)
            if (id.includes('react') && !id.includes('@tanstack')) {
              return 'vendor-react'
            }
            // TanStack 라이브러리
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack'
            }
            // Swiper
            if (id.includes('swiper')) {
              return 'vendor-swiper'
            }
            // UI 라이브러리
            if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('sonner')) {
              return 'vendor-ui'
            }
            // Supabase & Axios
            if (id.includes('@supabase') || id.includes('axios')) {
              return 'vendor-data'
            }
          }
          // 관리자 페이지 분리
          if (id.includes('src/routes/admin')) {
            return 'admin'
          }
        },
        // 파일명 패턴 최적화
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Minification 최적화
    minify: 'esbuild', // terser 대신 더 빠른 esbuild 사용
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