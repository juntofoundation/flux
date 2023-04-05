(async () => {
  let esbuild = require("esbuild");
  let {
    minifyHTMLLiteralsPlugin,
  } = require("esbuild-plugin-minify-html-literals");

  const isDev = process.env.NODE_ENV === "dev";

  let result = await esbuild
    .build({
      entryPoints: ["./src/main.ts"],
      metafile: !isDev,
      bundle: true,
      format: "esm",
      minify: true,
      sourcemap: true,
      target: isDev ? "safari11" : "es2016",
      outfile: "dist/main.js",
      watch: !!isDev,
      plugins: isDev ? [] : [minifyHTMLLiteralsPlugin()],
    })
    .catch(() => process.exit(1));

  if (!isDev) {
    // Report results
    let resultText = await esbuild.analyzeMetafile(result.metafile);
    console.log(resultText);

    // Create meta.json file
    require("fs").writeFileSync("meta.json", JSON.stringify(result.metafile));
  }
})();