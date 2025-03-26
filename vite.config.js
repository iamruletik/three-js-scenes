import restart from 'vite-plugin-restart'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
    root: '.', // Sources files (typically where index.html is)
    publicDir: '../public/', // Path from "root" to static assets (files that are served as they are)
    server:
    {
        host: true, // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: '../build/', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
        rollupOptions: {
            input: {
              main: resolve(__dirname, 'index.html'),
              house: resolve(__dirname, '/hauntedhouse/index.html'),
            },
          },
    },
    plugins:
    [
        restart({ restart: [ '../static/**', ] }) // Restart server on static file change
    ],
}