import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";

export default {
  input: "src/entry.js",
  output: {
    dir: "dist/",
    format: "es",
    entryFileNames: "entry.js",
    sourcemap: true
  },
  plugins: [
    alias({
      entries: [
        { find: "$lib", replacement: "./src/lib" },
        { find: "$src", replacement: "./src" }
      ]
    }),
    svelte({
      emitCss: false,
      compilerOptions: {
        css: "injected",
        runes: true
      }
    }),
    resolve({
      browser: true,
      dedupe: ["svelte"]
    }),
    commonjs()
  ]
};
