#!/bin/bash
# Build script that ensures TURBOPACK=0 is set for all build processes
export TURBOPACK=0
next build && npx @cloudflare/next-on-pages

