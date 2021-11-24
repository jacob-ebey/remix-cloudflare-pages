let esbuild = require("esbuild");

const mode = (process.env.NODE_ENV || "development").toLowerCase();

console.log(`[Worker] Running esbuild in ${mode} mode`);

esbuild
  .build({
    entryPoints: ["./worker/index.ts"],
    bundle: true,
    minify: mode === "production",
    format: "esm",
    define: {
      "process.env.NODE_ENV": `"${mode}"`,
    },
    outfile: "./functions/[[remix]].js",
    // outfile: "./public/_worker.js",
  })
  .then((res) => {
    if (res.errors.length > 1) {
      console.log(res.errors);
      process.exit(1);
    }
    console.log("DONE!");
  })
  .catch(() => process.exit(1));
