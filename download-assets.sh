#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
#  download-assets.sh — Fetch all v86 + TinyCore assets
#  Run from the project root:  bash download-assets.sh
# ──────────────────────────────────────────────────────────
set -euo pipefail

PUBLIC_DIR="./public"
mkdir -p "$PUBLIC_DIR"
cd "$PUBLIC_DIR"

echo "╔══════════════════════════════════════════════════╗"
echo "║       Web VM 2.0 — Asset Downloader              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

V86_BASE="https://raw.githubusercontent.com/copy/v86/master"

# ── 1. v86 Engine ──────────────────────────────────────
echo "[1/5] Downloading v86.wasm …"
curl -L -O "${V86_BASE}/build/v86.wasm"

echo "[2/5] Downloading libv86.js …"
curl -L -O "${V86_BASE}/build/libv86.js"

# ── 2. BIOS ROMs ──────────────────────────────────────
echo "[3/5] Downloading seabios.bin …"
curl -L -O "${V86_BASE}/bios/seabios.bin"

echo "[4/5] Downloading vgabios.bin …"
curl -L -O "${V86_BASE}/bios/vgabios.bin"

# ── 3. Tiny Core Linux ISO ────────────────────────────
echo "[5/5] Downloading TinyCore-current.iso (14.x, ~23 MB) …"
curl -L -o TinyCore-current.iso \
  "http://tinycorelinux.net/14.x/x86/release/TinyCore-current.iso"

echo ""
echo "✅  All assets downloaded to ${PUBLIC_DIR}/"
ls -lh *.wasm *.js *.bin *.iso
