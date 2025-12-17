import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // 插件配置：启用React官方插件
  plugins: [react()],
  // 解析配置：设置路径别名，方便组件导入
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 若项目有src目录可启用，无则注释
      components: path.resolve(__dirname, './components'),
      types: path.resolve(__dirname, './types.ts'),
    },
    // 拓展文件后缀解析，避免导入时写后缀
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  // 服务器配置：解决开发时跨域、端口冲突问题
  server: {
    port: 3000, // 自定义开发端口
    open: true, // 启动后自动打开浏览器
    cors: true, // 允许跨域请求
    host: '0.0.0.0', // 允许局域网访问
  },
  // 构建配置：优化Three.js等大依赖的打包
  build: {
    outDir: 'dist', // 打包输出目录
    sourcemap: false, // 生产环境关闭sourcemap，减小体积
    rollupOptions: {
      // 优化Three.js的打包分割
      external: [],
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          mediapipe: ['@mediapipe/tasks-vision'],
        },
      },
    },
    // 压缩配置：启用gzip压缩
    minify: 'esbuild',
  },
  // 优化依赖预构建：避免重复打包
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@mediapipe/tasks-vision',
    ],
  },
});
