import { defineConfig, type Plugin } from "vite";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/* Skulpt (Python yorumlayıcısı) modül değil, klasik betik: npm paketinden vendor/ altına kopyalanır ve <script> ile yüklenir. */
const require = createRequire(import.meta.url);
const SKULPT = { "vendor/skulpt.min.js": "skulpt/dist/skulpt.min.js", "vendor/skulpt-stdlib.js": "skulpt/dist/skulpt-stdlib.js" };
function skulpt(): Plugin {
  return {
    name: "skulpt-vendor",
    configureServer(s) {
      s.middlewares.use((req, res, next) => {
        const yol = Object.keys(SKULPT).find((k) => req.url?.endsWith("/" + k));
        if (!yol) return next();
        res.setHeader("Content-Type", "text/javascript");
        res.end(readFileSync(require.resolve(SKULPT[yol as keyof typeof SKULPT])));
      });
    },
    generateBundle() {
      for (const [ad, kaynak] of Object.entries(SKULPT)) this.emitFile({ type: "asset", fileName: ad, source: readFileSync(require.resolve(kaynak)) });
    }
  };
}
export default defineConfig({ base: "./", plugins: [skulpt()], build: { outDir: "dist", assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 } });
