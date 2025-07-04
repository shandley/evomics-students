import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/evomics-students/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'maps': ['leaflet', 'react-leaflet'],
          // Data files as separate chunks
          'student-data': ['./src/data/studentData.json'],
          'workshops-data': ['./src/data/workshops.json']
        }
      }
    },
    // Increase chunk size warning limit since we're handling large datasets
    chunkSizeWarningLimit: 1000
  }
})
