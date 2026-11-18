/* Testte Skulpt'u yükler (tarayıcıda <script> etiketiyle gelir). */
import { createRequire } from "node:module";
(globalThis as any).window = globalThis;
const require = createRequire(import.meta.url);
require("skulpt/dist/skulpt.min.js");
require("skulpt/dist/skulpt-stdlib.js");
