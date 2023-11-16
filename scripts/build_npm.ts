// ex. scripts/build_npm.ts
import { build, emptyDir } from "dnt";

await emptyDir("./npm");

await build({
    entryPoints: ["./index.ts"],
    outDir: "./npm",
    shims: {
        // see JS docs for overview and more options
        deno: true,
    },
    package: {
        // package.json properties
        name: "verseref",
        version: Deno.args[0],
        description: "a library for parsing bible verse references",
        license: "LGPL-3.0-or-later",
        repository: {
            type: "git",
            url: "git+https://github.com/exegeteapp/verseref.git",
        },
        bugs: {
            url: "git+https://github.com/exegeteapp/verseref/issues",
        },
    },
    postBuild() {
        // steps to run after building and before running the tests
        Deno.copyFileSync("LICENSE", "npm/LICENSE");
        Deno.copyFileSync("README.md", "npm/README.md");
    },
});
