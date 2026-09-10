import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    isolate: true, // 테스트 간 전역 상태/DOM 오염 방지를 위해 파일별 격리 유지
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './'),
    },
  },
});
