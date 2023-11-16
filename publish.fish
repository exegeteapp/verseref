#!/usr/bin/env fish

rm -rf npm && deno run -A scripts/build_npm.ts $argv[1] && cd npm && npm publish
