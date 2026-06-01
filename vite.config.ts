import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    // Đã xóa phần hmr rườm rà để Vite tự động quản lý WebSocket một cách trơn tru nhất
  },
});